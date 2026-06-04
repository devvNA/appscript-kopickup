/**
 * webapp.gs.js - Web Application Controllers & Entry Points
 * Handles doGet page delivery and acts as the secure RPC gateway for client-side interactions.
 */

/**
 * Main Web Server entry point. Deliver HTML5 single-page application.
 */
function doGet(e) {
  // Ensure database sheets exist before serving page
  try {
    initDatabase();
  } catch (err) {
    Logger.log("Auto-initialization during doGet failed: " + err.toString());
  }
  
  var session = false;
  try {
    session = checkSession();
  } catch (err) {
    Logger.log("checkSession in doGet failed: " + err.toString());
  }
  var templateName = session ? "main" : "index";
  
  var template;
  try {
    template = HtmlService.createTemplateFromFile(templateName);
  } catch(err) {
    // Fallback if main.html doesn't exist yet
    template = HtmlService.createTemplateFromFile("index");
  }
  
  // Bind dynamic server variables to template
  var activeEmail = "";
  try {
    activeEmail = Session.getActiveUser().getEmail();
  } catch (e) {}
  
  template.activeGoogleEmail = activeEmail;
  template.databaseId = getSpreadsheet().getId();
  
  return template.evaluate()
    .setTitle("Kopickup POS - Modern Ethnic Coffee Truck")
    .addMetaTag("viewport", "width=device-width, initial-scale=1.0")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Include helper for loading nested HTML pieces (e.g. styles, scripts) if separated.
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ==========================================
//          SECURE RPC CONTROLLERS
// ==========================================

function rpcInitDatabase() {
  try {
    initDatabase();
    return { success: true, message: "Database tables initialized and seeded successfully." };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function rpcGetCurrentUser() {
  try {
    var user = getCurrentUser();
    return { success: true, user: user };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}



function rpcProcessLogin(email, password) {
  try {
    return processLogin(email, password);
  } catch(e) {
    return { success: false, message: e.toString() };
  }
}

function rpcProcessRegister(email, password, name) {
  try {
    return processRegister(email, password, name);
  } catch(e) {
    return { success: false, message: e.toString() };
  }
}

function rpcProcessLogout() {
  try {
    return processLogout();
  } catch(e) {
    return { success: false, message: e.toString() };
  }
}

function rpcGetActiveShift() {
  try {
    var shift = getActiveShift();
    return { success: true, shift: shift };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function rpcOpenShift(openCash, activeUser) {
  try {
    return openShift(openCash, activeUser);
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function rpcCloseShift(shiftId, closeCash, activeUser) {
  try {
    return closeShift(shiftId, closeCash, activeUser);
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function rpcGetProducts() {
  try {
    var products = getProducts();
    return { success: true, products: products };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function rpcCreateProduct(productData, activeUser) {
  try {
    return createProduct(productData, activeUser);
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function rpcUpdateProduct(id, updatedFields, activeUser) {
  try {
    return updateProduct(id, updatedFields, activeUser);
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function rpcAdjustStock(id, newStock, reason, activeUser) {
  try {
    return adjustStock(id, newStock, reason, activeUser);
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function rpcCheckoutOrder(orderData, activeUser) {
  try {
    return checkoutOrder(orderData, activeUser);
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function rpcVoidOrRefundTransaction(txId, actionType, reason, activeUser) {
  try {
    return voidOrRefundTransaction(txId, actionType, reason, activeUser);
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function rpcGetReceiptDetails(txId) {
  try {
    var details = getReceiptDetails(txId);
    return { success: true, details: details };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function rpcGetAuditLogs(activeUser) {
  try {
    requireRole(activeUser, ["ADMIN", "OWNER"]);
    var logs = getAuditLogs();
    return { success: true, logs: logs };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function rpcGetTransactions(activeUser) {
  try {
    requireRole(activeUser, ["OWNER", "MANAGER", "CASHIER", "ADMIN"]);
    var txs = findRecords("transactions");
    var users = findRecords("users");
    
    // User Map
    var userMap = {};
    users.forEach(function(u) { userMap[u.id] = u.name; });
    
    var decorated = txs.map(function(t) {
      t.cashier_name = userMap[t.cashier_id] || "Unknown Cashier";
      return t;
    }).sort(function(a, b) {
      return new Date(b.created_at) - new Date(a.created_at);
    });
    
    return { success: true, transactions: decorated };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * Computes live, aggregated analytics statistics for the owner dashboard.
 */
function rpcGetDashboardStats(activeUser) {
  try {
    requireRole(activeUser, ["OWNER", "MANAGER", "ADMIN"]);
    
    var transactions = findRecords("transactions");
    var txItems = findRecords("transaction_items");
    var products = findRecords("products");
    
    // Create product lookup map
    var productMap = {};
    products.forEach(function(p) {
      productMap[p.id] = p.name;
    });
    
    var totalRevenue = 0;
    var totalOrders = 0;
    var voidCount = 0;
    var refundCount = 0;
    
    var todayRevenue = 0;
    var todayOrders = 0;
    
    var paymentMethods = { CASH: 0, NON_CASH: 0 };
    var hourlyTrend = {}; // Hours 0-23
    var productSalesCount = {};
    
    var todayStr = new Date().toISOString().substring(0, 10);
    
    transactions.forEach(function(tx) {
      var isToday = tx.created_at.substring(0, 10) === todayStr;
      
      if (tx.status === "PAID") {
        totalRevenue += Number(tx.total);
        totalOrders++;
        
        if (isToday) {
          todayRevenue += Number(tx.total);
          todayOrders++;
        }
        
        // Payment methods count
        var pm = tx.payment_method || "CASH";
        paymentMethods[pm] = (paymentMethods[pm] || 0) + 1;
        
        // Hourly sales trend analysis
        try {
          var dateObj = new Date(tx.created_at);
          var hour = dateObj.getHours();
          hourlyTrend[hour] = (hourlyTrend[hour] || 0) + Number(tx.total);
        } catch(e) {}
      } else if (tx.status === "VOID") {
        voidCount++;
      } else if (tx.status === "REFUND") {
        refundCount++;
      }
    });
    
    // Product sales count analysis
    txItems.forEach(function(item) {
      // Only count items for PAID transactions
      var tx = transactions.find(function(t) { return t.id === item.transaction_id; });
      if (tx && tx.status === "PAID") {
        var pName = productMap[item.product_id] || "Unknown Product";
        productSalesCount[pName] = (productSalesCount[pName] || 0) + Number(item.qty);
      }
    });
    
    // Sort and format Top Products (Top 5)
    var topProducts = [];
    for (var name in productSalesCount) {
      topProducts.push({ name: name, qty: productSalesCount[name] });
    }
    topProducts.sort(function(a, b) { return b.qty - a.qty; });
    topProducts = topProducts.slice(0, 5);
    
    // Format Hourly sales trend for easier front-end charting
    var hourlyData = [];
    for (var h = 6; h <= 22; h++) { // Filter standard coffee truck operating hours 6 AM - 10 PM
      hourlyData.push({
        hour: String(h).padStart(2, '0') + ":00",
        revenue: hourlyTrend[h] || 0
      });
    }
    
    return {
      success: true,
      stats: {
        totalRevenue: totalRevenue,
        totalOrders: totalOrders,
        todayRevenue: todayRevenue,
        todayOrders: todayOrders,
        voidCount: voidCount,
        refundCount: refundCount,
        paymentMethods: paymentMethods,
        topProducts: topProducts,
        hourlyTrend: hourlyData
      }
    };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}
