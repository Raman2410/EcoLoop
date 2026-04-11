import { useEffect, useState, useCallback, useMemo } from "react";
import { useTranslation } from "../../i18n/config.js";
import axiosInstance from "../../api/axiosInstance";
import Loader from "../../components/common/Loader";
import toast from "react-hot-toast";
import { Trash2 } from "lucide-react";

const TABS = [
  { key: "active",   label: "Completed" },
  { key: "history",  label: "History"   },
];

const CompletedPickups = () => {
  const { t } = useTranslation();
  const [activePickups, setActivePickups] = useState([]);    // Non-archived completed pickups
  const [historyPickups, setHistoryPickups] = useState([]);  // Archived pickups
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [tab, setTab] = useState("active");

  // Load both active and history pickups
  useEffect(() => {
    let cancelled = false;
    
    const loadPickups = async () => {
      try {
        // Fetch active (non-archived) completed pickups
        const activeRes = await axiosInstance.get("/pickups/completed");
        if (!cancelled) setActivePickups(activeRes.data?.pickups || []);

        // Fetch archived (history) pickups
        const historyRes = await axiosInstance.get("/pickups/archived");
        if (!cancelled) setHistoryPickups(historyRes.data?.pickups || []);
      } catch (err) {
        console.error("Failed to load pickups", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadPickups();
    return () => { cancelled = true; };
  }, []);

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm("Move this pickup to History? You can still view it in the History tab.")) return;
    
    setDeleting(id);
    try {
      await axiosInstance.delete(`/pickups/completed/${id}`);
      
      // Move pickup from active to history in local state
      const pickup = activePickups.find(p => p._id === id);
      if (pickup) {
        setActivePickups(prev => prev.filter(p => p._id !== id));
        setHistoryPickups(prev => [pickup, ...prev]);
      }
      
      toast.success("Moved to history");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to archive pickup");
    } finally {
      setDeleting(null);
    }
  }, [activePickups]);

  const shown = tab === "active" ? activePickups : historyPickups;

  if (loading) return <Loader text={t("completed.loadingCompleted")} />;

  const renderTable = (list, showDelete) => (
    <>
      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              {[
                t("completed.user"),
                t("completed.address"),
                t("completed.scrapType"),
                t("completed.load"),
                t("completed.ecoCoins"),
                t("completed.completedOn"),
                t("completed.status"),
                ...(showDelete ? ["Action"] : []),
              ].map((h) => (
                <th key={h} className="text-left px-4 py-3 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.map((pickup) => (
              <tr key={pickup._id} className="border-t hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium">{pickup.userId?.name}</div>
                  <div className="text-xs text-gray-500">{pickup.userId?.phone}</div>
                </td>
                <td className="px-4 py-3 text-gray-600 max-w-[180px] truncate">
                  {pickup.address || pickup.userId?.address || "—"}
                </td>
                <td className="px-4 py-3 capitalize">{pickup.scrapType}</td>
                <td className="px-4 py-3 capitalize">{pickup.approxLoad}</td>
                <td className="px-4 py-3 text-emerald-600 font-semibold">
                  {pickup.ecoCoins || pickup.rewardCoins || "—"}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {pickup.completedAt ? new Date(pickup.completedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                    {t("completed.completedBadge")}
                  </span>
                </td>
                {showDelete && (
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(pickup._id)}
                      disabled={deleting === pickup._id}
                      title="Move to History"
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-40"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-4">
        {list.map((pickup) => (
          <div key={pickup._id} className="bg-white rounded-xl shadow-sm border p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-gray-800">{pickup.userId?.name}</p>
                <p className="text-xs text-gray-500">{pickup.userId?.phone}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                  {t("completed.completedBadge")}
                </span>
                {showDelete && (
                  <button
                    onClick={() => handleDelete(pickup._id)}
                    disabled={deleting === pickup._id}
                    className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-40"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-600 truncate">📍 {pickup.address || pickup.userId?.address || "—"}</p>
            <div className="flex flex-wrap gap-3 text-sm text-gray-600">
              <span>⚖️ <span className="capitalize">{pickup.approxLoad}</span></span>
              <span>♻️ <span className="capitalize">{pickup.scrapType}</span></span>
              <span className="text-emerald-600 font-medium">
                🪙 {pickup.ecoCoins || pickup.rewardCoins || "—"} {t("completed.coinsLabel")}
              </span>
            </div>
            {pickup.completedAt && (
              <p className="text-xs text-gray-400">
                ✅ {new Date(pickup.completedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
              </p>
            )}
          </div>
        ))}
      </div>
    </>
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold mb-1">{t("completed.title")}</h1>
        <p className="text-gray-500 text-sm">{t("completed.subtitle")}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {TABS.map(({ key, label }) => {
          const count = key === "active" ? activePickups.length : historyPickups.length;
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 ${
                tab === key
                  ? "bg-green-600 text-white shadow-sm"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                tab === key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {shown.length === 0 ? (
        <div className="bg-white p-10 rounded-xl shadow-sm text-gray-400 text-center">
          {tab === "active" ? t("completed.noCompleted") : "No history yet. Archive completed pickups to see them here."}
        </div>
      ) : (
        renderTable(shown, tab === "active")
      )}
    </div>
  );
};

export default CompletedPickups;