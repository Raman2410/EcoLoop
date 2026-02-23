import { useEffect, useState } from "react";

const CompletedPickups = () => {
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompletedPickups = async () => {
      try {
        const res = await axiosInstance.get("/pickups/completed");
        const data = await res.json();
        setPickups(data.pickups || []);
      } catch (err) {
        console.error("Failed to load completed pickups", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCompletedPickups();
  }, []);

  if (loading) {
    return <p className="text-gray-500">Loading completed pickups...</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Completed Pickups</h1>
      <p className="text-gray-500 mb-6">
        All pickups successfully completed by you
      </p>

      {pickups.length === 0 ? (
        <div className="bg-white p-6 rounded-xl shadow-sm text-gray-400">
          No completed pickups found.
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
                <th className="text-left px-4 py-3">EcoCoins</th>
                <th className="text-left px-4 py-3">Completed On</th>
                <th className="text-left px-4 py-3">Status</th>
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
                  <td className="px-4 py-3 text-emerald-600 font-medium">
                    {pickup.ecoCoins || pickup.rewardCoins || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {pickup.completedAt
                      ? new Date(pickup.completedAt).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                      Completed
                    </span>
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

export default CompletedPickups;