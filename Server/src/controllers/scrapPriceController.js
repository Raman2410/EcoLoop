import ScrapPrice from "../models/ScrapPrice.model.js";
import {
  SCRAP_TYPES,
  normalizeScrapType,
} from "../constants/scrapConstants.js";

// ================= CONSTANTS =================
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  INTERNAL_SERVER_ERROR: 500,
};

const ADMIN_POPULATE_FIELDS = "name email role";
const PUBLIC_SELECT_FIELDS = "scrapType pricePerKg updatedAt -_id";
const SORT_ORDER = { scrapType: 1 };

// ================= VALIDATORS =================
const validateScrapType = (scrapType) => {
  const normalizedType = normalizeScrapType(scrapType);

  if (!normalizedType || !SCRAP_TYPES.includes(normalizedType)) {
    return { isValid: false, message: "Invalid scrapType" };
  }

  return { isValid: true, normalizedType };
};

const validatePricePerKg = (pricePerKg) => {
  const price = Number(pricePerKg);

  if (Number.isNaN(price) || price <= 0) {
    return { isValid: false, message: "pricePerKg must be a positive number" };
  }

  return { isValid: true, price };
};

const validateScrapPriceInput = ({ scrapType, pricePerKg }) => {
  const scrapTypeValidation = validateScrapType(scrapType);
  if (!scrapTypeValidation.isValid) {
    return scrapTypeValidation;
  }

  const priceValidation = validatePricePerKg(pricePerKg);
  if (!priceValidation.isValid) {
    return priceValidation;
  }

  return {
    isValid: true,
    normalizedType: scrapTypeValidation.normalizedType,
    price: priceValidation.price,
  };
};

// ================= DATABASE OPERATIONS =================
const checkExistingPrice = async (scrapType) => {
  return ScrapPrice.findOne({ scrapType });
};

const upsertPrice = async (scrapType, pricePerKg, userId) => {
  return ScrapPrice.findOneAndUpdate(
    { scrapType },
    {
      $set: {
        scrapType,
        pricePerKg,
        updatedBy: userId,
      },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );
};

const fetchAdminPrices = async () => {
  return ScrapPrice.find()
    .sort(SORT_ORDER)
    .populate("updatedBy", ADMIN_POPULATE_FIELDS);
};

const fetchPublicPrices = async () => {
  return ScrapPrice.find()
    .select(PUBLIC_SELECT_FIELDS)
    .sort(SORT_ORDER)
    .lean();
};

// ================= RESPONSE HELPERS =================
const determineStatusCode = (wasExisting) => {
  return wasExisting ? HTTP_STATUS.OK : HTTP_STATUS.CREATED;
};

// ================= CONTROLLERS =================

/**
 * ADMIN: Create or Update Scrap Price
 */
export const upsertScrapPrice = async (req, res) => {
  try {
    const { scrapType, pricePerKg } = req.body;

    // Validate input
    const validation = validateScrapPriceInput({ scrapType, pricePerKg });
    if (!validation.isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
        message: validation.message 
      });
    }

    const { normalizedType, price } = validation;

    // Check if price exists
    const existingPrice = await checkExistingPrice(normalizedType);

    // Upsert price
    const updatedPrice = await upsertPrice(normalizedType, price, req.user.id);

    // Return appropriate status code
    const statusCode = determineStatusCode(existingPrice);
    return res.status(statusCode).json(updatedPrice);

  } catch (error) {
    console.error("Upsert scrap price error:", error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ 
      message: "Internal server error" 
    });
  }
};

/**
 * ADMIN: Get All Scrap Prices with Admin Details
 */
export const getScrapPricesAdmin = async (_req, res) => {
  try {
    const prices = await fetchAdminPrices();
    return res.json(prices);

  } catch (error) {
    console.error("Get scrap prices (admin) error:", error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ 
      message: "Internal server error" 
    });
  }
};

/**
 * PUBLIC: Get All Scrap Prices (Limited Fields)
 */
export const getScrapPricesPublic = async (_req, res) => {
  try {
    const prices = await fetchPublicPrices();
    return res.json(prices);

  } catch (error) {
    console.error("Get scrap prices (public) error:", error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ 
      message: "Internal server error" 
    });
  }
};