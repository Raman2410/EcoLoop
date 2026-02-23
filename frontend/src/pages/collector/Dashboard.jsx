import { useEffect, useState } from "react";
import { ClipboardList, CheckCircle, Clock } from "lucide-react";
import { Link } from "react-router-dom";

const CollectorDashboard = () => {
  const [stats, setStats] = useState({
    pending: 0,
    assigned: 0,
    completedToday: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [pendingRes, assignedRes, completedRes] = await Promise.all([
                    axiosInstance.get("/pickups/pending"),
                    axiosInstance.get("/pickups/assigned"),
                    axiosInstance.get("/pickups/completed"),
        ]);

        const [pendingData, assignedData, completedData] = await Promise.all([
          pendingRes.json(),
          assignedRes.json(),
          completedRes.json(),
        ]);

        // Count pickups completed today
        const today = new Date().toDateString();
        const completedToday = (completedData.pickups || []).filter((p) => {
          return p.completedAt && new Date(p.completedAt).toDateString() === today;
        }).length;

        setStats({
          pending: Array.isArray(pendingData) ? pendingData.length : 0,
          assigned: (assignedData.pickups || []).length,
          completedToday,
        });
      } catch (err) {
        console.error("Failed to load dashboard stats", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Collector Dashboard</h1>
        <p className="text-sm text-gray-500">Overview of today's pickup activity</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <div className="flex items-center gap-3">
            <Clock className="text-yellow-600" />
            <span className="text-sm text-gray-600">Pending Requests</span>
          </div>
          <p className="text-3xl font-bold text-gray-800 mt-3">
            {loading ? "..." : stats.pending}
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <div className="flex items-center gap-3">
            <ClipboardList className="text-blue-600" />
            <span className="text-sm text-gray-600">Accepted Pickups</span>
          </div>
          <p className="text-3xl font-bold text-gray-800 mt-3">
            {loading ? "..." : stats.assigned}
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <div className="flex items-center gap-3">
            <CheckCircle className="text-green-600" />
            <span className="text-sm text-gray-600">Completed Today</span>
          </div>
          <p className="text-3xl font-bold text-gray-800 mt-3">
            {loading ? "..." : stats.completedToday}
          </p>
        </div>
      </div>

      {/* Primary Action */}
      <div className="bg-white rounded-xl shadow-sm border p-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Pickup Requests</h2>
          <p className="text-sm text-gray-500">View and accept new pickup requests from users</p>
        </div>
        <Link
          to="/collector/requests"
          className="px-5 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-500 transition"
        >
          View Requests →
        </Link>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
        <p className="text-sm text-blue-700">
          💡 Tip: Accepting pickups earlier helps you plan routes efficiently.
        </p>
      </div>

    </div>
  );
};

export default CollectorDashboard;