/**
 * db.gs.js - Database Service Layer
 * Deals with low-level Google Sheets reads, writes, and sheet initialization.
 */

// Global constant to hold database references
var DB_NAME = "Kopickup Primary Database";

/**
 * Gets or creates the primary Google Spreadsheet.
 * Uses script properties first, then active spreadsheet, then searches Drive, or creates one.
 */
function getSpreadsheet() {
  var props = PropertiesService.getScriptProperties();
  var sheetId = props.getProperty("DATABASE_SPREADSHEET_ID");
  
  if (sheetId) {
    try {
      return SpreadsheetApp.openById(sheetId);
    } catch (e) {
      Logger.log("Stored Spreadsheet ID is invalid: " + e.toString());
    }
  }
  
  // Try active spreadsheet container
  try {
    var active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) {
      props.setProperty("DATABASE_SPREADSHEET_ID", active.getId());
      return active;
    }
  } catch (e) {
    // Standalone script
  }
  
  // Search in Drive
  var files = DriveApp.getFilesByName(DB_NAME);
  if (files.hasNext()) {
    var file = files.next();
    props.setProperty("DATABASE_SPREADSHEET_ID", file.getId());
    return SpreadsheetApp.openById(file.getId());
  }
  
  // Create a new one
  var newSheet = SpreadsheetApp.create(DB_NAME);
  props.setProperty("DATABASE_SPREADSHEET_ID", newSheet.getId());
  return newSheet;
}

/**
 * Helper to get a sheet by name.
 */
function getSheet(sheetName) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    throw new Error("Sheet not found: " + sheetName);
  }
  return sheet;
}

/**
 * Initializes database sheets and seeds default data if empty.
 */
function initDatabase() {
  var ss = getSpreadsheet();
  
  // Define tables & fields
  var schemas = {
    "users": ["id", "name", "email", "password", "role", "status", "created_at"],
    "products": ["id", "name", "category", "price", "stock", "imageUrl", "status", "created_at"],
    "shifts": ["id", "user_id", "open_cash", "close_cash", "status", "opened_at", "closed_at"],
    "transactions": ["id", "transaction_no", "shift_id", "cashier_id", "subtotal", "total", "payment_method", "status", "created_at"],
    "transaction_items": ["id", "transaction_id", "product_id", "qty", "price", "subtotal"],
    "audit_logs": ["id", "user_id", "action", "entity_type", "entity_id", "before_data", "after_data", "created_at"]
  };
  
  for (var sheetName in schemas) {
    var sheet = ss.getSheetByName(sheetName);
    var expectedHeaders = schemas[sheetName];
    
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      // Remove any default columns/rows to clean up
      sheet.clear();
      // Set headers
      sheet.appendRow(expectedHeaders);
      
      // Style headers
      var range = sheet.getRange(1, 1, 1, expectedHeaders.length);
      range.setFontWeight("bold");
      range.setBackground("#4B2E24"); // Coffee Brown style
      range.setFontColor("#F2E8D8"); // Latte Cream text
      sheet.setFrozenRows(1);
    } else {
      // Dynamic Migration: Append missing headers if schema was updated
      var existingHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn() || 1).getValues()[0];
      var missingHeaders = expectedHeaders.filter(function(h) { 
        return existingHeaders.indexOf(h) === -1; 
      });
      
      if (missingHeaders.length > 0) {
        var startCol = existingHeaders.length + 1;
        sheet.getRange(1, startCol, 1, missingHeaders.length).setValues([missingHeaders]);
        
        // Style new headers
        var newRange = sheet.getRange(1, startCol, 1, missingHeaders.length);
        newRange.setFontWeight("bold");
        newRange.setBackground("#4B2E24");
        newRange.setFontColor("#F2E8D8");
      }
    }
  }
  
  // Clean up default Sheet1 if exists
  var sheet1 = ss.getSheetByName("Sheet1");
  if (sheet1) {
    ss.deleteSheet(sheet1);
  }
  
  // Seed Users if empty
  var userCount = countRecords("users");
  if (userCount === 0) {
    seedDefaultUsers();
  }
}

/**
 * Seed default users.
 */
function seedDefaultUsers() {
  var now = new Date().toISOString();
  var defaultPass = computeSHA256("pass123");
  var defaultUsers = [
    { id: Utilities.getUuid(), name: "Owner Kopickup", email: "owner@kopickup.com", password: defaultPass, role: "OWNER", status: "ACTIVE", created_at: now },
    { id: Utilities.getUuid(), name: "Kasir Barista", email: "cashier@kopickup.com", password: defaultPass, role: "CASHIER", status: "ACTIVE", created_at: now }
  ];
  
  defaultUsers.forEach(function(user) {
    insertRecord("users", user);
  });
  
  Logger.log("Default users seeded successfully.");
}

/**
 * Maps sheet headers and values to JavaScript objects.
 */
function sheetToObjects(sheet) {
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  
  var headers = rows[0];
  var objects = [];
  
  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      var header = headers[j];
      var cellVal = row[j];
      // Auto-parse JSON strings for before_data and after_data in audit logs
      if ((header === "before_data" || header === "after_data") && typeof cellVal === "string" && cellVal) {
        try {
          obj[header] = JSON.parse(cellVal);
        } catch (e) {
          obj[header] = cellVal;
        }
      } else {
        obj[header] = cellVal;
      }
    }
    objects.push(obj);
  }
  return objects;
}

/**
 * Inserts a single record into a sheet, matching headers automatically.
 */
function insertRecord(sheetName, record) {
  var sheet = getSheet(sheetName);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var newRow = [];
  
  for (var i = 0; i < headers.length; i++) {
    var header = headers[i];
    var val = record[header];
    
    if (val === undefined) {
      newRow.push("");
    } else if (typeof val === "object" && val !== null) {
      newRow.push(JSON.stringify(val));
    } else {
      newRow.push(val);
    }
  }
  
  sheet.appendRow(newRow);
  return record;
}

/**
 * Inserts multiple records into a sheet efficiently.
 */
function insertRecords(sheetName, records) {
  if (!records || records.length === 0) return [];
  var sheet = getSheet(sheetName);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var newRows = [];
  
  for (var r = 0; r < records.length; r++) {
    var record = records[r];
    var newRow = [];
    for (var i = 0; i < headers.length; i++) {
      var header = headers[i];
      var val = record[header];
      if (val === undefined) {
        newRow.push("");
      } else if (typeof val === "object" && val !== null) {
        newRow.push(JSON.stringify(val));
      } else {
        newRow.push(val);
      }
    }
    newRows.push(newRow);
  }
  
  sheet.getRange(sheet.getLastRow() + 1, 1, newRows.length, headers.length).setValues(newRows);
  return records;
}

/**
 * Updates a record in a sheet by its primary key ID.
 */
function updateRecord(sheetName, id, updatedFields) {
  var sheet = getSheet(sheetName);
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return null;
  
  var headers = data[0];
  var idColIdx = headers.indexOf("id");
  if (idColIdx === -1) throw new Error("Sheet does not have 'id' column: " + sheetName);
  
  for (var r = 1; r < data.length; r++) {
    if (data[r][idColIdx] === id) {
      // Found the row. Update columns that are defined in updatedFields
      for (var field in updatedFields) {
        var colIdx = headers.indexOf(field);
        if (colIdx !== -1) {
          var val = updatedFields[field];
          var cellVal = (typeof val === "object" && val !== null) ? JSON.stringify(val) : val;
          // Row index in sheet is 1-indexed, headers are row 1, so row r is r+1 in sheet.
          // Col index is 0-indexed, so colIdx is colIdx+1 in sheet.
          sheet.getRange(r + 1, colIdx + 1).setValue(cellVal);
        }
      }
      // Return fresh object
      var updatedRow = sheet.getRange(r + 1, 1, 1, headers.length).getValues()[0];
      var obj = {};
      for (var j = 0; j < headers.length; j++) {
        var header = headers[j];
        var val = updatedRow[j];
        if ((header === "before_data" || header === "after_data") && typeof val === "string" && val) {
          try {
            obj[header] = JSON.parse(val);
          } catch(e) {
            obj[header] = val;
          }
        } else {
          obj[header] = val;
        }
      }
      return obj;
    }
  }
  return null;
}

/**
 * Updates multiple records in a sheet efficiently.
 * recordsUpdates: [{id: "uuid", fields: {stock: 10}}]
 */
function updateRecords(sheetName, recordsUpdates) {
  if (!recordsUpdates || recordsUpdates.length === 0) return;
  var sheet = getSheet(sheetName);
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return;
  
  var headers = data[0];
  var idColIdx = headers.indexOf("id");
  if (idColIdx === -1) throw new Error("Sheet does not have 'id' column: " + sheetName);
  
  var updatedCount = 0;
  for (var k = 0; k < recordsUpdates.length; k++) {
    var id = recordsUpdates[k].id;
    var updatedFields = recordsUpdates[k].fields;
    
    for (var r = 1; r < data.length; r++) {
      if (data[r][idColIdx] === id) {
        for (var field in updatedFields) {
          var colIdx = headers.indexOf(field);
          if (colIdx !== -1) {
            var val = updatedFields[field];
            data[r][colIdx] = (typeof val === "object" && val !== null) ? JSON.stringify(val) : val;
          }
        }
        updatedCount++;
        break;
      }
    }
  }
  
  if (updatedCount > 0) {
    sheet.getDataRange().setValues(data);
  }
}

/**
 * Deletes a record from a sheet by ID.
 */
function deleteRecord(sheetName, id) {
  var sheet = getSheet(sheetName);
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return false;
  
  var headers = data[0];
  var idColIdx = headers.indexOf("id");
  if (idColIdx === -1) throw new Error("Sheet does not have 'id' column: " + sheetName);
  
  for (var r = 1; r < data.length; r++) {
    if (data[r][idColIdx] === id) {
      sheet.deleteRow(r + 1);
      return true;
    }
  }
  return false;
}

/**
 * Finds a record in a sheet matching a specific field & value.
 */
function findRecord(sheetName, field, value) {
  var sheet = getSheet(sheetName);
  var objects = sheetToObjects(sheet);
  for (var i = 0; i < objects.length; i++) {
    if (objects[i][field] === value) {
      return objects[i];
    }
  }
  return null;
}

/**
 * Finds all records matching a set of query filter criteria.
 * Example queryFilters: { category: "NON COFFEE", status: "ACTIVE" }
 */
function findRecords(sheetName, queryFilters) {
  var sheet = getSheet(sheetName);
  var objects = sheetToObjects(sheet);
  if (!queryFilters) return objects;
  
  return objects.filter(function(obj) {
    for (var key in queryFilters) {
      if (obj[key] !== queryFilters[key]) {
        return false;
      }
    }
    return true;
  });
}

/**
 * Counts the number of non-header records in a sheet.
 */
function countRecords(sheetName) {
  var sheet = getSheet(sheetName);
  var lastRow = sheet.getLastRow();
  return lastRow > 1 ? lastRow - 1 : 0;
}
