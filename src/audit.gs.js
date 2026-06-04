/**
 * audit.gs.js - Audit Trail System
 * Records and retrieves system activity logs to satisfy security, compliance, and auditing requirements.
 */

/**
 * Creates and appends an immutable action trace log to the database.
 * 
 * @param {string} userId - User UUID executing the change
 * @param {string} action - Action slug (e.g. 'OPEN_SHIFT', 'CHECKOUT_ORDER')
 * @param {string} entityType - The targeted model (e.g. 'products', 'shifts')
 * @param {string} entityId - Target UUID
 * @param {object|null} beforeData - State of the entity before action
 * @param {object|null} afterData - State of the entity after action
 */
function logAction(userId, action, entityType, entityId, beforeData, afterData) {
  var now = new Date().toISOString();
  
  var auditRecord = {
    id: Utilities.getUuid(),
    user_id: userId || "SYSTEM",
    action: action,
    entity_type: entityType,
    entity_id: entityId || "",
    before_data: beforeData ? JSON.stringify(beforeData) : "",
    after_data: afterData ? JSON.stringify(afterData) : "",
    created_at: now
  };
  
  try {
    insertRecord("audit_logs", auditRecord);
  } catch (err) {
    // Audit write failures shouldn't crash the core transaction, but should be logged
    Logger.log("CRITICAL ERROR: Failed to write audit log: " + err.toString());
  }
}

/**
 * Retrieves all audit logs, decorated with user names for dashboard consumption.
 * Ordered newest first.
 */
function getAuditLogs() {
  var logs = findRecords("audit_logs");
  var users = findRecords("users");
  
  // Create user map for fast lookup
  var userMap = {};
  users.forEach(function(u) {
    userMap[u.id] = u.name;
  });
  
  var decoratedLogs = logs.map(function(log) {
    return {
      id: log.id,
      userId: log.user_id,
      userName: userMap[log.user_id] || "SYSTEM",
      action: log.action,
      entityType: log.entity_type,
      entityId: log.entity_id,
      beforeData: log.before_data,
      afterData: log.after_data,
      createdAt: log.created_at
    };
  });
  
  // Sort newest first
  return decoratedLogs.sort(function(a, b) {
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
}
