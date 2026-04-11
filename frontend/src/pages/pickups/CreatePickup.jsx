import { useState, useCallback, memo, useEffect } from "react";
import { createPickup } from "../../services/pickup.service";
import ImageUpload from "../../components/common/ImageUpload";
import Button from "../../components/common/Button";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { analyzeItem } from "../../services/ai.service";

const today = new Date().toISOString().split("T")[0];

const inputClass = (hasError) =>
  `w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition text-sm ${
    hasError ? "border-red-400 bg-red-50" : "border-gray-300"
  }`;

// Memoized field error to avoid re-renders
const FieldError = memo(({ message }) =>
  message ? <p className="text-red-500 text-xs mt-1">{message}</p> : null
);
FieldError.displayName = "FieldError";

const InfoCard = memo(({ title, items }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
    <h3 className="text-base font-semibold mb-3">{title}</h3>
    <ul className="text-sm text-gray-600 space-y-2">
      {items.map((item) => <li key={item}>{item}</li>)}
    </ul>
  </div>
));
InfoCard.displayName = "InfoCard";

const CreatePickup = () => {
  const navigate = useNavigate();
  const [address, setAddress] = useState("");
  const [area, setArea] = useState("");
  const [scrapType, setScrapType] = useState("");
  const [approxLoad, setApproxLoad] = useState("");
  const [image, setImage] = useState(null);
  const [scheduledDate, setScheduledDate] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [aiDescription, setAiDescription] = useState("");
const [aiAnalyzing, setAiAnalyzing] = useState(false);
const [aiResult, setAiResult] = useState(null);
  const [coords, setCoords] = useState(null);

  // Capture GPS location on mount to ensure accurate pickup pinning
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords([pos.coords.latitude, pos.coords.longitude]),
        () => setCoords(null)
      );
    }
  }, []);

  const validate = useCallback(() => {
    const e = {};
    if (!address || address.trim().length < 10)
      e.address = "Please enter a full address (at least 10 characters)";
    if (!area || area.trim().length < 2)
      e.area = "Please enter your locality / area name";
    if (!scrapType) e.scrapType = "Please select a scrap type";
    if (!approxLoad) e.approxLoad = "Please select an approximate load";
    if (!scheduledDate) e.scheduledDate = "Please select a pickup date";
    else if (scheduledDate < today) e.scheduledDate = "Scheduled date must be today or in the future";
    return e;
  }, [address, area, scrapType, approxLoad, scheduledDate]);

  const handleAIAnalysis = async () => {
  if (!aiDescription.trim()) {
    toast.error("Please enter an item description");
    return;
  }
  
  setAiAnalyzing(true);
  setAiResult(null);
  
  try {
    const response = await analyzeItem(aiDescription);
    setAiResult(response.data);
    
    // Auto-fill scrapType from AI result
    const scrapTypeMapping = {
      "Recyclable": response.data.category.toUpperCase(),
      "Scrap": response.data.category.toUpperCase(),
      "Reusable": "PAPER", // Default fallback
      "Rentable": "METAL", // Default fallback
    };
    
    // Try to match AI category to our scrap types
    const aiCategory = response.data.category;
    if (["PLASTIC", "PAPER", "CARDBOARD", "METAL", "ELECTRONICS", "GLASS"].includes(aiCategory.toUpperCase())) {
      setScrapType(aiCategory.toUpperCase());
      toast.success("✨ Item analyzed! Scrap type auto-filled");
    } else {
      toast.success("✨ Item analyzed! Please select scrap type manually");
    }
  } catch (error) {
    toast.error(error.response?.data?.message || "AI analysis failed");
  } finally {
    setAiAnalyzing(false);
  }
};

  const submitHandler = useCallback(async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("scrapType", scrapType);
      formData.append("approxLoad", approxLoad);
      formData.append("address", address.trim());
      formData.append("area", area.trim());
      formData.append("scheduledDate", scheduledDate);
      formData.append("lat", coords?.[0] ?? "");
      formData.append("lng", coords?.[1] ?? "");
      if (image) {
        formData.append("image", image);
      }

      await createPickup(formData);
      toast.success("Pickup scheduled successfully 🚛");
      navigate("/pickups");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create pickup");
    } finally {
      setSubmitting(false);
    }
  }, [validate, scrapType, approxLoad, address, area, scheduledDate, coords, image, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">


      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl shadow-sm border border-purple-100 p-5 sm:p-6 mb-6">
  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
    <span className="text-2xl">🤖</span> AI-Powered Analysis
  </h3>
  <p className="text-sm text-gray-600 mb-4">
    Describe your item and let AI suggest the scrap type and estimated value
  </p>
  
  <div className="space-y-3">
    <textarea
      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none resize-none text-sm"
      placeholder="E.g., Old plastic water bottles, broken laptop, cardboard boxes..."
      rows="3"
      value={aiDescription}
      onChange={(e) => setAiDescription(e.target.value)}
      disabled={aiAnalyzing}
    />
    
    <Button
      onClick={handleAIAnalysis}
      disabled={aiAnalyzing || !aiDescription.trim()}
      variant="secondary"
      className="w-full sm:w-auto"
    >
      {aiAnalyzing ? "Analyzing..." : "🔍 Analyze Item"}
    </Button>
    
    {aiResult && (
      <div className="bg-white rounded-lg p-4 border border-purple-200 mt-4 space-y-2">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-700">Category: <span className="text-purple-600">{aiResult.category}</span></p>
            <p className="text-sm font-medium text-gray-700">Best Action: <span className="text-green-600">{aiResult.bestAction}</span></p>
            <p className="text-xs text-gray-500 mt-1">{aiResult.suggestion}</p>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full ${
            aiResult.confidence === "High" ? "bg-green-100 text-green-700" :
            aiResult.confidence === "Medium" ? "bg-yellow-100 text-yellow-700" :
            "bg-gray-100 text-gray-700"
          }`}>
            {aiResult.confidence}
          </span>
        </div>
        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-600">💰 {aiResult.estimatedValue}</p>
          <p className="text-xs text-gray-600">🌱 {aiResult.ecoImpact}</p>
        </div>
      </div>
    )}
  </div>
</div>
        {/* LEFT: FORM */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">📦 Schedule a Scrap Pickup</h2>
          <p className="text-sm text-gray-500 mb-6">Help the environment and earn rewards by recycling responsibly.</p>

          <form onSubmit={submitHandler} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Pickup Address</label>
              <input
                className={inputClass(errors.address)}
                placeholder="Enter full pickup address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
              <FieldError message={errors.address} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Locality / Area</label>
              <input
                className={inputClass(errors.area)}
                placeholder="e.g. Koramangala, Indiranagar, Sector 15"
                value={area}
                onChange={(e) => setArea(e.target.value)}
              />
              <FieldError message={errors.area} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Scrap Type</label>
              <select
                className={inputClass(errors.scrapType)}
                value={scrapType}
                onChange={(e) => setScrapType(e.target.value)}
              >
                <option value="">Select Scrap Type</option>
                <option value="PLASTIC">Plastic</option>
                <option value="PAPER">Paper</option>
                <option value="CARDBOARD">Cardboard</option>
                <option value="METAL">Metal</option>
                <option value="ELECTRONICS">Electronics</option>
                <option value="GLASS">Glass</option>
                
              </select>
              <FieldError message={errors.scrapType} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Approximate Load</label>
              <select
                className={inputClass(errors.approxLoad)}
                value={approxLoad}
                onChange={(e) => setApproxLoad(e.target.value)}
              >
                <option value="">Select Load</option>
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
                <option value="bulk">Bulk</option>
              </select>
              <FieldError message={errors.approxLoad} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Scheduled Date</label>
              <input
                type="date"
                min={today}
                className={inputClass(errors.scheduledDate)}
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
              />
              <FieldError message={errors.scheduledDate} />
            </div>

            <Button type="submit" className="w-full py-3 text-base" disabled={submitting}>
              {submitting ? "Scheduling..." : "🚚 Create Pickup"}
            </Button>
          </form>
        </div>

        {/* RIGHT: OPTIONAL + INFO */}
        <div className="flex flex-col gap-5">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
            <h3 className="text-base font-semibold mb-1">📷 Upload Scrap Image <span className="text-gray-400 font-normal text-sm">(Optional)</span></h3>
            <p className="text-sm text-gray-500 mb-4">This helps the collector better understand the pickup.</p>
            <ImageUpload image={image} setImage={setImage} />
          </div>

          <InfoCard
            title="♻ Why recycle with EcoLoop?"
            items={["✔ Reduce landfill waste", "✔ Earn rewards for every pickup", "✔ Safe & verified pickup partners"]}
          />

          <InfoCard
            title="🛡 Pickup Safety Tips"
            items={["✔ Keep scrap sorted before pickup", "✔ Ensure someone is available at address", "✔ Avoid hazardous waste"]}
          />

          <div className="bg-green-50 border border-green-100 rounded-2xl p-5">
            <p className="text-sm text-green-700 font-medium">
              🌱 Every pickup you schedule helps build a cleaner, greener future.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePickup;