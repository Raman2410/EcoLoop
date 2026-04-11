import { memo } from "react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "../../../i18n/config.js";
import {
  LayoutDashboard,
  Truck,
  ClipboardList,
  CheckCircle,
  Settings,
  Power,
} from "lucide-react";

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
    isActive
      ? "bg-green-600 text-white shadow"
      : "text-gray-700 hover:bg-green-50"
  }`;

const CollectorSidebar = memo(({ onLinkClick }) => {
  const { t } = useTranslation();
  const sectionTitle = "px-4 pt-4 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide";

  return (
    <aside className="w-64 h-full bg-white border-r p-3">
      <div className="space-y-1">
        <NavLink to="/collector/dashboard" className={linkClass} onClick={onLinkClick}>
          <LayoutDashboard className="w-4 h-4 shrink-0" />
          <span>{t("sidebar.dashboard")}</span>
        </NavLink>
      </div>

      <p className={sectionTitle}>{t("sidebar.pickups")}</p>
      <div className="space-y-1">
        <NavLink to="/collector/requests" className={linkClass} onClick={onLinkClick}>
          <ClipboardList className="w-4 h-4 shrink-0" />
          <span>{t("sidebar.newRequests")}</span>
        </NavLink>

        <NavLink to="/collector/assigned" className={linkClass} onClick={onLinkClick}>
          <Truck className="w-4 h-4 shrink-0" />
          <span>{t("sidebar.assignedPickups")}</span>
        </NavLink>

        <NavLink to="/collector/completed" className={linkClass} onClick={onLinkClick}>
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{t("sidebar.completed")}</span>
        </NavLink>
      </div>

      <p className={sectionTitle}>Settings</p>
      <div className="space-y-1">
        <NavLink to="/collector/availability" className={linkClass} onClick={onLinkClick}>
          <Power className="w-4 h-4 shrink-0" />
          <span>{t("nav.availability")}</span>
        </NavLink>
        <NavLink to="/collector/profile" className={linkClass} onClick={onLinkClick}>
          <Settings className="w-4 h-4 shrink-0" />
          <span>{t("nav.profileSettings")}</span>
        </NavLink>
      </div>

      {/* <p className={sectionTitle}>{t("sidebar.tools")}</p>
      <div className="space-y-1">
        <NavLink to="/ai-decision" className={linkClass} onClick={onLinkClick}>
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>{t("sidebar.aiAssistant")}</span>
        </NavLink>
      </div> */}
    </aside>
  );
});

CollectorSidebar.displayName = "CollectorSidebar";
export default CollectorSidebar;
