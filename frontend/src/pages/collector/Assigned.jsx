import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import axiosInstance from "../../api/axiosInstance";

const AssignedPickups = () => {
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(null); // tracks which pickup is being completed

  useEffect(() => {
    fetchAssignedPickups();
  }, []);

  const fetchAssignedPickups = async () => {
    try {
      const res = await axiosInstance.get("/pickups/assigned");
      setPickups(res.data.pickups || res.data || []);
    } catch (err) {
      console.error("Failed to load assigned pickups", err);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (pickupId) => {
    setCompleting(pickupId);
    try {
      const res = await axiosInstance.patch(`/pickups/complete/${pickupId}`);

      const data = res.data;
      toast.success(`✅ Pickup completed! EcoCoins earned: ${data.ecoCoinsEarned}`);
      // Remove from assigned list after completion
      setPickups((prev) => prev.filter((p) => p._id !== pickupId));
    } catch (err) {
      console.error("Complete pickup error:", err);
      alert("Something went wrong");
    } finally {
      setCompleting(null);
    }
  };

  if (loading) {
    return <p className="text-gray-500">Loading assigned pickups...</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Assigned Pickups</h1>
      <p className="text-gray-500 mb-6">
        Pickups you have accepted and are yet to complete
      </p>

      {pickups.length === 0 ? (
        <div className="bg-white p-6 rounded-xl shadow-sm text-gray-400">
          No assigned pickups found.
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3">User</th>
                <th className="text-left px-4 py-3">Address</th>
                <th className="text-left px-4 py-3">Scrap Type</th>
                <th className="text-left px-4 py-3">Load</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {pickups.map((pickup) => (
                <tr key={pickup._id} className="border-t">
                  <td className="px-4 py-3">
                    <div className="font-medium">{pickup.userId?.name}</div>
                    <div className="text-xs text-gray-500">{pickup.userId?.phone}</div>
                  </td>
                  <td className="px-4 py-3">
                    {pickup.address || pickup.userId?.address || "—"}
                  </td>
                  <td className="px-4 py-3 capitalize">{pickup.scrapType}</td>
                  <td className="px-4 py-3 capitalize">{pickup.approxLoad}</td>
                  <td className="px-4 py-3">
                    <span className="text-orange-600 font-medium">Assigned</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleComplete(pickup._id)}
                      disabled={completing === pickup._id}
                      className="bg-green-600 text-white px-3 py-1.5 rounded-md text-xs hover:bg-green-700 disabled:opacity-50"
                    >
                      {completing === pickup._id ? "Completing..." : "Complete Pickup"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AssignedPickups;