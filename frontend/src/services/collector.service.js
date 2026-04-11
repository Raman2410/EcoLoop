import axiosInstance from "../api/axiosInstance";

// Get all pending pickup requests (collector) - with pagination
export const getPendingPickups = async (page = 1, limit = 10) => {
  const res = await axiosInstance.get("/pickups/pending", {
    params: { page, limit },
  });
  return res.data;
};

// Get assigned pickups (collector) - with pagination
export const getAssignedPickups = async (page = 1, limit = 10) => {
  const res = await axiosInstance.get("/pickups/assigned", {
    params: { page, limit },
  });
  return res.data;
};

// Get completed pickups (collector) - with pagination
export const getCompletedPickups = async (page = 1, limit = 10) => {
  const res = await axiosInstance.get("/pickups/completed", {
    params: { page, limit },
  });
  return res.data;
};

// Get archived pickups (collector) - with pagination
export const getArchivedPickups = async (page = 1, limit = 10) => {
  const res = await axiosInstance.get("/pickups/archived", {
    params: { page, limit },
  });
  return res.data;
};

// Accept a pickup (collector)
export const acceptPickup = async (pickupId) => {
  const res = await axiosInstance.put(`/pickups/accept/${pickupId}`);
  return res.data;
};

/**
 * Step 1: Collector initiates OTP-verified completion.
 * Sends OTP to the user's phone; transitions pickup to "in_progress".
 * @param {string} pickupId
 * @returns {{ success, message, otpExpiresAt }}
 */
export const generateCompletionOtp = async (pickupId) => {
  const res = await axiosInstance.post(`/pickups/generate-otp/${pickupId}`);
  return res.data;
};

/**
 * Step 2: Collector submits the OTP (and optional proof image) to complete.
 * Sends multipart/form-data so the optional image can be included.
 * @param {string} pickupId
 * @param {string} otp          - 6-digit code the user read out
 * @param {File|null} proofImage - optional photo of the scrap
 * @returns {{ success, message, ecoCoinsEarned, pricePerKg, proofImage }}
 */
export const verifyOtpAndComplete = async (
  pickupId,
  otp,
  proofImage = null,
) => {
  const formData = new FormData();
  formData.append("otp", otp);
  if (proofImage) {
    formData.append("proofImage", proofImage);
  }
  // axios detects FormData and sets the correct Content-Type header
  const res = await axiosInstance.post(
    `/pickups/verify-otp/${pickupId}`,
    formData,
  );
  return res.data;
};
