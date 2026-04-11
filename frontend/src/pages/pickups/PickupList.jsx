import { useEffect, useState, useMemo, memo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getMyPickups, cancelPickup } from "../../services/pickup.service";
import Loader from "../../components/common/Loader";
import toast from "react-hot-toast";
import { getPickupWeightKg } from "../../utils/pickupWeight";
import PickupMap from "../../components/common/PickupMap";
import { useSocket } from "../../context/SocketContext";
import Pagination from "../../components/common/Pagination";

const SCRAP_ICONS = {
  metal: "🔩",
  plastic: "🧴",
  paper: "📄",
  glass: "🫙",
  ewaste: "💻",
  "e-waste": "💻",
  cardboard: "📦",
  rubber: "🔄",
  other: "♻",
};
const getIcon = (type = "") => SCRAP_ICONS[type.toLowerCase()] ?? "♻";

const STATUS_MAP = {
  completed: {
    bg: "bg-green-100",
    text: "text-green-700",
    dot: "bg-green-500",
    label: "Completed",
  },
  pending: {
    bg: "bg-yellow-100",
    text: "text-yellow-700",
    dot: "bg-yellow-500",
    label: "Pending",
  },
  assigned: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    dot: "bg-blue-500",
    label: "Assigned",
  },
  in_progress: {
    bg: "bg-purple-100",
    text: "text-purple-700",
    dot: "bg-purple-500",
    label: "In Progress",
  },
  cancelled: {
    bg: "bg-red-100",
    text: "text-red-600",
    dot: "bg-red-400",
    label: "Cancelled",
  },
};
const getStatus = (s = "") =>
  STATUS_MAP[s.toLowerCase()] ?? {
    bg: "bg-gray-100",
    text: "text-gray-600",
    dot: "bg-gray-400",
    label: s,
  };

// ── Impact tile ──────────────────────────────────────────────────────────────
const ImpactTile = memo(({ type, kg }) => (
  <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex flex-col gap-1.5">
    <span className="text-2xl">{getIcon(type)}</span>
    <p className="text-[11px] font-bold uppercase tracking-widest text-green-400">
      {type}
    </p>
    <p className="text-2xl font-extrabold text-green-700 tracking-tight">
      {kg}
      <span className="text-sm font-semibold text-green-400 ml-1">kg</span>
    </p>
  </div>
));
ImpactTile.displayName = "ImpactTile";

// ── Single pickup card ───────────────────────────────────────────────────────
const PickupCard = memo(
  ({ pickup, onDelete, onViewDetails, collectorCoords }) => {
    const st = getStatus(pickup.status);
    const isPending = pickup.status?.toLowerCase() === "pending";
    const isActive = ["assigned", "in_progress"].includes(
      pickup.status?.toLowerCase(),
    );
    const isInProgress = pickup.status?.toLowerCase() === "in_progress";

    return (
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
        {/* Status accent strip */}
        <div className={`h-1 ${st.dot}`} />

        <div className="p-5 flex-1 flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
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
          <div className="flex flex-col gap-2 mb-4 text-sm">
            <div className="flex gap-2 items-start">
              <span className="shrink-0 mt-0.5">📍</span>
              <p className="text-gray-600">
                <span className="font-semibold text-gray-800">Address:</span>{" "}
                {pickup.address}
              </p>
            </div>
            <div className="flex gap-2 items-start">
              <span className="shrink-0">⚖️</span>
              <p className="text-gray-600">
                <span className="font-semibold text-gray-800">Load:</span>{" "}
                {pickup.approxLoad}
              </p>
            </div>
            <div className="flex gap-2 items-start">
              <span className="shrink-0">🗓</span>
              <p className="text-gray-600">
                <span className="font-semibold text-gray-800">Scheduled:</span>{" "}
                {new Date(pickup.scheduledDate).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Live map — shown for assigned / in_progress pickups */}
          {isActive && (
            <div className="mb-4">
              {isInProgress && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <p className="text-xs font-semibold text-green-700">
                    {collectorCoords
                      ? "Collector is on the way"
                      : "Collector heading to you"}
                  </p>
                </div>
              )}
              <PickupMap
                address={pickup.address}
                collectorCoords={collectorCoords}
                height="180px"
              />
            </div>
          )}

          {/* Footer */}
          <div className="mt-auto pt-3 border-t border-gray-100 flex justify-between items-center">
            <button
              onClick={() => onViewDetails(pickup._id)}
              className="text-xs font-semibold text-green-600 hover:bg-green-50 px-3 py-1.5 rounded-md transition-colors border border-green-200"
            >
              View Details
            </button>
            {isPending && (
              <button
                onClick={() => onDelete(pickup._id)}
                className="text-xs font-semibold text-red-500 hover:bg-red-50 px-2 py-1 rounded-md transition-colors"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    );
  },
);
PickupCard.displayName = "PickupCard";

// ── Main ─────────────────────────────────────────────────────────────────────
const PickupList = () => {
  const navigate = useNavigate();
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Map: pickupId → [lat, lng] — updated via socket as collector moves
  const [collectorPositions, setCollectorPositions] = useState({});
  const { socketRef, connected } = useSocket();
  const socket = socketRef.current;

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [count, setCount] = useState(0);

  // Listen for live collector location updates
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !connected) return;
    const handler = ({ pickupId, lat, lng }) => {
      setCollectorPositions((prev) => ({ ...prev, [pickupId]: [lat, lng] }));
    };
    socket.on("collector-location", handler);
    return () => socket.off("collector-location", handler);
  }, [connected]);

  // Real-time: collector accepted → update card status instantly
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !connected) return;
    const handler = ({ pickupId, collectorName }) => {
      setPickups((prev) =>
        prev.map((p) =>
          p._id === pickupId ? { ...p, status: "assigned", collectorName } : p,
        ),
      );
      toast.success(`${collectorName} accepted your pickup! 🚴`, {
        duration: 5000,
      });
    };
    socket.on("pickup-accepted", handler);
    return () => socket.off("pickup-accepted", handler);
  }, [connected]);

  // Real-time: OTP generated → update card status to in_progress
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !connected) return;
    const handler = ({ pickupId }) => {
      setPickups((prev) =>
        prev.map((p) =>
          p._id === pickupId ? { ...p, status: "in_progress" } : p,
        ),
      );
    };
    socket.on("otp-generated", handler);
    return () => socket.off("otp-generated", handler);
  }, [connected]);

  // Real-time: pickup completed → update card status instantly
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !connected) return;
    const handler = ({ pickupId, ecoCoinsEarned, weightKg }) => {
      setPickups((prev) =>
        prev.map((p) =>
          p._id === pickupId
            ? {
                ...p,
                status: "completed",
                actualWeight: weightKg,
                ecoCoins: ecoCoinsEarned,
              }
            : p,
        ),
      );
      toast.success(
        `Pickup complete! +${ecoCoinsEarned} EcoCoins for ${weightKg}kg recycled ♻️`,
        { duration: 6000 },
      );
    };
    socket.on("pickup-completed", handler);
    return () => socket.off("pickup-completed", handler);
  }, [connected]);

  const fetchPickups = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyPickups(page, 10, "active");
      const list = Array.isArray(data) ? data : data?.pickups || [];
      setPickups(list);
      setCurrentPage(data?.page || 1);
      setTotalPages(data?.totalPages || 1);
      setTotal(data?.total || 0);
      setCount(data?.count || 0);
    } catch (err) {
      console.error("Failed to load pickups", err);
      // 401 is handled globally (auto-logout). Surface all other errors.
      const msg =
        err.response?.data?.message ||
        "Could not load your pickups. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePageChange = useCallback(
    (newPage) => {
      setCurrentPage(newPage);
      fetchPickups(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [fetchPickups],
  );

  useEffect(() => {
    fetchPickups();
  }, [fetchPickups]);

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm("Are you sure you want to cancel this pickup request?"))
      return;
    try {
      await cancelPickup(id);
      setPickups((prev) =>
        prev.map((p) => (p._id === id ? { ...p, status: "cancelled" } : p)),
      );
      toast.success("Pickup cancelled successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to cancel pickup");
    }
  }, []);

  if (loading) return <Loader text="Loading pickups..." />;

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="bg-white rounded-2xl p-5 sm:p-8 border border-gray-100 shadow-sm">
        <div className="border-2 border-dashed border-red-100 rounded-2xl py-14 text-center">
          <span className="text-4xl">⚠️</span>
          <p className="mt-4 text-base font-semibold text-red-500">{error}</p>
          <button
            onClick={fetchPickups}
            className="mt-4 px-5 py-2 bg-green-600 text-white text-sm font-medium rounded-xl hover:bg-green-500 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Only show active pickups — completed and cancelled are in History
  const activePickups = pickups.filter(
    (p) => !["completed", "cancelled"].includes(p.status?.toLowerCase()),
  );

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-8 border border-gray-100 shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            My Pickups
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            View and manage all your active pickup requests
          </p>
        </div>
      </div>

      {/* Empty state */}
      {activePickups.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-2xl py-14 text-center">
          <span className="text-4xl">🚚</span>
          <p className="mt-4 text-base font-semibold text-gray-500">
            No active pickups
          </p>
          <p className="text-sm text-gray-300 mt-1">
            Schedule a pickup to start recycling.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {activePickups.map((pickup) => (
              <PickupCard
                key={pickup._id}
                pickup={pickup}
                onDelete={handleDelete}
                onViewDetails={(id) => navigate(`/pickups/${id}`)}
                collectorCoords={collectorPositions[pickup._id] ?? null}
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

export default PickupList;
