/**
 * products.gs.js - Products Service Layer
 * Manages coffee and beverage products catalog, categories, pricing, stock levels, and seeding.
 */

/**
 * Returns all products, automatically seeding them if table is empty.
 */
function getProducts() {
  var count = countRecords("products");
  if (count === 0) {
    seedProductsTable();
  }
  return findRecords("products");
}

/**
 * Seeds products based on items and prices extracted from menu.jpeg.
 */
function seedProductsTable() {
  var now = new Date().toISOString();
  var initialStock = 100; // Seed with standard stock to prevent checkout failure
  
  var seedData = [
    // EXPRESO BASED & SIGNATURE
    { name: "Americano", category: "EXPRESO BASED & SIGNATURE", price: 8000 },
    { name: "Lemonade Americano", category: "EXPRESO BASED & SIGNATURE", price: 10000 },
    { name: "Tubruk (Susu/Non Susu)", category: "EXPRESO BASED & SIGNATURE", price: 8000 },
    { name: "Coffee Latte (Hot/Ice)", category: "EXPRESO BASED & SIGNATURE", price: 14000 },
    { name: "Kopsu Gula Aren", category: "EXPRESO BASED & SIGNATURE", price: 14000 },
    { name: "Hazelnut Coffee Latte", category: "EXPRESO BASED & SIGNATURE", price: 14000 },
    { name: "Butterscotch Coffee Latte", category: "EXPRESO BASED & SIGNATURE", price: 14000 },
    { name: "Spanish Latte", category: "EXPRESO BASED & SIGNATURE", price: 14000 },
    
    // REFRESHING TEA
    { name: "Lychee Tea", category: "REFRESHING TEA", price: 8000 },
    { name: "Lemon Tea", category: "REFRESHING TEA", price: 8000 },
    
    // NON COFFEE
    { name: "Taro Latte", category: "NON COFFEE", price: 15000 },
    { name: "Red Velvet", category: "NON COFFEE", price: 15000 }
  ];
  
  seedData.forEach(function(item) {
    var record = {
      id: Utilities.getUuid(),
      name: item.name,
      category: item.category,
      price: item.price,
      stock: initialStock,
      status: "ACTIVE",
      created_at: now
    };
    insertRecord("products", record);
  });
  
  Logger.log("Product catalog seeded successfully with menu items.");
}

/**
 * Creates a new product. Restricted to Admin/Owner.
 */
function createProduct(productData, activeUser) {
  requireRole(activeUser, ["OWNER"]);
  
  // Validate input
  if (!productData.name || !productData.category || productData.price === undefined) {
    throw new Error("Validation Error: Missing required product fields.");
  }
  if (productData.price < 0) {
    throw new Error("Validation Error: Price cannot be negative.");
  }
  if (productData.stock < 0) {
    throw new Error("Validation Error: Stock cannot be negative.");
  }
  
  // Check for duplicate name
  var existing = findRecord("products", "name", productData.name);
  if (existing) {
    throw new Error("Validation Error: A product with the name '" + productData.name + "' already exists.");
  }
  
  var newProduct = {
    id: Utilities.getUuid(),
    name: productData.name,
    category: productData.category,
    price: Number(productData.price),
    stock: Number(productData.stock || 0),
    imageUrl: productData.imageUrl || "",
    status: productData.status || "ACTIVE",
    created_at: new Date().toISOString()
  };
  
  var inserted = insertRecord("products", newProduct);
  
  // Log Audit Action
  logAction(
    activeUser.id,
    "CREATE_PRODUCT",
    "products",
    newProduct.id,
    null,
    newProduct
  );
  
  return { success: true, product: inserted };
}

/**
 * Updates an existing product. Restricted to Admin/Owner.
 */
function updateProduct(id, updatedFields, activeUser) {
  requireRole(activeUser, ["OWNER"]);
  
  var before = findRecord("products", "id", id);
  if (!before) {
    throw new Error("Product not found with ID: " + id);
  }
  
  // Validate fields if provided
  if (updatedFields.price !== undefined && updatedFields.price < 0) {
    throw new Error("Validation Error: Price cannot be negative.");
  }
  if (updatedFields.stock !== undefined && updatedFields.stock < 0) {
    throw new Error("Validation Error: Stock cannot be negative.");
  }
  
  // Typecasting
  if (updatedFields.price !== undefined) updatedFields.price = Number(updatedFields.price);
  if (updatedFields.stock !== undefined) updatedFields.stock = Number(updatedFields.stock);
  
  var after = updateRecord("products", id, updatedFields);
  
  // Log Audit Action
  logAction(
    activeUser.id,
    "UPDATE_PRODUCT",
    "products",
    id,
    before,
    after
  );
  
  return { success: true, product: after };
}

/**
 * Performs explicit stock adjustment with a reason. Allowed for Manager, Admin, Owner.
 */
function adjustStock(id, newStock, reason, activeUser) {
  requireRole(activeUser, ["OWNER"]);
  
  if (newStock < 0) {
    throw new Error("Validation Error: Adjusted stock level cannot be negative.");
  }
  if (!reason) {
    throw new Error("Validation Error: A reason is required for manual stock adjustments.");
  }
  
  var before = findRecord("products", "id", id);
  if (!before) {
    throw new Error("Product not found with ID: " + id);
  }
  
  var after = updateRecord("products", id, { stock: Number(newStock) });
  
  // Log Audit Action specifically indicating stock adjustment
  logAction(
    activeUser.id,
    "STOCK_ADJUSTMENT",
    "products",
    id,
    { stock: before.stock, reason: reason },
    { stock: after.stock, reason: reason }
  );
  return { success: true, product: after };
}
