/**
 * shifts.gs.js - Shift Management Service
 * Manages daily cash drawers, opening balances, closing balances, and cash mismatch reconciliation.
 */

/**
 * Retrieves the currently open shift (if any).
 */
function getActiveShift() {
  var openShifts = findRecords("shifts", { status: "OPEN" });
  if (openShifts.length > 0) {
    // Return the shift and attach user details
    var shift = openShifts[0];
    var user = findRecord("users", "id", shift.user_id);
    shift.cashier_name = user ? user.name : "Unknown Kasir";
    return shift;
  }
  return null;
}

/**
 * Opens a new shift for the cashier.
 * Ensures only one shift is open at any given time for the system (single-outlet MVP limit).
 */
function openShift(openCash, activeUser) {
  requireRole(activeUser, ["CASHIER", "MANAGER", "OWNER"]);
  
  if (openCash === undefined || openCash < 0) {
    throw new Error("Validation Error: Shift opening cash balance must be 0 or greater.");
  }
  
  // Check if a shift is already open
  var activeShift = getActiveShift();
  if (activeShift) {
    throw new Error("Validation Error: There is already an active shift open (" + activeShift.cashier_name + "). You must close the active shift first.");
  }
  
  var newShift = {
    id: Utilities.getUuid(),
    user_id: activeUser.id,
    open_cash: Number(openCash),
    close_cash: "",
    status: "OPEN",
    opened_at: new Date().toISOString(),
    closed_at: ""
  };
  
  var inserted = insertRecord("shifts", newShift);
  
  // Log Audit Action
  logAction(
    activeUser.id,
    "OPEN_SHIFT",
    "shifts",
    inserted.id,
    null,
    { open_cash: openCash }
  );
  
  return { success: true, shift: inserted };
}

/**
 * Closes an active shift, reconciles physical cash, and generates a shift summary.
 */
function closeShift(shiftId, closeCash, activeUser) {
  requireRole(activeUser, ["CASHIER", "MANAGER", "OWNER"]);
  
  if (closeCash === undefined || closeCash < 0) {
    throw new Error("Validation Error: Shift closing cash balance cannot be negative.");
  }
  
  var shift = findRecord("shifts", "id", shiftId);
  if (!shift || shift.status !== "OPEN") {
    throw new Error("Shift is either not found or already closed.");
  }
  
  var now = new Date().toISOString();
  var closedShift = updateRecord("shifts", shiftId, {
    close_cash: Number(closeCash),
    status: "CLOSED",
    closed_at: now
  });
  
  // CALCULATE RECONCILIATION SUMMARY
  var transactions = findRecords("transactions", { shift_id: shiftId });
  
  var cashSales = 0;
  var nonCashSales = 0;
  var refundedSales = 0;
  var voidedSales = 0;
  var orderCount = 0;
  
  transactions.forEach(function(tx) {
    if (tx.status === "PAID") {
      orderCount++;
      if (tx.payment_method === "CASH") {
        cashSales += Number(tx.total);
      } else {
        nonCashSales += Number(tx.total);
      }
    } else if (tx.status === "REFUND") {
      refundedSales += Number(tx.total);
    } else if (tx.status === "VOID") {
      voidedSales += Number(tx.total);
    }
  });
  
  var expectedDrawerCash = Number(shift.open_cash) + cashSales;
  var mismatchVariance = Number(closeCash) - expectedDrawerCash;
  
  var summary = {
    shiftId: shiftId,
    cashierId: shift.user_id,
    openedAt: shift.opened_at,
    closedAt: now,
    openCash: Number(shift.open_cash),
    closeCash: Number(closeCash),
    cashSales: cashSales,
    nonCashSales: nonCashSales,
    totalSales: cashSales + nonCashSales,
    refundedSales: refundedSales,
    voidedSales: voidedSales,
    orderCount: orderCount,
    expectedDrawerCash: expectedDrawerCash,
    mismatchVariance: mismatchVariance
  };
  
  // Log Audit Action with the detailed reconciliation summary
  logAction(
    activeUser.id,
    "CLOSE_SHIFT",
    "shifts",
    shiftId,
    { open_cash: shift.open_cash },
    summary
  );
  
  return { success: true, summary: summary };
}

/**
 * Gets shift statistics for live frontend tracking without closing the shift.
 */
function getLiveShiftStats(shiftId) {
  var shift = findRecord("shifts", "id", shiftId);
  if (!shift) return null;
  
  var transactions = findRecords("transactions", { shift_id: shiftId });
  var cashSales = 0;
  var nonCashSales = 0;
  var totalSales = 0;
  var orderCount = 0;
  
  transactions.forEach(function(tx) {
    if (tx.status === "PAID") {
      orderCount++;
      totalSales += Number(tx.total);
      if (tx.payment_method === "CASH") {
        cashSales += Number(tx.total);
      } else {
        nonCashSales += Number(tx.total);
      }
    }
  });
  
  return {
    openCash: Number(shift.open_cash),
    cashSales: cashSales,
    nonCashSales: nonCashSales,
    totalSales: totalSales,
    orderCount: orderCount,
    expectedDrawerCash: Number(shift.open_cash) + cashSales
  };
}
