import axios from "axios";
import twilio from "twilio";

// ── Providers ──────────────────────────────────────────────────────────────────
//
//  Primary  : Fast2SMS  (Indian numbers, cheaper)
//  Fallback : Twilio    (international, used if Fast2SMS fails)
//
//  The old NODE_ENV gate has been removed — SMS is sent in ALL environments
//  so OTP works during development on a real device, not just in the terminal.
//  Set DISABLE_SMS=true in .env if you ever want to suppress real sends.
// ──────────────────────────────────────────────────────────────────────────────

const DISABLE_SMS = process.env.DISABLE_SMS === "true";

// ── Fast2SMS ───────────────────────────────────────────────────────────────────

const sendViaFast2SMS = async (phone, otp) => {
  const apiKey = process.env.FAST2SMS_API_KEY;
  if (!apiKey) throw new Error("FAST2SMS_API_KEY not set in environment");

  // Strip country code prefix if present — Fast2SMS expects 10-digit Indian numbers
  const normalizedPhone = String(phone).replace(/^\+91/, "").replace(/\s/g, "");

  const response = await axios.post(
    "https://www.fast2sms.com/dev/bulkV2",
    {
      route: "otp",
      variables_values: otp,
      numbers: normalizedPhone,
      flash: 0,
    },
    {
      headers: {
        authorization: apiKey,
        "Content-Type": "application/json",
      },
      timeout: 8000,
    }
  );

  if (!response.data?.return) {
    throw new Error(
      `Fast2SMS rejected the request: ${JSON.stringify(response.data)}`
    );
  }

  return true;
};

// ── Twilio ─────────────────────────────────────────────────────────────────────

const sendViaTwilio = async (phone, otp) => {
  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from  = process.env.TWILIO_PHONE_NUMBER;

  if (!sid || !token || !from) {
    throw new Error("Twilio credentials not fully set in environment");
  }

  const client = twilio(sid, token);

  // Ensure E.164 format (+91XXXXXXXXXX for Indian numbers)
  const toNumber = String(phone).startsWith("+") ? phone : `+91${phone}`;

  await client.messages.create({
    body: `Your EcoLoop OTP is ${otp}. Valid for 10 minutes. Do not share it with anyone.`,
    from,
    to: toNumber,
  });

  return true;
};

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Send an OTP SMS to the given phone number.
 *
 * Strategy:
 *   1. Try Fast2SMS (primary — works for Indian numbers)
 *   2. On failure, fall back to Twilio
 *   3. If both fail, log the error and return false — NEVER throw,
 *      so a SMS hiccup never crashes the pickup flow.
 *
 * @param {string} phone  - 10-digit Indian number or E.164
 * @param {string} otp    - 6-digit OTP string
 * @returns {Promise<boolean>} true if sent, false if both providers failed
 */
export const sendOTP = async (phone, otp) => {
  // Safety valve for CI / automated tests — set DISABLE_SMS=true
  if (DISABLE_SMS) {
    console.log(`[SMS] DISABLE_SMS=true — OTP for ${phone}: ${otp}`);
    return true;
  }

  // ── Try Fast2SMS first ──────────────────────────────────────────────────────
  try {
    await sendViaFast2SMS(phone, otp);
    console.log(`✅ [SMS] OTP sent via Fast2SMS to ${phone}`);
    return true;
  } catch (fast2smsErr) {
    console.warn(
      `⚠️ [SMS] Fast2SMS failed for ${phone}:`,
      fast2smsErr.response?.data || fast2smsErr.message
    );
  }

  // ── Fallback: Twilio ────────────────────────────────────────────────────────
  try {
    await sendViaTwilio(phone, otp);
    console.log(`✅ [SMS] OTP sent via Twilio (fallback) to ${phone}`);
    return true;
  } catch (twilioErr) {
    console.error(
      `❌ [SMS] Twilio fallback also failed for ${phone}:`,
      twilioErr.message
    );
  }

  // Both providers failed — log OTP to server as last resort (dev visibility)
  console.error(
    `❌ [SMS] Both providers failed. OTP for ${phone}: ${otp} (check provider dashboards)`
  );
  return false;
};
