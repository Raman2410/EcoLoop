import axios from "axios";

// ================= CONSTANTS =================

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

// GPT-4o supports vision (multimodal) — falls back gracefully if image is absent
const OPENAI_MODEL = "gpt-4o";

// Classification categories returned by the AI
const VALID_CATEGORIES = ["Recyclable", "Scrap", "Reusable", "Rentable"];

// Best action options
const VALID_ACTIONS = ["Sell", "Rent", "Scrap", "Reuse"];

// Confidence levels
const VALID_CONFIDENCE = ["High", "Medium", "Low"];

// Input mode labels — used in logs for observability
const INPUT_MODES = {
  HYBRID: "text+image",
  IMAGE_ONLY: "image-only",
  TEXT_ONLY: "text-only",
};

// ================= UTILITIES =================

/**
 * Determines the current input mode based on what the user provided.
 * @param {boolean} hasText
 * @param {boolean} hasImage
 * @returns {string|null} INPUT_MODES value, or null if neither provided
 */
const resolveInputMode = (hasText, hasImage) => {
  if (hasText && hasImage) return INPUT_MODES.HYBRID;
  if (hasImage) return INPUT_MODES.IMAGE_ONLY;
  if (hasText) return INPUT_MODES.TEXT_ONLY;
  return null;
};

/**
 * Checks whether the text fields contain at least one meaningful entry.
 * @param {Object} fields - { title, description, category, condition }
 * @returns {boolean}
 */
const hasTextContent = ({ title, description, category, condition }) => {
  return [title, description, category, condition].some(
    (v) => v && String(v).trim().length > 0
  );
};

/**
 * Converts a buffer to a base64 data URL for the OpenAI vision API.
 * @param {Buffer} buffer
 * @param {string} mimeType
 * @returns {string}
 */
const bufferToBase64DataUrl = (buffer, mimeType) => {
  return buffer.toString("base64");
};

/**
 * Builds the system instruction shared across all input modes.
 * Instructs the model to respond ONLY with strict JSON.
 * @returns {string}
 */
const buildSystemPrompt = () =>
  `You are an intelligent sustainability assistant for EcoLoop, a smart waste management and recycling platform.

Your job is to classify items and recommend the best sustainable action.

You MUST respond ONLY with a valid JSON object — absolutely no markdown, no code fences, no explanation, no extra text.

The JSON must have EXACTLY these fields:
{
  "category": "<Recyclable | Scrap | Reusable | Rentable>",
  "bestAction": "<Sell | Rent | Scrap | Reuse>",
  "suggestion": "<1 sentence actionable suggestion for the user>",
  "reason": "<1-2 sentence justification based on the item's state and market demand>",
  "estimatedValue": "<e.g. ₹500/month or ₹2000 one-time or No monetary value>",
  "ecoImpact": "<e.g. Saves approximately 2 kg CO2 emissions>",
  "confidence": "<High | Medium | Low>"
}`;

/**
 * Builds the user-facing prompt text for TEXT ONLY mode.
 * @param {{ title, description, category, condition }} fields
 * @returns {string}
 */
const buildTextPrompt = ({ title, description, category, condition }) => {
  const lines = ["Analyze the following item and classify it:"];
  if (title) lines.push(`- Title: ${title.trim()}`);
  if (category) lines.push(`- Category: ${category.trim()}`);
  if (condition) lines.push(`- Condition: ${condition.trim()}`);
  if (description) lines.push(`- Description: ${description.trim()}`);
  lines.push(
    "\nClassify into: Recyclable, Scrap, Reusable, or Rentable.",
    "Provide suggestion, reason, estimated value, eco impact, and confidence level."
  );
  return lines.join("\n");
};

/**
 * Builds the user-facing prompt text for IMAGE ONLY mode.
 * @returns {string}
 */
const buildImagePrompt = () =>
  `Analyze this image and classify the item shown.
Classify into: Recyclable, Scrap, Reusable, or Rentable.
Provide suggestion, reason, estimated value, eco impact, and confidence level.`;

/**
 * Builds the user-facing prompt text for HYBRID (text + image) mode.
 * @param {{ title, description, category, condition }} fields
 * @returns {string}
 */
const buildHybridPrompt = ({ title, description, category, condition }) => {
  const lines = [
    "Analyze the provided image AND the item description together for maximum accuracy.",
    "Classify the item into: Recyclable, Scrap, Reusable, or Rentable.",
    "",
    "Item Details:",
  ];
  if (title) lines.push(`- Title: ${title.trim()}`);
  if (category) lines.push(`- Category: ${category.trim()}`);
  if (condition) lines.push(`- Condition: ${condition.trim()}`);
  if (description) lines.push(`- Description: ${description.trim()}`);
  lines.push("\nProvide suggestion, reason, estimated value, eco impact, and confidence level.");
  return lines.join("\n");
};

/**
 * Builds the complete OpenAI messages array for text-only input.
 * Uses standard chat format (no vision).
 * @param {string} userPromptText
 * @returns {Array}
 */
const buildTextMessages = (userPromptText) => [
  { role: "system", content: buildSystemPrompt() },
  { role: "user", content: userPromptText },
];

/**
 * Builds the OpenAI messages array for vision (image or hybrid) input.
 * Uses the multimodal content array format required by GPT-4o.
 * @param {string} userPromptText
 * @param {Buffer} imageBuffer
 * @param {string} imageMimeType
 * @returns {Array}
 */
const buildVisionMessages = (userPromptText, imageBuffer, imageMimeType) => [
  { role: "system", content: buildSystemPrompt() },
  {
    role: "user",
    content: [
      { type: "text", text: userPromptText },
      {
        type: "image_url",
        image_url: {
          url: `data:${imageMimeType};base64,${bufferToBase64DataUrl(imageBuffer, imageMimeType)}`,
          detail: "auto", // "auto" lets GPT-4o choose between low/high detail
        },
      },
    ],
  },
];

/**
 * Calls the OpenAI API with the given messages.
 * @param {Array} messages
 * @returns {Promise<string>} Raw response text from the model
 */
const callOpenAI = async (messages) => {
  const response = await axios.post(
    OPENAI_API_URL,
    {
      model: OPENAI_MODEL,
      messages,
      temperature: 0.3,    // Low temp = consistent, structured JSON output
      max_tokens: 350,     // Enough for the 7-field response
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      timeout: 20000, // 20s — vision calls take longer than text-only
    }
  );

  return response.data.choices[0].message.content.trim();
};

/**
 * Parses the raw OpenAI text, strips any accidental markdown fences,
 * validates structure and values.
 * @param {string} rawText
 * @returns {{ parsed: Object|null, error: string|null }}
 */
const parseAndValidate = (rawText) => {
  // Strip accidental ```json ... ``` wrapping
  const cleaned = rawText
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return { parsed: null, error: "AI returned an invalid JSON response. Please try again." };
  }

  // Validate category
  if (!parsed.category || !VALID_CATEGORIES.includes(parsed.category)) {
    return { parsed: null, error: `AI returned an unrecognised category: "${parsed.category}".` };
  }

  // Validate bestAction
  if (!parsed.bestAction || !VALID_ACTIONS.includes(parsed.bestAction)) {
    return { parsed: null, error: `AI returned an unrecognised action: "${parsed.bestAction}".` };
  }

  // Ensure all required output fields exist
  const REQUIRED_OUTPUT = ["category", "bestAction", "suggestion", "reason", "estimatedValue", "ecoImpact", "confidence"];
  const missing = REQUIRED_OUTPUT.filter((f) => !parsed[f]);
  if (missing.length > 0) {
    return { parsed: null, error: `AI response is missing fields: ${missing.join(", ")}.` };
  }

  // Normalise confidence if model returns something unexpected
  if (!VALID_CONFIDENCE.includes(parsed.confidence)) {
    parsed.confidence = "Medium";
  }

  return { parsed, error: null };
};

// ================= CONTROLLER =================

/**
 * POST /api/ai/assistant
 *
 * Unified Smart Waste Classifier — accepts text, image, or both.
 *
 * multipart/form-data fields:
 *   text:  title?, category?, condition?, description?
 *   file:  image? (field name: "image", max 5 MB)
 *
 * Modes:
 *   - text only   → GPT-4o text prompt
 *   - image only  → GPT-4o vision prompt
 *   - hybrid      → GPT-4o vision prompt with text context (highest accuracy)
 *
 * Success response (200):
 *   { success: true, mode: string, data: { category, bestAction, suggestion,
 *     reason, estimatedValue, ecoImpact, confidence } }
 */
export const getAssistantDecision = async (req, res) => {
  try {
    // ── Guard: API key ────────────────────────────────────────────────────────
    if (!process.env.OPENAI_API_KEY) {
      console.error("[AI Assistant] OPENAI_API_KEY not set.");
      return res.status(503).json({
        success: false,
        message: "AI service is not configured. Contact the administrator.",
      });
    }

    // ── Determine what the user provided ─────────────────────────────────────
    const textFields = {
      title: req.body?.title || "",
      description: req.body?.description || "",
      category: req.body?.category || "",
      condition: req.body?.condition || "",
    };

    const hasText = hasTextContent(textFields);
    const hasImage = Boolean(req.file?.buffer);

    // ── Validate: must have at least one of text or image ────────────────────
    const mode = resolveInputMode(hasText, hasImage);
    if (!mode) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide at least one of: item description (text fields) or an image.",
      });
    }

    console.log(`[AI Assistant] Request — mode: ${mode}, item: "${textFields.title || "(no title)"}"`);

    // ── Build the appropriate messages for the selected mode ──────────────────
    let messages;

    if (mode === INPUT_MODES.HYBRID) {
      messages = buildVisionMessages(
        buildHybridPrompt(textFields),
        req.file.buffer,
        req.file.mimetype
      );
    } else if (mode === INPUT_MODES.IMAGE_ONLY) {
      messages = buildVisionMessages(
        buildImagePrompt(),
        req.file.buffer,
        req.file.mimetype
      );
    } else {
      // TEXT_ONLY — use cheaper, faster non-vision model path
      messages = buildTextMessages(buildTextPrompt(textFields));
    }

    // ── Call OpenAI ───────────────────────────────────────────────────────────
    const rawResponse = await callOpenAI(messages);

    // ── Parse & validate the AI output ───────────────────────────────────────
    const { parsed, error: parseError } = parseAndValidate(rawResponse);
    if (parseError) {
      console.error("[AI Assistant] Parse error:", parseError, "| Raw:", rawResponse);
      return res.status(500).json({ success: false, message: parseError });
    }

    console.log(
      `[AI Assistant] Result — category: ${parsed.category}, action: ${parsed.bestAction}, confidence: ${parsed.confidence}`
    );

    // ── Success ───────────────────────────────────────────────────────────────
    return res.status(200).json({
      success: true,
      mode, // lets the frontend show which mode was used
      data: {
        category: parsed.category,
        bestAction: parsed.bestAction,
        suggestion: parsed.suggestion,
        reason: parsed.reason,
        estimatedValue: parsed.estimatedValue,
        ecoImpact: parsed.ecoImpact,
        confidence: parsed.confidence,
      },
    });

  } catch (err) {
    // ── OpenAI API-level errors ───────────────────────────────────────────────
    if (err.response) {
      const status = err.response.status;
      const aiMsg = err.response.data?.error?.message || "OpenAI API error";
      console.error(`[AI Assistant] OpenAI ${status}:`, aiMsg);

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

    // ── Timeout ───────────────────────────────────────────────────────────────
    if (err.code === "ECONNABORTED" || err.code === "ETIMEDOUT") {
      console.error("[AI Assistant] OpenAI request timed out.");
      return res.status(503).json({
        success: false,
        message: "AI service timed out. Please try again.",
      });
    }

    // ── Unexpected ────────────────────────────────────────────────────────────
    console.error("[AI Assistant] Unexpected error:", err.message);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred. Please try again.",
    });
  }
};
