import { useNavigate, Link } from "react-router-dom";
import { useAuthContext } from "../../../context/AuthContext";
import { useState, useRef, useEffect } from "react";

const CollectorNavbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthContext();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="bg-green-600/95 text-white px-6 py-4 flex justify-between items-center shadow-md">
      {/* App Name */}
      <div className="flex items-center gap-2">
        <img
          src="/LogoE.png"
          alt="EcoLoop logo"
          className="w-6 h-6 rounded-full bg-white/90 p-[2px]"
        />
        <h1 className="text-xl font-semibold">EcoLoop – Collector</h1>
      </div>

      {user && (
        <div className="flex items-center gap-4 relative" ref={menuRef}>
          <span className="hidden sm:block text-sm">
Hi, {user?.fullName || user?.name || "Collector"} 👋          </span>

          <button
            onClick={() => setOpen(!open)}
            className="w-9 h-9 rounded-full bg-green-500 hover:bg-green-400"
          >
            👤
          </button>

          {open && (
            <div className="absolute right-0 top-12 w-56 bg-white text-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b">
                <p className="text-sm font-semibold">Collector Profile</p>
                <p className="text-xs text-gray-500 truncate">
                  {user.email}
                </p>
              </div>

              <div className="py-1 text-sm">
                <Link
                  to="/collector/profile"
                  className="block px-4 py-2 hover:bg-gray-100"
                  onClick={() => setOpen(false)}
                >
                  Profile Settings
                </Link>

                <Link
                  to="/collector/availability"
                  className="block px-4 py-2 hover:bg-gray-100"
                  onClick={() => setOpen(false)}
                >
                  Availability
                </Link>

                <Link
                  to="/collector/earnings"
                  className="block px-4 py-2 hover:bg-gray-100"
                  onClick={() => setOpen(false)}
                >
                  Earnings
                </Link>
              </div>

              <div className="border-t">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
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

export default CollectorNavbar;