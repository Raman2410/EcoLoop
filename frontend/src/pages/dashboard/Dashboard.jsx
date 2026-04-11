import { useEffect, useState, useMemo, memo, useCallback } from "react";
import { Link } from "react-router-dom";
import { getMyPickups } from "../../services/pickup.service";
import { getPickupWeightKg } from "../../utils/pickupWeight";

// Memoized stat card to avoid re-renders
const StatCard = memo(({ label, value, color, note, loading }) => (
  <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
    <p className="text-sm text-gray-500 mb-1">{label}</p>
    <h3 className={`text-3xl font-bold ${color}`}>{loading ? "…" : value}</h3>
    <p className="text-xs text-gray-400 mt-2">{note}</p>
  </div>
));
StatCard.displayName = "StatCard";

const Dashboard = () => {
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCO2Saved, setTotalCO2Saved] = useState(0);

  const fetchPickups = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyPickups(1, 1000);
      const normalized = Array.isArray(data) ? data : (data?.pickups || []);
      setPickups(normalized);
      const completed = normalized.filter((p) => p.status?.toLowerCase() === "completed");
      const co2Total = completed.reduce((sum, p) => sum + (p.co2Saved || 0), 0);
      setTotalCO2Saved(co2Total);
    } catch (err) {
      console.error("Failed to load pickups", err);
      // 401 is handled globally by axiosInstance interceptor (auto-logout).
      // Any other error surfaces here so the user knows what went wrong.
      const msg =
        err.response?.data?.message ||
        "Could not load your pickup data. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPickups();
  }, [fetchPickups]);

  // Derived stats — only recomputed when pickups changes
  const stats = useMemo(() => {
    const completed = pickups.filter(
      (p) => p.status?.toLowerCase() === "completed"
    );
    const totalKgRecycled = completed.reduce(
      (sum, p) => sum + getPickupWeightKg(p),
      0
    );
    return {
      total: pickups.length,
      completed: completed.length,
      pending: pickups.filter((p) => p.status?.toLowerCase() === "pending")
        .length,
      totalKgRecycled,
      co2Saved: Math.round(totalKgRecycled * 3.5), // Using WRAP.org average of 3.5 kg CO₂ saved per kg recycled
    };
  }, [pickups]);

  // ── Error banner ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-red-100 max-w-md w-full text-center">
          <span className="text-4xl">⚠️</span>
          <h3 className="text-lg font-semibold text-gray-800 mt-4">
            Failed to load dashboard
          </h3>
          <p className="text-sm text-red-500 mt-2">{error}</p>
          <button
            onClick={fetchPickups}
            className="mt-5 px-5 py-2 bg-green-600 text-white text-sm font-medium rounded-xl hover:bg-green-500 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HERO */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 leading-tight">
              Welcome to <span className="text-green-600">EcoLoop</span>
            </h1>
            <p className="text-gray-600 mt-3 max-w-xl text-sm sm:text-base">
              EcoLoop helps you recycle scrap responsibly, track pickups,
              and earn rewards for building a cleaner and greener future.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/pickups/create" className="bg-green-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-500 transition-colors shadow-sm inline-flex items-center gap-2">
                <span>+</span> Schedule Pickup
              </Link>
              <Link to="/pickups" className="bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors inline-flex items-center gap-2">
                <span>📦</span> My Pickups
              </Link>
            </div>
          </div>
          <div className="flex justify-center">
            <img
              src="/images/dashboard.png"
              alt="EcoLoop Dashboard"
              className="w-full max-w-sm sm:max-w-md rounded-xl opacity-90"
              loading="lazy"
              width="448"
              height="300"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* ECO IMPACT HERO BANNER */}
        <div className="mb-8 sm:mb-10 bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-6 sm:p-8 shadow-sm border border-green-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">🌍</span>
                <h3 className="text-xl sm:text-2xl font-bold text-green-900">
                  Your Eco Impact
                </h3>
              </div>
              <p className="text-green-700 text-sm sm:text-base mt-1">
                Based on your completed pickups, you've made a real difference:
              </p>
              
              <div className="flex flex-wrap items-end gap-x-8 gap-y-4 mt-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-green-600 mb-1">Total Recycled</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl sm:text-5xl font-black text-green-800 tracking-tight">
                      {stats.totalKgRecycled}
                    </span>
                    <span className="text-lg font-bold text-green-600">kg</span>
                  </div>
                </div>
                
                <div className="hidden sm:block w-px h-12 bg-green-200" />
                
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-1">CO₂ Prevented</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl sm:text-5xl font-black text-emerald-700 tracking-tight">
                      {totalCO2Saved > 0 ? totalCO2Saved.toFixed(1) : "0"}
                    </span>
                    <span className="text-lg font-bold text-emerald-600">kg</span>
                  </div>
                </div>
              </div>
              
              <p className="text-xs text-emerald-600/70 mt-4 font-medium italic">
                * Environmental metrics calculated using verified WRAP.org Recycling CO₂ equivalent data.
              </p>
            </div>
            
            <div className="bg-white/60 backdrop-blur-sm border border-white rounded-2xl p-5 shadow-sm text-sm text-green-800 font-medium w-full md:max-w-xs leading-relaxed">
              ♻ Every single kilogram of scrap you recycle through EcoLoop directly prevents raw material extraction and reduces harmful greenhouse gases.
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-10">
          <StatCard
            label="Total Pickups"
            value={stats.total}
            color="text-gray-800"
            note="All pickup requests created"
            loading={loading}
          />
          <StatCard
            label="Completed"
            value={stats.completed}
            color="text-green-600"
            note="Successfully recycled pickups"
            loading={loading}
          />
          <StatCard
            label="Pending"
            value={stats.pending}
            color="text-yellow-600"
            note="Awaiting pickup confirmation"
            loading={loading}
          />

        </div>

        {/* RECENT PICKUPS */}
        <div className="mb-8 sm:mb-10">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg sm:text-xl font-bold text-gray-800">Recent Pickups</h3>
            <Link to="/pickups" className="text-sm font-medium text-green-600 hover:text-green-700">View All →</Link>
          </div>
          {loading ? (
            <p className="text-gray-500 text-sm">Loading previews...</p>
          ) : pickups.length > 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1 p-1 bg-gray-50">
              {pickups.slice(0, 3).map(pickup => (
                <div key={pickup._id} className="p-4 sm:p-5 flex justify-between items-center bg-white rounded-xl hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-xl shrink-0">
                      {pickup.scrapType?.toLowerCase() === 'plastic' ? '🧴' : pickup.scrapType?.toLowerCase() === 'paper' ? '📄' : pickup.scrapType?.toLowerCase() === 'metal' ? '🔩' : pickup.scrapType?.toLowerCase() === 'cardboard' ? '📦' : '♻️'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 capitalize">{pickup.scrapType?.toLowerCase() || 'Scrap'}</p>
                      <p className="text-xs text-gray-500">{new Date(pickup.scheduledDate || pickup.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <div>
                    <Link to={`/pickups/${pickup._id}`} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-green-600 transition-colors">
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center">
              <span className="text-3xl mb-2 block">🚚</span>
              <p className="text-gray-600 font-medium text-sm">No pickups found</p>
              <p className="text-gray-400 text-xs mt-1">Schedule your first pickup to get started!</p>
              <Link to="/pickups/create" className="inline-block mt-4 px-4 py-2 bg-green-50 text-green-700 text-xs font-bold rounded-lg hover:bg-green-100 transition-colors">
                Create Pickup
              </Link>
            </div>
          )}
        </div>

        {/* WHY IT MATTERS */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 flex flex-col lg:flex-row gap-6 sm:gap-8 items-center">
          <div className="flex-1">
            <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-3">
              🌍 Why Your Pickup Matters
            </h3>
            <p className="text-gray-600 leading-relaxed mb-4 text-sm sm:text-base">
              Every pickup you schedule helps reduce landfill waste, improves
              recycling efficiency, and supports the collectors who keep the
              system running.
            </p>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>✔ Scrap is sorted and sent for responsible recycling</li>
              <li>✔ Collectors save time through scheduled pickups</li>
              <li>✔ Less waste ends up in landfills</li>
            </ul>
          </div>
          <div className="flex-1 flex justify-center">
            <img
              src="/images/recycle.png"
              alt="Recycling Impact"
              className="max-w-[200px] sm:max-w-xs w-full"
              loading="lazy"
              width="320"
              height="280"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
