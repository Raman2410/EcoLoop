import { memo } from "react";
import { Link, useLocation } from "react-router-dom";

const LOAD_TO_KG = { small: 5, medium: 10, large: 20, bulk: 40 };

const BottomPanel = memo(({ pickups = [] }) => {
  const { pathname } = useLocation();

  const totalKgRecycled = pickups
    .filter((p) => p.status?.toLowerCase() === "completed")
    .reduce((sum, p) => sum + (LOAD_TO_KG[p.approxLoad] || 0), 0);

  let title = "Keep Making an Impact 🌱";
  let description = totalKgRecycled > 0
    ? `So far, you've helped recycle approximately ${totalKgRecycled} kg of scrap.`
    : "Complete your first pickup to start making an environmental impact.";
  let actionText = "Schedule Pickup";
  let actionLink = "/pickups/create";

  if (pathname.startsWith("/pickups")) {
    title = "Manage Your Pickups 🚚";
    description = totalKgRecycled > 0
      ? `Your completed pickups have recycled about ${totalKgRecycled} kg of scrap.`
      : "Track and complete pickups to build your eco impact.";
    actionText = "View Wallet";
    actionLink = "/wallet";
  }

  if (pathname.startsWith("/wallet")) {
    title = "Earn More EcoCoins 💰";
    description = totalKgRecycled > 0
      ? `Your recycling efforts have already made an impact of ${totalKgRecycled} kg.`
      : "Complete pickups to earn EcoCoins and grow your impact.";
    actionText = "Create Pickup";
    actionLink = "/pickups/create";
  }

  return (
    <div className="mt-10 sm:mt-14 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-gray-800">{title}</h3>
        <p className="text-sm text-gray-600 mt-1 max-w-xl">{description}</p>
      </div>
      <Link
        to={actionLink}
        className="inline-flex items-center justify-center px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors text-sm font-medium shrink-0 w-full sm:w-auto"
      >
        {actionText}
      </Link>
    </div>
  );
});

BottomPanel.displayName = "BottomPanel";
export default BottomPanel;
