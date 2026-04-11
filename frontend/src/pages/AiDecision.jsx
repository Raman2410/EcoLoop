import { useState, useCallback, useRef, memo } from "react";
import { useNavigate } from "react-router-dom";
import { getAssistantDecision } from "../services/ai.service";
import toast from "react-hot-toast";

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  "Electronics", "Furniture", "Clothing", "Appliances",
  "Books", "Vehicles", "Sports & Fitness", "Tools & Hardware",
  "Toys & Games", "Other",
];

const CONDITIONS = ["New", "Like New", "Good", "Used", "Damaged"];

const MAX_IMAGE_SIZE_MB = 5;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

// Visual config per category returned by AI
const CATEGORY_CONFIG = {
  Recyclable: {
    emoji: "♻️",
    bg: "bg-green-50", border: "border-green-300",
    badge: "bg-green-100 text-green-800",
    headerBg: "bg-green-600",
  },
  Scrap: {
    emoji: "🔧",
    bg: "bg-orange-50", border: "border-orange-300",
    badge: "bg-orange-100 text-orange-800",
    headerBg: "bg-orange-500",
  },
  Reusable: {
    emoji: "🌱",
    bg: "bg-emerald-50", border: "border-emerald-300",
    badge: "bg-emerald-100 text-emerald-800",
    headerBg: "bg-emerald-600",
  },
  Rentable: {
    emoji: "🔄",
    bg: "bg-purple-50", border: "border-purple-300",
    badge: "bg-purple-100 text-purple-800",
    headerBg: "bg-purple-600",
  },
};

// Visual config per bestAction
const ACTION_CONFIG = {
  Sell:  { emoji: "💰", color: "text-blue-700",   bg: "bg-blue-50",   border: "border-blue-200" },
  Rent:  { emoji: "🔄", color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200" },
  Scrap: { emoji: "♻️", color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200" },
  Reuse: { emoji: "🌱", color: "text-green-700",  bg: "bg-green-50",  border: "border-green-200" },
};

const CONFIDENCE_CONFIG = {
  High:   { color: "text-green-700",  bg: "bg-green-100",  dot: "bg-green-500" },
  Medium: { color: "text-yellow-700", bg: "bg-yellow-100", dot: "bg-yellow-500" },
  Low:    { color: "text-red-700",    bg: "bg-red-100",    dot: "bg-red-400" },
};

const MODE_LABELS = {
  "text+image": { label: "Text + Image Analysis", icon: "🔮", color: "text-purple-600 bg-purple-50 border-purple-200" },
  "image-only": { label: "Image Analysis",         icon: "📸", color: "text-blue-600 bg-blue-50 border-blue-200" },
  "text-only":  { label: "Text Analysis",          icon: "📝", color: "text-green-600 bg-green-50 border-green-200" },
};

// ─── Reusable input components ────────────────────────────────────────────────

const inputCls = (disabled) =>
  `w-full px-4 py-3 border border-gray-300 rounded-xl text-sm text-gray-800 bg-white
   focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
   transition ${disabled ? "bg-gray-100 cursor-not-allowed" : ""}`;

const TextField = memo(({ id, label, value, onChange, placeholder, disabled }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
    <input
      id={id} type="text" value={value} onChange={onChange}
      placeholder={placeholder} disabled={disabled}
      className={inputCls(disabled)}
    />
  </div>
));
TextField.displayName = "TextField";

const SelectField = memo(({ id, label, value, onChange, options, placeholder, disabled }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
    <select
      id={id} value={value} onChange={onChange} disabled={disabled}
      className={inputCls(disabled)}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
));
SelectField.displayName = "SelectField";

// ─── Image Upload Zone ────────────────────────────────────────────────────────

const ImageUploadZone = memo(({ imageFile, imagePreview, onFile, onClear, disabled }) => {
  const fileInputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const processFile = useCallback((file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file (JPEG, PNG, WEBP).");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      toast.error(`Image must be under ${MAX_IMAGE_SIZE_MB} MB.`);
      return;
    }
    onFile(file);
  }, [onFile]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    processFile(e.dataTransfer.files[0]);
  }, [disabled, processFile]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    if (!disabled) setDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback(() => setDragging(false), []);

  const handleFileInput = useCallback((e) => {
    processFile(e.target.files[0]);
    // Reset input so same file can be re-selected if user removes and re-adds
    e.target.value = "";
  }, [processFile]);

  // If we have a preview, show it
  if (imagePreview) {
    return (
      <div className="relative rounded-xl overflow-hidden border-2 border-green-300 bg-green-50">
        <img
          src={imagePreview}
          alt="Upload preview"
          className="w-full max-h-56 object-contain bg-gray-100"
        />
        {/* Overlay info bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-3 py-2 flex items-center justify-between">
          <span className="text-white text-xs font-medium truncate max-w-[70%]">
            📸 {imageFile?.name}
          </span>
          {!disabled && (
            <button
              type="button"
              onClick={onClear}
              className="text-white/80 hover:text-white text-xs underline shrink-0"
            >
              Remove
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => !disabled && fileInputRef.current?.click()}
      className={`
        border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer
        ${dragging ? "border-green-500 bg-green-50 scale-[1.01]" : "border-gray-300 bg-gray-50 hover:border-green-400 hover:bg-green-50/50"}
        ${disabled ? "opacity-60 cursor-not-allowed" : ""}
      `}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileInput}
        disabled={disabled}
      />
      <div className="text-3xl mb-2">{dragging ? "📂" : "📸"}</div>
      <p className="text-sm font-medium text-gray-700">
        {dragging ? "Drop your image here" : "Drag & drop or click to upload"}
      </p>
      <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WEBP — max {MAX_IMAGE_SIZE_MB} MB</p>
    </div>
  );
});
ImageUploadZone.displayName = "ImageUploadZone";

// ─── Input Mode Indicator ─────────────────────────────────────────────────────

/**
 * Shows a real-time pill indicating what mode will be used based on current input.
 */
const InputModePill = memo(({ hasText, hasImage }) => {
  let modeKey = null;
  if (hasText && hasImage) modeKey = "text+image";
  else if (hasImage) modeKey = "image-only";
  else if (hasText) modeKey = "text-only";

  if (!modeKey) return null;

  const { label, icon, color } = MODE_LABELS[modeKey];
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${color} transition-all`}>
      <span>{icon}</span>
      <span>{label}</span>
      {modeKey === "text+image" && (
        <span className="text-[10px] font-bold bg-purple-200 text-purple-800 px-1.5 py-0.5 rounded-full">
          BEST
        </span>
      )}
    </div>
  );
});
InputModePill.displayName = "InputModePill";

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

const LoadingSkeleton = memo(() => (
  <div className="animate-pulse space-y-4">
    {/* Header */}
    <div className="rounded-2xl overflow-hidden">
      <div className="h-24 bg-gray-200 rounded-t-2xl" />
      <div className="bg-white p-5 rounded-b-2xl border border-gray-100 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-3 bg-gray-100 rounded w-3/4" />
      </div>
    </div>
    {/* Detail rows */}
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="h-16 bg-gray-100 rounded-xl" />
    ))}
  </div>
));
LoadingSkeleton.displayName = "LoadingSkeleton";

// ─── Result Card ──────────────────────────────────────────────────────────────

const ResultDetailRow = memo(({ icon, label, value, valueClass = "text-gray-700" }) => (
  <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
    <span className="text-xl shrink-0 mt-0.5">{icon}</span>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{label}</p>
      <p className={`text-sm font-medium leading-relaxed ${valueClass}`}>{value}</p>
    </div>
  </div>
));
ResultDetailRow.displayName = "ResultDetailRow";

const ResultCard = memo(({ result, mode, onListForRent, onSellAsScrap, onAddToMarketplace }) => {
  const catCfg = CATEGORY_CONFIG[result.category] || CATEGORY_CONFIG.Reusable;
  const actCfg = ACTION_CONFIG[result.bestAction] || ACTION_CONFIG.Reuse;
  const confCfg = CONFIDENCE_CONFIG[result.confidence] || CONFIDENCE_CONFIG.Medium;
  const modeMeta = MODE_LABELS[mode] || MODE_LABELS["text-only"];

  return (
    <div className={`rounded-2xl border-2 overflow-hidden shadow-md ${catCfg.bg} ${catCfg.border}`}>

      {/* Header band */}
      <div className={`${catCfg.headerBg} px-6 py-5 text-white`}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-3xl">{catCfg.emoji}</span>
          {/* Confidence badge */}
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${confCfg.bg} ${confCfg.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${confCfg.dot}`} />
            {result.confidence} Confidence
          </div>
        </div>
        {/* Category */}
        <div className="mb-1">
          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold mb-2 ${catCfg.badge}`}>
            {result.category.toUpperCase()}
          </span>
        </div>
        {/* Best Action */}
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold ${actCfg.bg} ${actCfg.color} ${actCfg.border} border`}>
          <span>{actCfg.emoji}</span>
          Best Action: {result.bestAction}
        </div>
      </div>

      {/* Analysis mode tag */}
      <div className="px-6 pt-4 pb-1">
        <div className={`inline-flex items-center gap-1.5 text-[11px] font-semibold border px-2.5 py-1 rounded-full ${modeMeta.color}`}>
          <span>{modeMeta.icon}</span>
          {modeMeta.label}
        </div>
      </div>

      {/* Detail rows */}
      <div className="px-6 pb-4 space-y-2.5 mt-3">
        <ResultDetailRow icon="💡" label="Suggestion" value={result.suggestion} />
        <ResultDetailRow icon="🔍" label="Reason" value={result.reason} />
        <ResultDetailRow
          icon="💵" label="Estimated Value"
          value={result.estimatedValue}
          valueClass="text-green-700 font-semibold"
        />
        <ResultDetailRow
          icon="🌍" label="Environmental Impact"
          value={result.ecoImpact}
          valueClass="text-emerald-700"
        />
      </div>

      {/* Action buttons */}
      <div className="px-6 pb-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
          Quick Actions
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            onClick={onListForRent}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl transition-colors"
          >
            🔄 List for Rent
          </button>
          <button
            onClick={onSellAsScrap}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-xl transition-colors"
          >
            ♻️ Sell as Scrap
          </button>
          <button
            onClick={onAddToMarketplace}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors"
          >
            🛒 Add to Pickup
          </button>
        </div>
      </div>

      {/* Footer disclaimer */}
      <div className="px-6 py-3 bg-white/60 border-t border-gray-200/60">
        <p className="text-[11px] text-gray-400 text-center">
          AI-generated · Results may vary · Exercise your own judgment before acting
        </p>
      </div>
    </div>
  );
});
ResultCard.displayName = "ResultCard";

// ─── Info Panel (shown before first result) ───────────────────────────────────

const InfoPanel = memo(() => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 space-y-5">
    <div>
      <h2 className="text-base font-semibold text-gray-800 mb-1 flex items-center gap-2">
        <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
        What you'll receive
      </h2>
      <p className="text-xs text-gray-500 ml-8">AI analyses your item and returns:</p>
    </div>

    <div className="space-y-2.5">
      {[
        { emoji: "🏷️", title: "Category", desc: "Recyclable, Scrap, Reusable, or Rentable" },
        { emoji: "🎯", title: "Best Action", desc: "Sell, Rent, Scrap, or Reuse" },
        { emoji: "💡", title: "Suggestion & Reason", desc: "Clear, actionable guidance on what to do" },
        { emoji: "💵", title: "Estimated Value", desc: "Monetary value or earning potential" },
        { emoji: "🌍", title: "Eco Impact", desc: "Your contribution to a greener planet" },
        { emoji: "📊", title: "Confidence Level", desc: "How certain the AI is about its analysis" },
      ].map(({ emoji, title, desc }) => (
        <div key={title} className="flex gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
          <span className="text-lg shrink-0">{emoji}</span>
          <div>
            <p className="text-sm font-semibold text-gray-800">{title}</p>
            <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
          </div>
        </div>
      ))}
    </div>

    {/* Mode legend */}
    <div className="pt-2 border-t border-gray-100">
      <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">
        Analysis Modes
      </p>
      <div className="space-y-1.5">
        {Object.entries(MODE_LABELS).map(([key, { icon, label, color }]) => (
          <div key={key} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${color}`}>
            <span>{icon}</span>
            <span>{label}</span>
            {key === "text+image" && (
              <span className="ml-auto text-[10px] font-bold bg-purple-200 text-purple-800 px-1.5 py-0.5 rounded-full">
                BEST
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  </div>
));
InfoPanel.displayName = "InfoPanel";

// ─── Main Page ────────────────────────────────────────────────────────────────

const AiDecision = () => {
  const navigate = useNavigate();

  // Text fields
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [description, setDescription] = useState("");

  // Image fields
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);   // { data, mode }
  const [resultMode, setResultMode] = useState(null);

  // Derived: does the user have any text input?
  const hasText = Boolean(
    title.trim() || category || condition || description.trim()
  );
  const hasImage = Boolean(imageFile);
  const canSubmit = (hasText || hasImage) && !loading;

  // ── Image handlers ──────────────────────────────────────────────────────────
  const handleImageFile = useCallback((file) => {
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  }, []);

  const handleImageClear = useCallback(() => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
  }, [imagePreview]);

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await getAssistantDecision({
        title, category, condition, description, imageFile,
      });
      setResult(response.data);
      setResultMode(response.mode);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Failed to get AI suggestion. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [canSubmit, title, category, condition, description, imageFile]);

  // ── Reset ───────────────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setTitle(""); setCategory(""); setCondition(""); setDescription("");
    handleImageClear();
    setResult(null); setResultMode(null);
  }, [handleImageClear]);

  // ── Action button handlers — redirect to existing app flows ─────────────────
  const handleListForRent = useCallback(() => {
    toast("Redirecting to create a pickup request…", { icon: "🔄" });
    navigate("/pickups/create");
  }, [navigate]);

  const handleSellAsScrap = useCallback(() => {
    toast("Redirecting to schedule a scrap pickup…", { icon: "♻️" });
    navigate("/pickups/create");
  }, [navigate]);

  const handleAddToMarketplace = useCallback(() => {
    toast("Redirecting to create a pickup…", { icon: "🛒" });
    navigate("/pickups/create");
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">

        {/* ── Page header ──────────────────────────────────────────────────── */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">🤖</span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight leading-tight">
                AI Smart Classifier
              </h1>
              <p className="text-xs text-gray-400 font-medium tracking-wide mt-0.5">
                Powered by GPT-4o Vision
              </p>
            </div>
          </div>

          {/* Subtitle + mode hint */}
          <div className="ml-12 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <p className="text-gray-500 text-sm">
              Upload an image, describe your item, or{" "}
              <span className="font-semibold text-purple-600">use both together</span>{" "}
              for the best results.
            </p>
            {/* Live mode indicator */}
            <InputModePill hasText={hasText} hasImage={hasImage} />
          </div>
        </div>

        {/* ── Main two-column layout ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-start">

          {/* LEFT: Input form */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-5 flex items-center gap-2">
              <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
              Describe Your Item
            </h2>

            {/* Tip banner */}
            <div className="mb-5 p-3 rounded-xl bg-purple-50 border border-purple-100 flex items-start gap-2">
              <span className="text-purple-500 text-sm shrink-0 mt-0.5">💡</span>
              <p className="text-xs text-purple-700 leading-relaxed">
                <span className="font-semibold">Tip:</span> Upload an image <em>and</em> fill in details for the most accurate classification.
                Text or image alone also works great.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Image upload zone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Item Image <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <ImageUploadZone
                  imageFile={imageFile}
                  imagePreview={imagePreview}
                  onFile={handleImageFile}
                  onClear={handleImageClear}
                  disabled={loading}
                />
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                  and/or
                </span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Text inputs */}
              <TextField
                id="title" label="Item Title"
                value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Old Laptop, Broken Chair, AC Unit"
                disabled={loading}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SelectField
                  id="category" label="Category"
                  value={category} onChange={(e) => setCategory(e.target.value)}
                  options={CATEGORIES} placeholder="Select category"
                  disabled={loading}
                />
                <SelectField
                  id="condition" label="Condition"
                  value={condition} onChange={(e) => setCondition(e.target.value)}
                  options={CONDITIONS} placeholder="Select condition"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Description <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  id="description" value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Age, working state, reason for disposal, any defects…"
                  rows={3} disabled={loading}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-xl text-sm text-gray-800
                    focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
                    transition resize-none ${loading ? "bg-gray-100 cursor-not-allowed" : ""}`}
                />
              </div>

              {/* Submit + Reset */}
              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold
                    rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed
                    flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Analysing…
                    </>
                  ) : (
                    <>🤖 Classify Item</>
                  )}
                </button>

                {(result || hasText || hasImage) && (
                  <button
                    type="button" onClick={handleReset} disabled={loading}
                    className="px-4 py-3 border border-gray-300 text-gray-600 text-sm font-medium
                      rounded-xl hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Validation hint */}
              {!hasText && !hasImage && (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 px-3 py-2 rounded-lg text-center">
                  Please upload an image or fill in at least one text field to continue.
                </p>
              )}
            </form>
          </div>

          {/* RIGHT: Result / Info */}
          <div>
            {!loading && !result && <InfoPanel />}
            {loading && <LoadingSkeleton />}
            {!loading && result && (
              <ResultCard
                result={result}
                mode={resultMode}
                onListForRent={handleListForRent}
                onSellAsScrap={handleSellAsScrap}
                onAddToMarketplace={handleAddToMarketplace}
              />
            )}
          </div>
        </div>

        {/* ── Footer banner ─────────────────────────────────────────────────── */}
        <div className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-4 sm:p-5">
          <p className="text-sm text-green-700 text-center">
            🌱 EcoLoop's AI engine helps you make smarter, more sustainable decisions —
            reducing waste and maximising the value of your items.
          </p>
        </div>

      </div>
    </div>
  );
};

export default AiDecision;
