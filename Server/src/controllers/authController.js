import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.model.js";
import walletService from "../services/walletService.js";
import { generateOTP, getOtpExpiry } from "../services/otpService.js";
import { sendOTP } from "../services/smsServices.js";

// ================= CONSTANTS =================
const VALID_ROLES = ["user", "collector"];
const VALID_VEHICLE_TYPES = ["cycle", "bike", "auto", "truck"];
const PASSWORD_MIN_LENGTH = 8;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOKEN_EXPIRY = "7d";

// ================= UTILITIES =================
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY,
  });
};

const createTokenPayload = (user) => ({
  id: user._id,
  role: user.role,
  tokenVersion: user.tokenVersion,
});

const buildUserResponse = (user, includeToken = true) => {
  const response = {
    _id: user._id,

    // ✅ identity fields (FIXES NAVBAR ISSUE)
    name: user.name,
    fullName: user.fullName || user.name,

    email: user.email,
    role: user.role,
  };

  if (includeToken) {
    response.token = generateToken(createTokenPayload(user));
  }

  // ✅ Role-specific fields
  if (user.role === "collector") {
    Object.assign(response, {
      businessName: user.businessName,
      vehicleType: user.vehicleType,
      isAvailable: user.isAvailable,
      isVerified: user.isVerified,
    });
  } else if (user.role === "user") {
    response.ecoCoins = user.ecoCoins;
  }

  return response;
};

// ================= VALIDATORS =================
const validateBasicFields = ({ name, email, password }) => {
  if (!name || !email || !password) {
    return { isValid: false, message: "Name, email, and password are required" };
  }

  if (!EMAIL_REGEX.test(email)) {
    return { isValid: false, message: "Invalid email format" };
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    return { isValid: false, message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters` };
  }

  return { isValid: true };
};

const validateRole = (role) => {
  if (role && !VALID_ROLES.includes(role)) {
    return { isValid: false, message: "Invalid role specified" };
  }
  return { isValid: true };
};

const validateCollectorFields = ({ businessName, serviceArea, vehicleType, vehicleNumber, phone }) => {
  if (!businessName || !serviceArea || !vehicleType || !vehicleNumber || !phone) {
    return {
      isValid: false,
      message: "Collectors must provide: businessName, serviceArea, vehicleType, vehicleNumber, and phone",
    };
  }

  if (!VALID_VEHICLE_TYPES.includes(vehicleType)) {
    return { isValid: false, message: "Invalid vehicle type" };
  }

  return { isValid: true };
};

// ================= USER CREATION =================
const buildUserData = (reqBody) => {
  const { name, email, password, role, phone, address } = reqBody;
  
  const userData = {
    name,
    email,
    password,
    role: role || "user",
    phone,
    address,
  };

  // Add collector-specific fields
  if (role === "collector") {
    const { businessName, serviceArea, vehicleType, vehicleNumber } = reqBody;
    Object.assign(userData, {
      businessName,
      serviceArea,
      vehicleType,
      vehicleNumber,
      isAvailable: true,
      isVerified: false,
    });
  }

  return userData;
};

const createUserWallet = async (userId) => {
  try {
    await walletService.createWalletIfNotExists(userId.toString());
  
  } catch (error) {
    console.error("Wallet creation failed:", error.message);
    await User.findByIdAndDelete(userId);
    throw new Error("Wallet creation failed");
  }
};

const handleCollectorOTP = async (user) => {
  const otp = generateOTP();
  user.otp = otp;
  user.otpExpiry = getOtpExpiry();
  await user.save();

  // Send OTP asynchronously without blocking
  sendOTP(user.phone, otp).catch((err) => {
    console.warn("⚠ OTP sending failed (DEV MODE):", err.message);
  });

  return {
    message: "Collector registered. OTP sent to phone.",
    userId: user._id,
    role: user.role,
    isVerified: false,
  };
};

// ================= REGISTRATION =================
export const register = async (req, res) => {
  try {
    const { role, email, password } = req.body;

    // Validate basic fields
    const basicValidation = validateBasicFields(req.body);
    if (!basicValidation.isValid) {
      return res.status(400).json({ message: basicValidation.message });
    }

    // Validate role
    const roleValidation = validateRole(role);
    if (!roleValidation.isValid) {
      return res.status(400).json({ message: roleValidation.message });
    }

    // Collector-specific validation
    if (role === "collector") {
      const collectorValidation = validateCollectorFields(req.body);
      if (!collectorValidation.isValid) {
        return res.status(400).json({ message: collectorValidation.message });
      }
    }

   // Check if user already exists by email
const existingUserByEmail = await User.findOne({ email });
if (existingUserByEmail) {
  return res.status(409).json({ message: "Email already registered" });
}

// Check if phone already exists (ONLY for collectors)
if (role === "collector") {
  const { phone } = req.body;

  const existingUserByPhone = await User.findOne({ phone });
  if (existingUserByPhone) {
    return res.status(409).json({
      message: "Phone number already registered",
    });
  }
}


    // Hash password and build user data
    const hashedPassword = await bcrypt.hash(password, 10);
    const userData = buildUserData({ ...req.body, password: hashedPassword });

    // Create user
    const user = await User.create(userData);

    // Create wallet for regular users
    if (user.role === "user") {
      try {
        await createUserWallet(user._id);
      } catch (error) {
        return res.status(500).json({ message: error.message });
      }
    }

    // Handle collector OTP flow
    if (user.role === "collector") {
      const otpResponse = await handleCollectorOTP(user);
      return res.status(201).json(otpResponse);
    }

    // Return user response with token
    const response = buildUserResponse(user);
    return res.status(201).json(response);

  } catch (error) {
    console.error("Register error:", error);
    console.error("Error stack:", error.stack);
    return res.status(500).json({ 
      message: "Internal server error",
      error: error.message,
      details: error.toString()
    });
  }
};

// ================= OTP VERIFICATION =================
export const verifyOtp = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    // Validate input
    if (!userId || !otp) {
      return res.status(400).json({ message: "UserId and OTP are required" });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user is a collector
    if (user.role !== "collector") {
      return res.status(403).json({ message: "OTP verification only for collectors" });
    }

    // Check if already verified
    if (user.isVerified) {
      return res.status(400).json({ message: "Collector already verified" });
    }

    // Validate OTP
    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Check OTP expiry
    if (user.otpExpiry < new Date()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    // Verify collector
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    // Generate token and response
    const token = generateToken(createTokenPayload(user));
    
    return res.status(200).json({
  message: "Collector verified successfully",
  token,
  user: {
    id: user._id,
    role: user.role,
    isVerified: user.isVerified,
    businessName: user.businessName,
  },
});


  } catch (error) {
    console.error("Verify OTP error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ================= LOGIN =================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
     
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({ message: "Account is deactivated" });
    }

    // Check if collector is verified
    if (user.role === "collector" && !user.isVerified) {
      return res.status(403).json({ message: "Collector account pending verification" });
    }

    // Build and return response
    const response = buildUserResponse(user);
    return res.status(200).json(response);

  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ================= LOGOUT =================
export const logout = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { tokenVersion: 1 },
    });

    return res.status(200).json({ message: "Logged out successfully" });

  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ================= LEGACY ENDPOINTS =================
export const registerUser = async (req, res) => {
  req.body.role = "user";
  return register(req, res);
};

export const registerCollector = async (req, res) => {
  req.body.role = "collector";
  return register(req, res);
};

export const loginUser = login;
export const loginCollector = login;
export const logoutUser = logout;
export const logoutCollector = logout;