import axios from "axios";

// ================= CONSTANTS =================

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_MODEL = "gpt-3.5-turbo";

// Valid options the AI can recommend
const VALID_OPTIONS = ["Sell", "Rent", "Scrap", "Reuse"];

// Required fields for the decision request
const REQUIRED_FIELDS = ["title", "category", "condition", "description"];

// ================= UTILITIES =================

/**
 * Validates that all required fields are present and non-empty.
 * @param {Object} body - Request body
 * @returns {{ isValid: boolean, missing: string[] }}
 */
const validateInputFields = (body) => {
  const missing = REQUIRED_FIELDS.filter(
    (field) => !body[field] || String(body[field]).trim() === ""
  );
  return { isValid: missing.length === 0, missing };
};

/**
 * Builds the structured prompt sent to OpenAI.
 * Strict JSON-only instruction prevents markdown wrapping in the response.
 * @param {Object} item - Validated item details
 * @returns {string}
 */
const buildPrompt = ({ title, category, condition, description }) => {
  return `You are an intelligent sustainability assistant for EcoLoop, a scrap recycling platform.

Analyze the item below and recommend the single best option from: Sell, Rent, Scrap, or Reuse.

Item Details:
- Title: ${title}
- Category: ${category}
- Condition: ${condition}
- Description: ${description}

Respond ONLY with a valid JSON object — no markdown, no explanation, no extra text.
Use exactly this structure:
{
  "bestOption": "<Sell | Rent | Scrap | Reuse>",
  "reason": "<1–2 sentence justification>",
  "estimatedValue": "<e.g. ₹500/month or ₹2000 one-time or No monetary value>",
  "ecoImpact": "<e.g. Saves approximately 2 kg CO2 emissions>"
}`;
};

/**
 * Calls the OpenAI Chat Completions API and returns the raw response text.
 * Uses axios (already a project dependency — no new package needed).
 * @param {string} prompt
 * @returns {Promise<string>}
 */
const callOpenAI = async (prompt) => {
  const response = await axios.post(
    OPENAI_API_URL,
    {
      model: OPENAI_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,   // Lower = more deterministic, consistent JSON output
      max_tokens: 250,    // Sufficient for the structured response; keeps costs low
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      timeout: 15000, // 15 second timeout to avoid hanging requests
    }
  );

  return response.data.choices[0].message.content.trim();
};

/**
 * Parses and validates the OpenAI response JSON.
 * Guards against malformed or unexpected AI output.
 * @param {string} rawText
 * @returns {{ parsed: Object, error: string|null }}
 */
const parseAndValidateAIResponse = (rawText) => {
  let parsed;

  try {
    parsed = JSON.parse(rawText);
  } catch {
    return { parsed: null, error: "AI returned an invalid response format. Please try again." };
  }

  // Ensure the AI returned a known option
  if (!parsed.bestOption || !VALID_OPTIONS.includes(parsed.bestOption)) {
    return { parsed: null, error: "AI returned an unrecognised recommendation. Please try again." };
  }

  // Ensure all expected fields exist
  const requiredOutputFields = ["bestOption", "reason", "estimatedValue", "ecoImpact"];
  const missingOutputFields = requiredOutputFields.filter((f) => !parsed[f]);
  if (missingOutputFields.length > 0) {
    return { parsed: null, error: `AI response missing fields: ${missingOutputFields.join(", ")}` };
  }

  return { parsed, error: null };
};

// ================= CONTROLLER =================

/**
 * POST /api/ai/decision
 *
 * Accepts item details, calls OpenAI, and returns a structured recommendation.
 *
 * Request body:
 *   { title, category, condition, description }
 *
 * Success response (200):
 *   { success: true, data: { bestOption, reason, estimatedValue, ecoImpact } }
 *
 * Error responses:
 *   400 - Missing/invalid input fields
 *   500 - OpenAI API failure or unexpected server error
 *   503 - OpenAI API key not configured
 */
export const getAIDecision = async (req, res) => {
  try {
    // ── Guard: OPENAI_API_KEY must be set ─────────────────────────────────────
    if (!process.env.OPENAI_API_KEY) {
      console.error("[AI] OPENAI_API_KEY is not set in environment variables.");
      return res.status(503).json({
        success: false,
        message: "AI service is not configured. Contact the administrator.",
      });
    }

    // ── Input validation ──────────────────────────────────────────────────────
    const { isValid, missing } = validateInputFields(req.body);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missing.join(", ")}`,
      });
    }

    const { title, category, condition, description } = req.body;

    // Trim all inputs before sending to OpenAI
    const item = {
      title: title.trim(),
      category: category.trim(),
      condition: condition.trim(),
      description: description.trim(),
    };

    // ── Call OpenAI ───────────────────────────────────────────────────────────
    console.log(`[AI] Decision requested for item: "${item.title}" (${item.category})`);

    const prompt = buildPrompt(item);
    const rawAIResponse = await callOpenAI(prompt);

    // ── Parse & validate AI output ────────────────────────────────────────────
    const { parsed, error: parseError } = parseAndValidateAIResponse(rawAIResponse);
    if (parseError) {
      console.error("[AI] Parse error:", parseError, "| Raw:", rawAIResponse);
      return res.status(500).json({ success: false, message: parseError });
    }

    console.log(`[AI] Recommendation for "${item.title}": ${parsed.bestOption}`);

    // ── Success response ──────────────────────────────────────────────────────
    return res.status(200).json({
      success: true,
      data: {
        bestOption: parsed.bestOption,
        reason: parsed.reason,
        estimatedValue: parsed.estimatedValue,
        ecoImpact: parsed.ecoImpact,
      },
    });

  } catch (err) {
    // ── OpenAI API error (rate limit, network, auth) ──────────────────────────
    if (err.response) {
      const status = err.response.status;
      const aiMessage = err.response.data?.error?.message || "OpenAI API error";

      console.error(`[AI] OpenAI API responded with ${status}:`, aiMessage);

      if (status === 401) {
        return res.status(503).json({
          success: false,
          message: "AI service authentication failed. Check OPENAI_API_KEY.",
        });
      }

      if (status === 429) {
        return res.status(503).json({
          success: false,
          message: "AI service is temporarily busy. Please try again in a moment.",
        });
      }

      return res.status(503).json({
        success: false,
        message: "AI service is unavailable. Please try again later.",
      });
    }

    // ── Network timeout or connection error ───────────────────────────────────
    if (err.code === "ECONNABORTED" || err.code === "ETIMEDOUT") {
      console.error("[AI] Request to OpenAI timed out.");
      return res.status(503).json({
        success: false,
        message: "AI service timed out. Please try again.",
      });
    }

    // ── Unexpected server error ───────────────────────────────────────────────
    console.error("[AI] Unexpected error:", err.message);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred. Please try again.",
    });
  }
};
