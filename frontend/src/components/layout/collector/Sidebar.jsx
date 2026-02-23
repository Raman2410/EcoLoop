import { NavLink } from "react-router-dom";

const linkClass = ({ isActive }) =>
  `block px-4 py-2 rounded-md text-sm transition ${
    isActive
      ? "bg-green-600 text-white"
      : "text-gray-700 hover:bg-green-100"
  }`;

const Sidebar = () => {
  return (
    <div className="w-60 bg-gray-50 border-r p-4 space-y-2">
      
      <NavLink to="/dashboard" className={linkClass}>
        Dashboard
      </NavLink>

      {/* EXACT match only */}
      <NavLink to="/pickups" end className={linkClass}>
        My Pickups
      </NavLink>

      <NavLink to="/pickups/create" className={linkClass}>
        Create Pickup
      </NavLink>

      <NavLink to="/wallet" className={linkClass}>
        Wallet
      </NavLink>
    </div>
  );
};

export default Sidebar;
