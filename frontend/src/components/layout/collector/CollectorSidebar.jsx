import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Truck,
  ClipboardList,
  CheckCircle,
} from "lucide-react";

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
    isActive
      ? "bg-green-600 text-white shadow"
      : "text-gray-700 hover:bg-green-50"
  }`;

const sectionTitle =
  "px-4 pt-4 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide";

const CollectorSidebar = () => {
  return (
    <aside className="w-64 bg-white border-r min-h-[calc(100vh-64px)] p-3">

      {/* OVERVIEW */}
      <div className="space-y-1">
        <NavLink to="/collector/dashboard" className={linkClass}>
          <LayoutDashboard className="w-4 h-4" />
          <span>Dashboard</span>
        </NavLink>
      </div>

      {/* PICKUPS */}
      <p className={sectionTitle}>Pickups</p>
      <div className="space-y-1">
        <NavLink to="/collector/requests" className={linkClass}>
          <ClipboardList className="w-4 h-4" />
          <span>New Requests</span>
        </NavLink>

        <NavLink to="/collector/assigned" className={linkClass}>
          <Truck className="w-4 h-4" />
          <span>Assigned Pickups</span>
        </NavLink>

        <NavLink to="/collector/completed" className={linkClass}>
          <CheckCircle className="w-4 h-4" />
          <span>Completed</span>
        </NavLink>
      </div>

    </aside>
  );
};

export default CollectorSidebar;