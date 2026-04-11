import { memo } from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, Package, PlusCircle, Wallet, Sparkles, History } from "lucide-react";

const linkClass = ({ isActive }) =>
  `block px-4 py-2.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
    isActive
      ? "bg-green-600 text-white"
      : "text-gray-700 hover:bg-green-100"
  }`;

// User sidebar — accepts onLinkClick to close mobile drawer
const Sidebar = memo(({ onLinkClick }) => {
  return (
    <div className="w-60 h-full bg-gray-50 border-r p-4 space-y-1">
      <NavLink to="/dashboard" className={linkClass} onClick={onLinkClick}>
        <LayoutDashboard size={16} />
        Dashboard
      </NavLink>

      <NavLink to="/pickups" end className={linkClass} onClick={onLinkClick}>
        <Package size={16} />
        My Pickups
      </NavLink>

      <NavLink to="/pickups/create" className={linkClass} onClick={onLinkClick}>
        <PlusCircle size={16} />
        Create Pickup
      </NavLink>

      <NavLink to="/pickups/history" className={linkClass} onClick={onLinkClick}>
        <History size={16} />
        History
      </NavLink>

      <NavLink to="/wallet" className={linkClass} onClick={onLinkClick}>
        <Wallet size={16} />
        Wallet
      </NavLink>

      {/* AI Decision Engine */}
      <NavLink to="/ai-decision" className={linkClass} onClick={onLinkClick}>
        <Sparkles size={16} />
        AI Assistant
      </NavLink>
    </div>
  );
});

Sidebar.displayName = "Sidebar";
export default Sidebar;