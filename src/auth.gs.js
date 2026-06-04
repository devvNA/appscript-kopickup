/**
 * auth.gs.js - Authentication & Session Service
 * Manages user validation, session state, and Role-Based Access Control (RBAC).
 */

/**
 * Resolves the current active user from session.
 * Returns the validated user object from the database, or null.
 */
function getCurrentUser() {
  var activeEmail = "";
  
  // 1. Try stored session email first (from custom login)
  try {
    var props = _getProps();
    activeEmail = props.getProperty("SESSION_EMAIL");
  } catch(e) {}
  
  // 2. Fallback to Google Session active user email
  if (!activeEmail) {
    try {
      activeEmail = Session.getActiveUser().getEmail();
    } catch (e) {
      Logger.log("Unable to get active user email: " + e.toString());
    }
  }
  
  if (!activeEmail) {
    return null;
  }
  
  // Look up user in database
  var user = findRecord("users", "email", activeEmail);
  
  // Validate status is active
  if (user && user.status === "ACTIVE") {
    return user;
  }
  
  return null;
}

/**
 * Checks if the user's role is permitted for the action.
 * Roles are hierarchical or flat. We use a flat whitelist matrix here.
 * 
 * @param {object} user - User object
 * @param {string[]} allowedRoles - List of allowed roles (e.g. ['OWNER', 'CASHIER'])
 */
function validateRole(user, allowedRoles) {
  if (!user || !user.role) {
    return false;
  }
  return allowedRoles.indexOf(user.role) !== -1;
}

/**
 * Validates a list of roles and throws an error if unauthorized.
 */
function requireRole(user, allowedRoles) {
  if (!user) {
    throw new Error("UNAUTHENTICATED: Authentication required.");
  }
  if (!validateRole(user, allowedRoles)) {
    throw new Error("UNAUTHORIZED: Your role (" + user.role + ") does not have permission for this action.");
  }
  return true;
}

// ==========================================
// SECURE LOGIN & SESSION MANAGEMENT
// ==========================================

function computeSHA256(input) {
  var signature = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, input, Utilities.Charset.UTF_8);
  var hexString = '';
  for (var i = 0; i < signature.length; i++) {
    var byte = signature[i];
    if (byte < 0) byte += 256;
    var hex = byte.toString(16);
    if (hex.length === 1) hex = '0' + hex;
    hexString += hex;
  }
  return hexString;
}

/**
 * Returns a stable session key. Falls back to ScriptProperties if UserProperties
 * or getTemporaryActiveUserKey() is unavailable (e.g. "Anyone" deploy mode).
 */
function _getSessionKey() {
  try {
    var key = Session.getTemporaryActiveUserKey();
    if (key) return key;
  } catch (e) {
    Logger.log("getTemporaryActiveUserKey failed: " + e);
  }
  // Fallback: use a fixed key scoped to the script
  return "FALLBACK_SESSION";
}

function _getProps() {
  try {
    return PropertiesService.getUserProperties();
  } catch (e) {
    Logger.log("getUserProperties failed, falling back to ScriptProperties: " + e);
    return PropertiesService.getScriptProperties();
  }
}

function checkSession() {
  try {
    var userKey = _getSessionKey();
    var props = _getProps();
    var isLoggedIn = props.getProperty('SESSION_' + userKey);
    
    if (isLoggedIn === 'true') {
      var user = getCurrentUser();
      if (user) {
        return true;
      } else {
        // Invalid or deleted user: clear the bad session to prevent infinite redirect loops
        props.deleteProperty('SESSION_' + userKey);
        props.deleteProperty("SESSION_EMAIL");
        return false;
      }
    }
    return false;
  } catch (e) {
    Logger.log("checkSession error: " + e);
    return false;
  }
}

function processLogin(email, password) {
  try {
    var user = findRecord("users", "email", email);
    if (!user) {
      return { success: false, message: "User Email tidak ditemukan." };
    }
    
    var hashedPassword = computeSHA256(password);
    if (user.password !== hashedPassword) {
      return { success: false, message: "Email atau Password salah." };
    }
    if (user.status !== "ACTIVE") {
      return { success: false, message: "Akun Anda sedang tidak aktif." };
    }
    
    var userKey = _getSessionKey();
    var props = _getProps();
    props.setProperty('SESSION_' + userKey, 'true');
    props.setProperty("SESSION_EMAIL", email);
    return { success: true, message: "Login berhasil." };
  } catch (e) {
    Logger.log("processLogin error: " + e);
    return { success: false, message: "Terjadi kesalahan server: " + e.toString() };
  }
}

function processRegister(email, password, name) {
  try {
    var existingUser = findRecord("users", "email", email);
    if (existingUser) {
      return { success: false, message: "Email sudah terdaftar." };
    }
    
    var hashedPassword = computeSHA256(password);
    var now = new Date().toISOString();
    
    var newUser = {
      id: Utilities.getUuid(),
      name: name || "New User",
      email: email,
      password: hashedPassword,
      role: "CASHIER",
      status: "ACTIVE",
      created_at: now
    };
    
    insertRecord("users", newUser);
    return { success: true, message: "Registrasi berhasil, silakan login." };
  } catch (e) {
    Logger.log("processRegister error: " + e);
    return { success: false, message: "Terjadi kesalahan server: " + e.toString() };
  }
}

function processLogout() {
  try {
    var userKey = _getSessionKey();
    var props = _getProps();
    props.deleteProperty('SESSION_' + userKey);
    props.deleteProperty("SESSION_EMAIL");
  } catch (e) {
    Logger.log("processLogout error: " + e);
  }
  return { success: true, message: "Logout berhasil." };
}
