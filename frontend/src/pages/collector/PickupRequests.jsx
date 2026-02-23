import { MapPin, Package } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPendingPickups, acceptPickup } from "../../services/collector.service";
import toast from "react-hot-toast";

const PickupRequests = () => {
  const navigate = useNavigate();
  const [pickups, setPickups] = useState([]);
  const [accepting, setAccepting] = useState(null); // track which pickup is being accepted

  useEffect(() => {
    getPendingPickups()
      .then((data) => setPickups(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error fetching pickups:", err));
  }, []);

  // ✅ Each card passes its own pickup._id
  const handleAccept = async (pickupId) => {
    setAccepting(pickupId);
    try {
      await acceptPickup(pickupId);
      toast.success("Pickup accepted!");
      // Remove accepted pickup from list instantly
      setPickups((prev) => prev.filter((p) => p._id !== pickupId));
      navigate("/collector/assigned");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to accept pickup");
    } finally {
      setAccepting(null);
    }
  };

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-2xl font-bold text-gray-800">New Requests</h1>
        <p className="text-sm text-gray-500">Pickup requests waiting for acceptance</p>
      </div>

      {pickups.length === 0 ? (
        <div className="bg-white border rounded-xl p-10 text-center text-gray-500">
          <Package className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">No pickup requests available</p>
          <p className="text-sm mt-1">Check back later for new requests</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pickups.map((pickup) => (
            <div key={pickup._id} className="bg-white border rounded-xl p-5 flex flex-col gap-4">

              {/* Top row */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-800 capitalize">{pickup.scrapType}</h3>
                  <p className="text-sm text-gray-500 capitalize">{pickup.approxLoad} load</p>
                </div>
                <span className="px-3 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700 font-medium">
                  Pending
                </span>
              </div>

              {/* User info */}
              {pickup.userId && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{pickup.userId.name}</span>
                  {pickup.userId.phone && (
                    <span className="ml-2 text-gray-400">· {pickup.userId.phone}</span>
                  )}
                </div>
              )}

              {/* Address */}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin size={16} />
                <span>{pickup.address || pickup.userId?.address || "—"}</span>
              </div>

              {/* Scheduled date */}
              {pickup.scheduledDate && (
                <p className="text-sm text-gray-500">
                  📅 Scheduled: {new Date(pickup.scheduledDate).toLocaleDateString()}
                </p>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  onClick={() => navigate(`/collector/requests/${pickup._id}`, { state: pickup })}
                  className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
                >
                  View Details
                </button>

                <button
                  onClick={() => handleAccept(pickup._id)}
                  disabled={accepting === pickup._id}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 disabled:opacity-50 text-sm font-medium"
                >
                  {accepting === pickup._id ? "Accepting..." : "Accept Pickup"}
                </button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PickupRequests;