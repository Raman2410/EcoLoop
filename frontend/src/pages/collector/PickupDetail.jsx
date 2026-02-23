import { MapPin, Calendar, Image as ImageIcon } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { acceptPickup } from "../../services/collector.service";
import toast from "react-hot-toast";




const PickupDetail = () => {
 
  const { state: pickup } = useLocation();
const navigate = useNavigate();

if (!pickup) {
  return <p className="text-gray-500">Pickup not found</p>;
}
const handleAccept = async () => {
  try {
    await acceptPickup(pickup._id);
    toast.success("Pickup accepted successfully");
    navigate("/collector/assigned");
  } catch (error) {
    toast.error(
      error.response?.data?.message || "Failed to accept pickup"
    );
  }
};


  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Pickup Details
        </h1>
        <p className="text-sm text-gray-500">
          Review pickup information before taking action
        </p>
      </div>

      {/* Pickup Card */}
      <div className="bg-white border rounded-2xl p-6 space-y-5 shadow-sm">
        {/* Scrap Info */}
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Scrap Type
            </h2>
            <p className="text-gray-600">{pickup.scrapType}</p>

          </div>

          <span className="px-3 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700 font-medium">
            {pickup.status}
          </span>
        </div>

        {/* Load */}
        <div>
          <p className="text-sm text-gray-500">Approximate Load</p>
         <p className="font-medium text-gray-800">
  {pickup.approxLoad}
</p>

        </div>

        {/* Address */}
        <div className="flex gap-3 items-start">
          <MapPin className="text-gray-500 mt-1" />
          <div>
            <p className="text-sm text-gray-500">Pickup Address</p>
            <p className="text-gray-800">
  {pickup.address}
</p>

          </div>
        </div>

        {/* Date */}
        <div className="flex gap-3 items-center">
          <Calendar className="text-gray-500" />
          <div>
            <p className="text-sm text-gray-500">Scheduled Date</p>
         <p className="text-gray-800">
  {new Date(pickup.scheduledDate).toDateString()}
</p>

          </div>
        </div>

        {/* Image */}
        {pickup.image ? (
  <img
    src={pickup.image}
    alt="Scrap"
    className="rounded-xl max-h-64 object-cover"
  />
) : (
  <div className="border rounded-xl p-6 text-center text-gray-500">
    <ImageIcon className="mx-auto mb-2 opacity-40" />
    <p>No image provided</p>
  </div>
)}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <button onClick={() => navigate(-1)}  className="px-5 py-2 border rounded-lg hover:bg-gray-50">Back</button>
     <button onClick={handleAccept} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500"> Accept Pickup</button>
      </div>
    </div>
  );
};

export default PickupDetail;
