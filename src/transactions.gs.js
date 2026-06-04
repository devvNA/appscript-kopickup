/**
 * transactions.gs.js - Transaction & POS Engine
 * Manages shopping cart checkouts, stock reduction, transaction number generation, and refunds/voids.
 */

/**
 * Executes a full POS transaction check-out, ensuring stock atomicity.
 * If any step fails, it performs a custom database rollback to maintain consistency.
 * 
 * @param {object} orderData - Checkout data: { shiftId, items: [{ productId, qty }], paymentMethod }
 * @param {object} activeUser - Authenticated Cashier/Barista/Manager/Owner
 */
function checkoutOrder(orderData, activeUser) {
  requireRole(activeUser, ["CASHIER", "OWNER"]);
  
  if (!orderData.shiftId) {
    throw new Error("Validation Error: Active Shift ID is required to process order.");
  }
  
  // Verify Shift is open
  var shift = findRecord("shifts", "id", orderData.shiftId);
  if (!shift || shift.status !== "OPEN") {
    throw new Error("Validation Error: This shift is closed or invalid. Cannot process transactions.");
  }
  
  if (!orderData.items || orderData.items.length === 0) {
    throw new Error("Validation Error: The shopping cart is empty.");
  }
  
  // 1. ATOMIC INVENTORY & PRODUCT CHECKS (Before making any sheet writes)
  var allProducts = findRecords("products");
  var productsToUpdate = [];
  var transactionSubtotal = 0;
  
  for (var i = 0; i < orderData.items.length; i++) {
    var cartItem = orderData.items[i];
    var product = null;
    for (var j = 0; j < allProducts.length; j++) {
      if (allProducts[j].id === cartItem.productId) {
        product = allProducts[j];
        break;
      }
    }
    
    if (!product) {
      throw new Error("Validation Error: Product not found with ID: " + cartItem.productId);
    }
    
    if (product.status !== "ACTIVE") {
      throw new Error("Validation Error: Product '" + product.name + "' is currently inactive and cannot be sold.");
    }
    
    if (Number(product.stock) < Number(cartItem.qty)) {
      throw new Error("Validation Error: Stock insufficient for '" + product.name + "'. Available: " + product.stock + ", requested: " + cartItem.qty);
    }
    
    var itemSubtotal = Number(product.price) * Number(cartItem.qty);
    transactionSubtotal += itemSubtotal;
    
    productsToUpdate.push({
      product: product,
      qtyToSell: Number(cartItem.qty),
      snapshotPrice: Number(product.price),
      itemSubtotal: itemSubtotal
    });
  }
  
  // 2. GENERATE RECEIPT TRANSACTION NUMBER
  var transactionNo = generateTransactionNumber();
  
  // 3. EXECUTE SHEET WRITES & HANDLE TRANSACTION ROLLBACK
  var transactionId = Utilities.getUuid();
  var now = new Date().toISOString();
  
  var createdTx = null;
  var createdItems = [];
  var stocksToRevert = []; // Keep track in case rollback is required
  
  try {
    // A. Write Transaction Header
    var txHeader = {
      id: transactionId,
      transaction_no: transactionNo,
      shift_id: orderData.shiftId,
      cashier_id: activeUser.id,
      subtotal: transactionSubtotal,
      total: transactionSubtotal, // No tax/discounts in initial MVP scope
      payment_method: orderData.paymentMethod || "CASH",
      status: "PAID",
      created_at: now
    };
    createdTx = insertRecord("transactions", txHeader);
    
    // B. Write Transaction Items & Update Stock Levels
    var txItemsToInsert = [];
    var productUpdates = [];
    
    productsToUpdate.forEach(function(item) {
      var txItem = {
        id: Utilities.getUuid(),
        transaction_id: transactionId,
        product_id: item.product.id,
        qty: item.qtyToSell,
        price: item.snapshotPrice,
        subtotal: item.itemSubtotal
      };
      txItemsToInsert.push(txItem);
      
      var originalStock = Number(item.product.stock);
      var newStock = originalStock - item.qtyToSell;
      productUpdates.push({ id: item.product.id, fields: { stock: newStock } });
      
      stocksToRevert.push({
        productId: item.product.id,
        revertStock: originalStock
      });
    });
    
    createdItems = insertRecords("transaction_items", txItemsToInsert);
    updateRecords("products", productUpdates);
    
    // C. Record Audit Trail
    logAction(
      activeUser.id,
      "CHECKOUT_ORDER",
      "transactions",
      transactionId,
      null,
      { transaction_no: transactionNo, total: transactionSubtotal }
    );
    
    return {
      success: true,
      transaction: createdTx,
      items: createdItems,
      receiptDetails: {
        transaction: createdTx,
        cashierName: activeUser.name || "Kasir",
        items: productsToUpdate.map(function(item) {
          return {
            productName: item.product.name,
            qty: item.qtyToSell,
            price: item.snapshotPrice,
            subtotal: item.itemSubtotal
          };
        })
      },
      stockUpdates: productsToUpdate.map(function(item) {
        return {
          productId: item.product.id,
          stock: Number(item.product.stock) - item.qtyToSell
        };
      })
    };
    
  } catch (err) {
    // --- MANUAL TRANSACTION ROLLBACK (Sheet consistency fallback) ---
    Logger.log("Checkout transaction failed! Rolling back changes: " + err.toString());
    
    // Revert Stock Updates
    var revertUpdates = [];
    stocksToRevert.forEach(function(revertInfo) {
      revertUpdates.push({ id: revertInfo.productId, fields: { stock: revertInfo.revertStock } });
    });
    try {
      updateRecords("products", revertUpdates);
    } catch(e) {
      Logger.log("Failed to revert stocks: " + e.toString());
    }
    
    // Delete created transaction items
    createdItems.forEach(function(item) {
      try {
        deleteRecord("transaction_items", item.id);
      } catch (e) {
        Logger.log("Failed to delete rolled-back item " + item.id + ": " + e.toString());
      }
    });
    
    // Delete transaction header
    if (createdTx) {
      try {
        deleteRecord("transactions", createdTx.id);
      } catch (e) {
        Logger.log("Failed to delete rolled-back transaction " + createdTx.id + ": " + e.toString());
      }
    }
    
    throw new Error("Database Transaction Error: Unable to complete checkout. " + err.toString());
  }
}

/**
 * Generates a unique transaction receipt number.
 * Format: KP-YYYYMMDD-XXXX
 */
function generateTransactionNumber() {
  var now = new Date();
  var yyyy = now.getFullYear();
  var mm = String(now.getMonth() + 1).padStart(2, '0');
  var dd = String(now.getDate()).padStart(2, '0');
  var todayStr = yyyy + mm + dd;

  var lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    var propertyKey = "tx_sequence_" + todayStr;
    var properties = PropertiesService.getScriptProperties();
    var currentSequence = Number(properties.getProperty(propertyKey));

    if (!currentSequence) {
      var transactions = findRecords("transactions");
      currentSequence = 0;

      transactions.forEach(function(tx) {
        if (tx.transaction_no && tx.transaction_no.indexOf("KP-" + todayStr) === 0) {
          currentSequence++;
        }
      });
    }

    var nextSequence = currentSequence + 1;
    properties.setProperty(propertyKey, String(nextSequence));

    var sequence = String(nextSequence).padStart(4, '0');
    return "KP-" + todayStr + "-" + sequence;
  } finally {
    lock.releaseLock();
  }
}

/**
 * Voids or Refunds a transaction, restoring product stock levels.
 * Restricted to Owner and Manager.
 * 
 * @param {string} txId - UUID of target transaction
 * @param {string} actionType - 'VOID' or 'REFUND'
 * @param {string} reason - Required audit trail explanation
 * @param {object} activeUser - Owner or Manager executing action
 */
function voidOrRefundTransaction(txId, actionType, reason, activeUser) {
  requireRole(activeUser, ["OWNER"]);
  
  if (actionType !== "VOID" && actionType !== "REFUND") {
    throw new Error("Validation Error: Invalid action type. Must be 'VOID' or 'REFUND'.");
  }
  
  if (!reason || reason.trim().length === 0) {
    throw new Error("Validation Error: A justification reason is required for voiding/refunding transactions.");
  }
  
  var tx = findRecord("transactions", "id", txId);
  if (!tx) {
    throw new Error("Transaction not found: " + txId);
  }
  
  if (tx.status !== "PAID") {
    throw new Error("Validation Error: Only active PAID transactions can be voided or refunded. Current status: " + tx.status);
  }
  
  // 1. Fetch transaction items to restore stock
  var items = findRecords("transaction_items", { transaction_id: txId });
  
  // 2. Perform updates
  var beforeState = { status: tx.status };
  var afterState = { status: actionType, void_reason: reason };
  
  // Update transaction status
  updateRecord("transactions", txId, { status: actionType });
  
  // Restore product stock levels
  items.forEach(function(item) {
    var product = findRecord("products", "id", item.product_id);
    if (product) {
      var currentStock = Number(product.stock);
      var restoredStock = currentStock + Number(item.qty);
      updateRecord("products", item.product_id, { stock: restoredStock });
    }
  });
  
  // 3. Log Audit Action
  logAction(
    activeUser.id,
    actionType + "_TRANSACTION",
    "transactions",
    txId,
    beforeState,
    afterState
  );
  
  return { success: true, status: actionType };
}

/**
 * Gets a transaction receipt complete details.
 */
function getReceiptDetails(txId) {
  var tx = findRecord("transactions", "id", txId);
  if (!tx) return null;
  
  var cashier = findRecord("users", "id", tx.cashier_id);
  var rawItems = findRecords("transaction_items", { transaction_id: txId });
  
  var formattedItems = rawItems.map(function(item) {
    var product = findRecord("products", "id", item.product_id);
    return {
      productName: product ? product.name : "Unknown Item",
      qty: item.qty,
      price: item.price,
      subtotal: item.subtotal
    };
  });
  
  return {
    transaction: tx,
    cashierName: cashier ? cashier.name : "Kasir",
    items: formattedItems
  };
}
