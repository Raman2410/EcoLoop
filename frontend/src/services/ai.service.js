import axiosInstance from "../api/axiosInstance";
/**
 * Unified Smart Waste Classifier (GPT-4o vision).
 * Sends multipart/form-data to /api/ai/assistant.
 *
 * All fields are optional — at least one of text fields OR imageFile must be provided.
 *
 * @param {Object} params
 * @param {string}    params.title       - Item title
 * @param {string}    params.category    - Item category
 * @param {string}    params.condition   - Item condition
 * @param {string}    params.description - Item description
 * @param {File|null} params.imageFile   - Image file from input
 *
 * @returns {Promise<{ success, mode, data: { category, bestAction, suggestion, reason, estimatedValue, ecoImpact, confidence } }>}
 */
export const getAssistantDecision = async ({
  title,
  category,
  condition,
  description,
  imageFile,
}) => {
  const formData = new FormData();

  if (title?.trim()) formData.append("title", title.trim());
  if (category?.trim()) formData.append("category", category.trim());
  if (condition?.trim()) formData.append("condition", condition.trim());
  if (description?.trim()) formData.append("description", description.trim());
  if (imageFile) formData.append("image", imageFile);

  // Do NOT set Content-Type manually — axios auto-sets multipart/form-data with boundary
  const res = await axiosInstance.post("/ai/assistant", formData);
  return res.data;
};

export const analyzeItem = async (description) => {
  const formData = new FormData();
  formData.append("description", description);

  const { data } = await axiosInstance.post("/ai/assistant", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return data;
};