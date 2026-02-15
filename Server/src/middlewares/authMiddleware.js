import jwt from "jsonwebtoken";
import User from "../models/User.model.js";

// ================= CONSTANTS =================
const HTTP_STATUS = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
};

const AUTH_ERRORS = {
  NO_TOKEN: "No token provided",
  INVALID_TOKEN: "Not authorized",
  USER_NOT_FOUND: "User not found",
  SESSION_EXPIRED: "Session expired",
  ACCOUNT_DEACTIVATED: "Account is deactivated",
  COLLECTOR_NOT_VERIFIED: "Collector phone number not verified",
  USER_ACCESS_ONLY: "User access only",
  COLLECTOR_ACCESS_ONLY: "Collector access only",
  ADMIN_ACCESS_ONLY: "Admin access only",
};

const ERROR_CODES = {
  COLLECTOR_NOT_VERIFIED: "COLLECTOR_NOT_VERIFIED",
};

const ROLES = {
  USER: "user",
  COLLECTOR: "collector",
  ADMIN: "admin",
};

const TOKEN_PREFIX = "Bearer ";
const PASSWORD_FIELD_EXCLUSION = "-password";

// ================= UTILITIES =================
const extractTokenFromHeader = (authHeader) => {
  if (!authHeader || !authHeader.startsWith(TOKEN_PREFIX)) {
    return null;
  }
  return authHeader.split(" ")[1];
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

const attachBackwardCompatibility = (req, user) => {
  // For backward compatibility with existing code that checks req.collector
  if (user.role === ROLES.COLLECTOR) {
    req.collector = user;
  }
};

// ================= VALIDATORS =================
const validateTokenVersion = (user, decodedTokenVersion) => {
  if (user.tokenVersion !== decodedTokenVersion) {
    return {
      isValid: false,
      status: HTTP_STATUS.UNAUTHORIZED,
      message: AUTH_ERRORS.SESSION_EXPIRED,
    };
  }
  return { isValid: true };
};

const validateUserStatus = (user) => {
  if (!user.isActive) {
    return {
      isValid: false,
      status: HTTP_STATUS.FORBIDDEN,
      message: AUTH_ERRORS.ACCOUNT_DEACTIVATED,
    };
  }
  return { isValid: true };
};

const validateCollectorVerification = (user) => {
  if (user.role === ROLES.COLLECTOR && !user.isVerified) {
    return {
      isValid: false,
      status: HTTP_STATUS.FORBIDDEN,
      message: AUTH_ERRORS.COLLECTOR_NOT_VERIFIED,
      code: ERROR_CODES.COLLECTOR_NOT_VERIFIED,
    };
  }
  return { isValid: true };
};

// ================= DATABASE OPERATIONS =================
const fetchUserById = async (userId) => {
  return User.findById(userId).select(PASSWORD_FIELD_EXCLUSION);
};

// ================= MIDDLEWARE =================

/**
 * Main authentication middleware
 * Verifies JWT token and attaches user to request
 */
export const protect = async (req, res, next) => {
  try {
    // Extract token
    const token = extractTokenFromHeader(req.headers.authorization);
    if (!token) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        message: AUTH_ERRORS.NO_TOKEN,
      });
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        message: AUTH_ERRORS.INVALID_TOKEN,
      });
    }

    // Fetch user
    const user = await fetchUserById(decoded.id);
    if (!user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        message: AUTH_ERRORS.USER_NOT_FOUND,
      });
    }

    // Validate token version
    const tokenVersionValidation = validateTokenVersion(user, decoded.tokenVersion);
    if (!tokenVersionValidation.isValid) {
      return res.status(tokenVersionValidation.status).json({
        message: tokenVersionValidation.message,
      });
    }

    // Validate user status
    const userStatusValidation = validateUserStatus(user);
    if (!userStatusValidation.isValid) {
      return res.status(userStatusValidation.status).json({
        message: userStatusValidation.message,
      });
    }

    // Validate collector verification
    const collectorValidation = validateCollectorVerification(user);
    if (!collectorValidation.isValid) {
      return res.status(collectorValidation.status).json({
        message: collectorValidation.message,
        code: collectorValidation.code,
      });
    }

    // Attach user to request
    req.user = user;

    // Backward compatibility
    attachBackwardCompatibility(req, user);

    next();

  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      message: AUTH_ERRORS.INVALID_TOKEN,
    });
  }
};

/**
 * Restrict access to users only
 */
export const userOnly = (req, res, next) => {
  if (!req.user || req.user.role !== ROLES.USER) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      message: AUTH_ERRORS.USER_ACCESS_ONLY,
    });
  }
  next();
};

/**
 * Restrict access to collectors only
 */
export const collectorOnly = (req, res, next) => {
  if (!req.user || req.user.role !== ROLES.COLLECTOR) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      message: AUTH_ERRORS.COLLECTOR_ACCESS_ONLY,
    });
  }
  next();
};

/**
 * Restrict access to admins only
 */
export const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== ROLES.ADMIN) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      message: AUTH_ERRORS.ADMIN_ACCESS_ONLY,
    });
  }
  next();
};

/**
 * Flexible role-based authorization
 * @param {...string} roles - List of allowed roles
 * @returns {Function} Express middleware
 * 
 * @example
 * router.get('/data', protect, authorizeRoles('admin', 'collector'), getData);
 */
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        message: `Access denied. Required role: ${roles.join(" or ")}`,
      });
    }
    next();
  };
};