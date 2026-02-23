import { useState } from "react";
import { createPickup } from "../../services/pickup.service";
import ImageUpload from "../../components/common/ImageUpload";

import Button from "../../components/common/Button";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const CreatePickup = () => {
  const navigate = useNavigate();

  const [address, setAddress] = useState("");
  const [scrapType, setScrapType] = useState("");
  const [approxLoad, setApproxLoad] = useState("");
  const [image, setImage] = useState(null);

  const [scheduledDate, setScheduledDate] = useState("");
const [errors, setErrors] = useState({});
const [submitting, setSubmitting] = useState(false);

const today = new Date().toISOString().split("T")[0];
const validate = () => {
  const newErrors = {};
  if (!address || address.trim().length < 10)
    newErrors.address = "Please enter a full address (at least 10 characters)";
  if (!scrapType)
    newErrors.scrapType = "Please select a scrap type";
  if (!approxLoad)
    newErrors.approxLoad = "Please select an approximate load";
  if (!scheduledDate)
    newErrors.scheduledDate = "Please select a pickup date";
  else if (scheduledDate < today)
    newErrors.scheduledDate = "Scheduled date must be today or in the future";
  return newErrors;
};

 const submitHandler = async (e) => {
  e.preventDefault();
  const validationErrors = validate();
  if (Object.keys(validationErrors).length > 0) {
    setErrors(validationErrors);
    return;
  }
  setErrors({});
  setSubmitting(true);
  try {
    await createPickup({ scrapType, approxLoad, address: address.trim(), scheduledDate });
    toast.success("Pickup scheduled successfully 🚛");
    navigate("/pickups");
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to create pickup");
  } finally {
    setSubmitting(false);
  }
};

const FieldError = ({ field }) =>
  errors[field] ? (
    <p className="text-red-500 text-xs mt-1">{errors[field]}</p>
  ) : null;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10">

        {/* ================= LEFT: FORM ================= */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-1">
            📦 Schedule a Scrap Pickup
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Help the environment and earn rewards by recycling responsibly.
          </p>

          <form onSubmit={submitHandler} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Pickup Address
              </label>
              <input className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition ${
                errors.address ? "border-red-400 bg-red-50" : "border-gray-300" }`}
                 placeholder="Enter full pickup address"
                  value={address}  onChange={(e) => setAddress(e.target.value)}/>
<FieldError field="address" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Scrap Type
              </label>
              <select className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition ${
                    errors.scrapType ? "border-red-400 bg-red-50" : "border-gray-300"}`} 
                      value={scrapType}onChange={(e) => setScrapType(e.target.value)}>
                <option value="">Select Scrap Type</option>
                <option value="PLASTIC">Plastic</option>
                <option value="PAPER">Paper</option>
                <option value="CARDBOARD">Cardboard</option>
              </select>
              <FieldError field="scrapType" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Approximate Load
              </label>
              <select className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition ${
    errors.approxLoad ? "border-red-400 bg-red-50" : "border-gray-300" }`}
     value={approxLoad} onChange={(e) => setApproxLoad(e.target.value)}>
                <option value="">Select Load</option>
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
                <option value="bulk">Bulk</option>
              </select>
              <FieldError field="approxLoad" />
            </div>
                  {/* <ImageUpload image={image} setImage={setImage} /> */}

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Scheduled Date
              </label>
              <input type="date" min={today}
                     className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition ${
                      errors.scheduledDate ? "border-red-400 bg-red-50" : "border-gray-300" }`}
                       value={scheduledDate}  onChange={(e) => setScheduledDate(e.target.value)}/>
<FieldError field="scheduledDate" />
            </div>

            <Button type="submit" className="w-full py-3 text-lg" disabled={submitting}>
                     {submitting ? "Scheduling..." : "🚚 Create Pickup"}
                       </Button>
          </form>
        </div>

       {/* ================= RIGHT: OPTIONAL + INFO ================= */}
<div className="flex flex-col gap-6">

  {/* Image Upload (Optional) */}
  <div className="bg-white rounded-2xl shadow-md p-6">
    <h3 className="text-lg font-semibold mb-1">
      📷 Upload Scrap Image (Optional)
    </h3>
    <p className="text-sm text-gray-500 mb-4">
      This helps the collector better understand the pickup.
    </p>

    <ImageUpload image={image} setImage={setImage} />
  </div>

  {/* Why recycle */}
  <div className="bg-white rounded-2xl shadow-md p-6">
    <h3 className="text-lg font-semibold mb-3">
      ♻ Why recycle with EcoLoop?
    </h3>
    <ul className="text-sm text-gray-600 space-y-2">
      <li>✔ Reduce landfill waste</li>
      <li>✔ Earn rewards for every pickup</li>
      <li>✔ Safe & verified pickup partners</li>
    </ul>
  </div>

  {/* Safety tips */}
  <div className="bg-white rounded-2xl shadow-md p-6">
    <h3 className="text-lg font-semibold mb-3">
      🛡 Pickup Safety Tips
    </h3>
    <ul className="text-sm text-gray-600 space-y-2">
      <li>✔ Keep scrap sorted before pickup</li>
      <li>✔ Ensure someone is available at address</li>
      <li>✔ Avoid hazardous waste</li>
    </ul>
  </div>

  {/* Green message */}
  <div className="bg-green-50 border border-green-100 rounded-2xl p-6">
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
