import { useEffect, useState, useMemo } from "react";
import { ClipboardList, CheckCircle, Clock, Trophy, Star, Award } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext.jsx";
import { useTranslation } from "../../i18n/config.js";
import axiosInstance from "../../api/axiosInstance";

const CollectorDashboard = () => {
  const { t } = useTranslation();
  const { user, refreshUser } = useAuthContext();
  const [stats, setStats] = useState({ pending: 0, assigned: 0, completedToday: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchStats = async () => {
      try {
        const [pendingRes, assignedRes, completedRes] = await Promise.all([
          axiosInstance.get("/pickups/pending"),
          axiosInstance.get("/pickups/assigned"),
          axiosInstance.get("/pickups/completed"),
        ]);

        if (cancelled) return;

        const pendingData = pendingRes.data;
        const assignedData = assignedRes.data;
        const completedData = completedRes.data;

        // FIX: Better timezone-safe "today" filtering
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

        const completedToday = (completedData.pickups || []).filter((p) => {
          if (!p.completedAt) return false;
          const completedDate = new Date(p.completedAt);
          return completedDate >= todayStart && completedDate <= todayEnd;
        }).length;

        // DEBUG: Log for troubleshooting (remove after confirming it works)
        console.log("Dashboard Stats Debug:", {
          todayRange: `${todayStart.toISOString()} to ${todayEnd.toISOString()}`,
          totalCompleted: (completedData.pickups || []).length,
          completedToday,
          sampleCompletedAt: completedData.pickups?.[0]?.completedAt,
        });

        setStats({
          pending: Array.isArray(pendingData) ? pendingData.length : (pendingData?.total ?? pendingData?.count ?? 0),
          assigned: (assignedData.total ?? (assignedData.pickups || []).length),
          completedToday,
        });
      } catch (err) {
        console.error("Failed to load dashboard stats", err);
        console.error("Error details:", {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchStats();
    refreshUser(); // Update badges/stats in real-time
    return () => { cancelled = true; };
  }, []);

  // Rebuilt when language changes — t() is reactive
  const statCards = useMemo(() => [
    { icon: <Clock className="text-yellow-600 shrink-0" />, label: t("dashboard.pendingRequests"),  value: stats.pending },
    { icon: <ClipboardList className="text-blue-600 shrink-0" />, label: t("dashboard.acceptedPickups"), value: stats.assigned },
    { icon: <CheckCircle className="text-green-600 shrink-0" />, label: t("dashboard.completedToday"),   value: stats.completedToday },
  ], [t, stats]);

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">{t("dashboard.title")}</h1>
        <p className="text-sm text-gray-500">{t("dashboard.subtitle")}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {statCards.map(({ icon, label, value }) => (
          <div key={label} className="bg-white rounded-xl p-5 shadow-sm border">
            <div className="flex items-center gap-3">
              {icon}
              <span className="text-sm text-gray-600">{label}</span>
            </div>
            <p className="text-3xl font-bold text-gray-800 mt-3">
              {loading ? "…" : value}
            </p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="bg-white rounded-xl shadow-sm border p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-gray-800">{t("dashboard.pickupRequests")}</h2>
          <p className="text-sm text-gray-500">{t("dashboard.pickupRequestsDesc")}</p>
        </div>
        <Link
          to="/collector/requests"
          className="inline-flex items-center justify-center px-5 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-500 transition text-sm shrink-0"
        >
          {t("dashboard.viewRequests")}
        </Link>
      </div>

      {/* Badges & Achievements Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Trophy className="text-yellow-600 w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">Your Achievements</h2>
              <p className="text-xs text-gray-500">Track your progress and badges</p>
            </div>
          </div>
          <div className="flex gap-4 text-right">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Total Pickups</p>
              <p className="text-xl font-bold text-gray-800">{user?.totalPickups || 0}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Best Day</p>
              <p className="text-xl font-bold text-green-600">{user?.bestDayRecord || 0}</p>
            </div>
          </div>
        </div>

        {/* Badges list */}
        <div className="flex flex-wrap gap-4">
          {!user?.badges || user.badges.length === 0 ? (
            <div className="w-full py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <Award className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400 font-medium italic">
                Complete more pickups to earn your first badge!
              </p>
            </div>
          ) : (
            user.badges.map((badge, index) => (
              <div 
                key={index} 
                className="group relative flex flex-col items-center gap-2 p-3 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl border border-yellow-200 hover:border-orange-300 transition-all shadow-sm hover:shadow-md"
              >
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                  <Star className="text-yellow-600 fill-yellow-600 w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-orange-800 text-center whitespace-nowrap">
                  {badge}
                </span>
                
                {/* Micro-glow effect */}
                <div className="absolute -inset-1 bg-yellow-400/10 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Tip */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 sm:p-5">
        <p className="text-sm text-blue-700">{t("dashboard.tip")}</p>
      </div>
    </div>
  );
};

export default CollectorDashboard;