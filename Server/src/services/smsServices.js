import axios from "axios";

export const sendOTP = async (phone, otp) => {
  // ===============================
  // DEV / TEST MODE
  // ===============================
  if (process.env.NODE_ENV !== "production") {
    console.log("📲 OTP (DEV MODE)");
    console.log(`Phone: ${phone}`);
    console.log(`OTP: ${otp}`);
    return true;
  }

  // ===============================
  // PRODUCTION MODE (REAL SMS)
  // ===============================
  try {
    const response = await axios.post(
      "https://www.fast2sms.com/dev/bulkV2",
      {
        route: "otp",
        variables_values: otp,
        numbers: phone,
      },
      {
        headers: {
          authorization: process.env.FAST2SMS_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.data?.return) {
      console.error("Fast2SMS error response:", response.data);
      return false; // ❗ DO NOT THROW
    }

    console.log(`✅ OTP sent to ${phone}`);
    return true;
  } catch (error) {
    console.error(
      "❌ SMS sending failed:",
      error.response?.data || error.message
    );

    // ❗ VERY IMPORTANT: DO NOT THROW
    return false;
  }
};
