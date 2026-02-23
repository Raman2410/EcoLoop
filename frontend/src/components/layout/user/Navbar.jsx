import { useNavigate, Link } from "react-router-dom";
import { useAuthContext } from "../../../context/AuthContext";
import { useState, useRef, useEffect } from "react";

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthContext();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className=" bg-green-600/95 text-white px-6 py-4 flex justify-between items-center shadow-md shadow-black/10">
      {/* App Name */}
      <div className="flex items-center gap-2">
          <img src="/LogoE.png"  alt="EcoLoop logo"  className="w-6 h-6 rounded-full bg-white/90 p-[2px]"/>
          <h1 className="text-xl font-semibold tracking-wide"> EcoLoop</h1>
      </div>


      {/* Right Side */}
      {user && (
        <div className="flex items-center gap-4 relative" ref={menuRef}>
          {/* Greeting */}
          <span className="hidden sm:block text-sm font-medium">
            Hi, {user.name || user.email} 👋
          </span>

          {/* Profile Button */}
          <button
            onClick={() => setOpen(!open)}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-green-500 hover:bg-green-400 transition"
            title="Profile menu"
          >
            👤
          </button>

          {/* Dropdown */}
          {open && (
            <div  className=" absolute right-0 top-12 w-56 bg-white text-gray-700 rounded-xl shadow-xl shadow-black/10 border border-gray-100 z-50 overflow-hidden">
              {/* Profile Header */}
              <div className="px-4 py-3 border-b">
                <p className="text-sm font-semibold">Profile</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>

              {/* Profile Links */}
              <div className="py-1 text-sm">
                <Link
                  to="/profile"
                  state={{ section: "settings" }}
                  className="block px-4 py-2 hover:bg-gray-100"
                  onClick={() => setOpen(false)}
                >
                  User Settings
                </Link>

                <Link
                  to="/profile"
                  state={{ section: "pickup" }}
                  className="block px-4 py-2 hover:bg-gray-100"
                  onClick={() => setOpen(false)}
                >
                  Pickup Preferences
                </Link>

                <Link
                  to="/profile"
                  state={{ section: "notifications" }}
                  className="block px-4 py-2 hover:bg-gray-100"
                  onClick={() => setOpen(false)}
                >
                  Notifications
                </Link>

                <Link
                  to="/profile"
                  state={{ section: "location" }}
                  className="block px-4 py-2 hover:bg-gray-100"
                  onClick={() => setOpen(false)}
                >
                  Location Preferences
                </Link>

                <Link
                  to="/profile"
                  state={{ section: "rewards" }}
                  className="block px-4 py-2 hover:bg-gray-100"
                  onClick={() => setOpen(false)}
                >
                  Rewards & Coupons
                </Link>

                <Link
                  to="/profile"
                  state={{ section: "security" }}
                  className="block px-4 py-2 hover:bg-gray-100"
                  onClick={() => setOpen(false)}
                >
                  Security
                </Link>
              </div>

              {/* Logout */}
              <div className="border-t">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
