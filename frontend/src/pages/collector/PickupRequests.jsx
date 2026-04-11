import { memo, useEffect, useState, useCallback, useRef } from "react";
import { MapPin, Package, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../i18n/config.js";
import {
  getPendingPickups,
  acceptPickup,
} from "../../services/collector.service";
import Loader from "../../components/common/Loader";
import Pagination from "../../components/common/Pagination";
import toast from "react-hot-toast";
import { useSocket } from "../../context/SocketContext";

// ── Pickup Card ────────────────────────────────────────────────────────────────

const PickupRequestCard = memo(
  ({ pickup, onAccept, accepting, onViewDetails, isNew }) => {
    const { t } = useTranslation();

    return (
      <div
        className={`bg-white border rounded-xl p-4 sm:p-5 flex flex-col gap-4 transition-all duration-500 ${
          isNew
            ? "border-green-400 shadow-md shadow-green-100 animate-pulse-once"
            : "border-gray-200"
        }`}
      >
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-800 capitalize">
                {pickup.scrapType}
              </h3>
              {isNew && (
                <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                  <Bell size={9} />
                  New
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 capitalize">
              {pickup.approxLoad} load
            </p>
          </div>
          <span className="px-3 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700 font-medium shrink-0">
            {t("requests.pending")}
          </span>
        </div>

        {pickup.userId && (
          <div className="text-sm text-gray-600">
            <span className="font-medium">{pickup.userId.name}</span>
            {pickup.userId.phone && (
              <span className="ml-2 text-gray-400">· {pickup.userId.phone}</span>
            )}
          </div>
        )}

        <div className="flex items-start gap-2 text-sm text-gray-600">
          <MapPin size={16} className="shrink-0 mt-0.5" />
          <span>{pickup.address || pickup.userId?.address || "—"}</span>
        </div>

        {pickup.image && (
          <div className="rounded-xl overflow-hidden border border-gray-100 h-24 w-full bg-gray-50">
            <img
              src={pickup.image}
              alt="Scrap Preview"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}

        {pickup.scheduledDate && (
          <p className="text-sm text-gray-500">
            {t("requests.scheduled", {
              date: new Date(pickup.scheduledDate).toLocaleDateString(),
            })}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-3 border-t">
          <button
            onClick={() => onViewDetails(pickup)}
            className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            {t("requests.viewDetails")}
          </button>
          <button
            onClick={() => onAccept(pickup._id)}
            disabled={accepting === pickup._id}
            className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 disabled:opacity-50 text-sm font-medium transition-colors"
          >
            {accepting === pickup._id
              ? t("requests.accepting")
              : t("requests.acceptPickup")}
          </button>
        </div>
      </div>
    );
  }
);
PickupRequestCard.displayName = "PickupRequestCard";

// ── New Pickup Banner ──────────────────────────────────────────────────────────

const NewPickupBanner = ({ count, onRefresh }) => (
  <button
    onClick={onRefresh}
    className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 active:scale-[0.99] text-white text-sm font-semibold py-3 px-5 rounded-xl transition-all duration-150 shadow-sm"
  >
    <Bell size={15} />
    {count === 1
      ? "1 new pickup request arrived — tap to refresh"
      : `${count} new pickup requests arrived — tap to refresh`}
  </button>
);

// ── Main Component ─────────────────────────────────────────────────────────────

const PickupRequests = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { subscribeToNewPickup, connected } = useSocket();

  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(null);
  const [error, setError] = useState(null);
  const [infoMessage, setInfoMessage] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [count, setCount] = useState(0);

  // IDs of pickups that just arrived via socket (for "New" badge highlight)
  const [newPickupIds, setNewPickupIds] = useState(new Set());

  // Count of socket-triggered new pickups waiting for a manual refresh
  const [pendingNewCount, setPendingNewCount] = useState(0);

  // Ref to avoid stale-closure issues inside socket callback
  const fetchingRef = useRef(false);

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchRequests = useCallback(async (page = 1, silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    setInfoMessage(null);
    fetchingRef.current = true;
    try {
      const data = await getPendingPickups(page);
      const list = Array.isArray(data) ? data : data?.pickups ?? [];
      setPickups(list);
      setCurrentPage(data?.page || 1);
      setTotalPages(data?.totalPages || 1);
      setTotal(data?.total || 0);
      setCount(data?.count || 0);
      setPendingNewCount(0); // clear the banner after refresh

      if (list.length === 0 && data?.message) {
        setInfoMessage(data.message);
      }
    } catch (err) {
      console.error("Error fetching pickups:", err);
      const msg =
        err.response?.data?.message ||
        "Could not load pickup requests. Please try again.";
      if (!silent) setError(msg);
    } finally {
      if (!silent) setLoading(false);
      fetchingRef.current = false;
    }
  }, []);

  // Page change handler
  const handlePageChange = useCallback((newPage) => {
    setCurrentPage(newPage);
    fetchRequests(newPage);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [fetchRequests]);

  // Initial load
  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // ── Socket: subscribe to new-pickup events ────────────────────────────────
  useEffect(() => {
    const unsubscribe = subscribeToNewPickup((payload) => {
      console.log("[PickupRequests] new-pickup received:", payload);

      // Increment the banner counter
      setPendingNewCount((n) => n + 1);

      // Auto-fetch silently from page 1 and highlight the new card
      getPendingPickups(1)
        .then((data) => {
          const list = Array.isArray(data) ? data : data?.pickups ?? [];
          setPickups(list);
          setCurrentPage(1); // Reset to page 1
          setTotalPages(data?.totalPages || 1);
          setTotal(data?.total || 0);
          setCount(data?.count || 0);
          setPendingNewCount(0);

          // Mark the new pickup for highlight (using pickupId from socket)
          if (payload.pickupId) {
            setNewPickupIds((prev) => {
              const next = new Set(prev);
              next.add(String(payload.pickupId));
              return next;
            });
            // Remove highlight after 8 seconds
            setTimeout(() => {
              setNewPickupIds((prev) => {
                const next = new Set(prev);
                next.delete(String(payload.pickupId));
                return next;
              });
            }, 8000);
          }
        })
        .catch((err) => {
          console.error("[PickupRequests] silent re-fetch failed:", err.message);
          // Fall back to banner so the user can manually refresh
          setPendingNewCount((n) => n + 1);
        });
    });

    return unsubscribe;
  }, [subscribeToNewPickup]);

  // ── Accept ────────────────────────────────────────────────────────────────
  const handleAccept = useCallback(
    async (pickupId) => {
      setAccepting(pickupId);
      try {
        await acceptPickup(pickupId);
        toast.success(t("requests.toastAccepted"));
        setPickups((prev) => prev.filter((p) => p._id !== pickupId));
        navigate("/collector/assigned");
      } catch (error) {
        toast.error(
          error.response?.data?.message || t("requests.toastAcceptFailed")
        );
      } finally {
        setAccepting(null);
      }
    },
    [navigate, t]
  );

  const handleViewDetails = useCallback(
    (pickup) => {
      navigate(`/collector/requests/${pickup._id}`, { state: pickup });
    },
    [navigate]
  );

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) return <Loader text={t("requests.loadingRequests")} />;

  if (error) {
    return (
      <div className="space-y-5 sm:space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            {t("requests.title")}
          </h1>
          <p className="text-sm text-gray-500">{t("requests.subtitle")}</p>
        </div>
        <div className="bg-white border rounded-xl p-10 text-center">
          <span className="text-4xl">⚠️</span>
          <p className="mt-4 font-medium text-red-500">{error}</p>
          <button
            onClick={() => fetchRequests()}
            className="mt-4 px-5 py-2 bg-green-600 text-white text-sm font-medium rounded-xl hover:bg-green-500 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            {t("requests.title")}
          </h1>
          <p className="text-sm text-gray-500">{t("requests.subtitle")}</p>
        </div>
        {/* Live indicator */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1">
          <span
            className={`w-2 h-2 rounded-full ${
              connected ? "bg-green-500 animate-pulse" : "bg-gray-300"
            }`}
          />
          {connected ? "Live" : "Offline"}
        </div>
      </div>

      {/* New pickup banner (fallback if silent re-fetch fails) */}
      {pendingNewCount > 0 && (
        <NewPickupBanner
          count={pendingNewCount}
          onRefresh={() => fetchRequests()}
        />
      )}

      {/* List */}
      {pickups.length === 0 ? (
        <div className="bg-white border rounded-xl p-10 text-center text-gray-500">
          <Package className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">
            {infoMessage || t("requests.noRequests")}
          </p>
          {!infoMessage && (
            <p className="text-sm mt-1">{t("requests.noRequestsHint")}</p>
          )}
          {infoMessage && (
            <p className="text-sm mt-2 text-amber-600">
              Please contact an admin to update your service areas.
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {pickups.map((pickup) => (
              <PickupRequestCard
                key={pickup._id}
                pickup={pickup}
                onAccept={handleAccept}
                accepting={accepting}
                onViewDetails={handleViewDetails}
                isNew={newPickupIds.has(String(pickup._id))}
              />
            ))}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            total={total}
            count={count}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
};

export default PickupRequests;