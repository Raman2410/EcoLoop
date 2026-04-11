import { useEffect, useState, useMemo, memo, useCallback } from "react";
import { getMyPickups } from "../../services/pickup.service";
import { useNavigate } from "react-router-dom";
import { getPickupWeightKg } from "../../utils/pickupWeight";
import Loader from "../../components/common/Loader";
import Pagination from "../../components/common/Pagination";

const SCRAP_ICONS = {
  metal: "🔩", plastic: "🧴", paper: "📄", glass: "🫙",
  ewaste: "💻", "e-waste": "💻", cardboard: "📦", rubber: "🔄", other: "♻",
};
const getIcon = (type = "") => SCRAP_ICONS[type.toLowerCase()] ?? "♻";

const STATUS_STYLE = {
  completed: { bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500", label: "Completed" },
  cancelled: { bg: "bg-red-100",   text: "text-red-600",   dot: "bg-red-400",   label: "Cancelled" },
};

// ── History Card ─────────────────────────────────────────────────────────────
const HistoryCard = memo(({ pickup, onViewDetails }) => {
  const st =
    STATUS_STYLE[pickup.status?.toLowerCase()] ?? STATUS_STYLE.cancelled;
  const isCompleted = pickup.status?.toLowerCase() === "completed";
  const weightKg = isCompleted ? getPickupWeightKg(pickup) : null;
  const ecoCoins = pickup.ecoCoins ?? pickup.rewardCoins ?? null;

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col">
      {/* Top accent strip */}
      <div className={`h-1 ${st.dot}`} />

      <div className="p-5 flex flex-col gap-3">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-xl shrink-0">
              {getIcon(pickup.scrapType)}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Scrap Type
              </p>
              <h3 className="text-base font-bold text-gray-900 capitalize">
                {pickup.scrapType}
              </h3>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${st.bg} ${st.text}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
            {st.label}
          </span>
        </div>

        {/* Details */}
        <div className="flex flex-col gap-1.5 text-sm text-gray-600">
          <div className="flex gap-2 items-start">
            <span className="shrink-0 mt-0.5">📍</span>
            <p>
              <span className="font-semibold text-gray-800">Address:</span>{" "}
              {pickup.address}
            </p>
          </div>
          <div className="flex gap-2">
            <span className="shrink-0">⚖️</span>
            <p>
              <span className="font-semibold text-gray-800">Load:</span>{" "}
              {pickup.approxLoad}
            </p>
          </div>
          <div className="flex gap-2">
            <span className="shrink-0">🗓</span>
            <p>
              <span className="font-semibold text-gray-800">Scheduled:</span>{" "}
              {new Date(pickup.scheduledDate).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
          {pickup.completedAt && (
            <div className="flex gap-2">
              <span className="shrink-0">✅</span>
              <p>
                <span className="font-semibold text-gray-800">Completed:</span>{" "}
                {new Date(pickup.completedAt).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          )}
        </div>

        {/* Reward pill — only for completed pickups */}
        {isCompleted && (weightKg || ecoCoins) && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
            {weightKg > 0 && (
              <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">
                ♻ {weightKg} kg recycled
              </span>
            )}
            {ecoCoins > 0 && (
              <span className="inline-flex items-center gap-1 bg-yellow-50 text-yellow-700 text-xs font-semibold px-3 py-1 rounded-full">
                🪙 +{ecoCoins} EcoCoins
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="mt-auto pt-3 border-t border-gray-100">
          <button
            onClick={() => onViewDetails(pickup._id)}
            className="w-full text-xs font-semibold text-green-600 hover:bg-green-50 px-3 py-2 rounded-lg transition-colors border border-green-200"
          >
            View Details & Review
          </button>
        </div>
      </div>
    </div>
  );
});
HistoryCard.displayName = "HistoryCard";

// ── Filter Tab ───────────────────────────────────────────────────────────────
const FilterTab = memo(({ label, active, count, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 ${
      active
        ? "bg-green-600 text-white shadow-sm"
        : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
    }`}
  >
    {label}
    <span
      className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
        active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
      }`}
    >
      {count}
    </span>
  </button>
));
FilterTab.displayName = "FilterTab";

// ── Main ─────────────────────────────────────────────────────────────────────
const PickupHistory = () => {
  const navigate = useNavigate();
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all"); // "all" | "completed" | "cancelled"

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [count, setCount] = useState(0);

  const fetchHistory = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyPickups(page, 10, "history");
      const all = Array.isArray(data) ? data : (data?.pickups || []);
      // Only keep completed + cancelled, sorted newest first
      const history = all
        .filter((p) =>
          ["completed", "cancelled"].includes(p.status?.toLowerCase())
        )
        .sort(
          (a, b) =>
            new Date(b.updatedAt ?? b.createdAt) -
            new Date(a.updatedAt ?? a.createdAt)
        );
      setPickups(history);
      setCurrentPage(data?.page || 1);
      setTotalPages(data?.totalPages || 1);
      setTotal(data?.total || 0);
      setCount(data?.count || 0);
    } catch (err) {
      console.error("Failed to load history", err);
      // 401 is handled globally (auto-logout). Surface all other errors.
      const msg =
        err.response?.data?.message ||
        "Could not load your pickup history. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePageChange = useCallback((newPage) => {
    setCurrentPage(newPage);
    fetchHistory(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [fetchHistory]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const counts = useMemo(
    () => ({
      all: pickups.length,
      completed: pickups.filter(
        (p) => p.status?.toLowerCase() === "completed"
      ).length,
      cancelled: pickups.filter(
        (p) => p.status?.toLowerCase() === "cancelled"
      ).length,
    }),
    [pickups]
  );

  const displayed = useMemo(
    () =>
      filter === "all"
        ? pickups
        : pickups.filter((p) => p.status?.toLowerCase() === filter),
    [pickups, filter]
  );

  const totalKgRecycled = useMemo(
    () =>
      pickups
        .filter((p) => p.status?.toLowerCase() === "completed")
        .reduce((sum, p) => sum + getPickupWeightKg(p), 0),
    [pickups]
  );

  const totalCoins = useMemo(
    () =>
      pickups
        .filter((p) => p.status?.toLowerCase() === "completed")
        .reduce((sum, p) => sum + (p.ecoCoins ?? p.rewardCoins ?? 0), 0),
    [pickups]
  );

  if (loading) return <Loader text="Loading history..." />;

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="bg-white rounded-2xl p-5 sm:p-8 border border-gray-100 shadow-sm">
        <div className="border-2 border-dashed border-red-100 rounded-2xl py-14 text-center">
          <span className="text-4xl">⚠️</span>
          <p className="mt-4 text-base font-semibold text-red-500">{error}</p>
          <button
            onClick={fetchHistory}
            className="mt-4 px-5 py-2 bg-green-600 text-white text-sm font-medium rounded-xl hover:bg-green-500 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-8 border border-gray-100 shadow-sm">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Pickup History
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          All your completed and cancelled pickup requests
        </p>
      </div>

      {/* Summary stats — only if there's completed data */}
      {counts.completed > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-green-400">
              Total Recycled
            </p>
            <p className="text-2xl font-extrabold text-green-700 mt-0.5">
              {totalKgRecycled}{" "}
              <span className="text-sm font-semibold">kg</span>
            </p>
          </div>
          <div className="bg-yellow-50 border border-yellow-100 rounded-xl px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-500">
              EcoCoins Earned
            </p>
            <p className="text-2xl font-extrabold text-yellow-600 mt-0.5">
              🪙 {totalCoins}
            </p>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 col-span-2 sm:col-span-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400">
              CO₂ Saved
            </p>
            <p className="text-2xl font-extrabold text-blue-600 mt-0.5">
              ~{Math.round(totalKgRecycled * 0.5)}{" "}
              <span className="text-sm font-semibold">kg</span>
            </p>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      {pickups.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <FilterTab
            label="All"
            active={filter === "all"}
            count={counts.all}
            onClick={() => setFilter("all")}
          />
          <FilterTab
            label="✅ Completed"
            active={filter === "completed"}
            count={counts.completed}
            onClick={() => setFilter("completed")}
          />
          <FilterTab
            label="❌ Cancelled"
            active={filter === "cancelled"}
            count={counts.cancelled}
            onClick={() => setFilter("cancelled")}
          />
        </div>
      )}

      {/* Empty state */}
      {displayed.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-2xl py-14 text-center">
          <span className="text-4xl">📋</span>
          <p className="mt-4 text-base font-semibold text-gray-500">
            No history yet
          </p>
          <p className="text-sm text-gray-300 mt-1">
            {filter === "all"
              ? "Completed or cancelled pickups will appear here."
              : `No ${filter} pickups found.`}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {displayed.map((pickup) => (
              <HistoryCard 
                key={pickup._id} 
                pickup={pickup} 
                onViewDetails={(id) => navigate(`/pickups/${id}`)}
              />
            ))}
          </div>
          
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            total={total}
            count={count}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
};

export default PickupHistory;
