import { memo, useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthContext } from "../../../context/AuthContext";
import { Menu } from "lucide-react";
import NotificationBell from "../../common/NotificationBell";

const Navbar = memo(({ onMenuClick }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthContext();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  const handleLogout = useCallback(() => {
    logout();
    navigate("/", { replace: true });
  }, [logout, navigate]);

  const closeMenu = useCallback(() => setOpen(false), []);
  const toggleMenu = useCallback(() => setOpen((v) => !v), []);

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
    <nav className="bg-green-600/95 text-white px-4 sm:px-6 py-4 flex justify-between items-center shadow-md shadow-black/10 z-40 relative">
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-1 rounded-md hover:bg-green-500 transition"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2">
          <img
            src="/LogoE.png"
            alt="EcoLoop logo"
            className="w-6 h-6 rounded-full bg-white/90 p-[2px]"
            loading="lazy"
          />
          <h1 className="text-lg sm:text-xl font-semibold tracking-wide">EcoLoop</h1>
        </div>
      </div>

      {user && (
        <div className="flex items-center gap-3 relative" ref={menuRef}>
          <span className="hidden sm:block text-sm font-medium">
            Hi, {user.name || user.email} 👋
          </span>

          <NotificationBell />

          <button
            onClick={toggleMenu}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-green-500 hover:bg-green-400 transition"
            title="Profile menu"
          >
            👤
          </button>

          {open && (
            <div className="absolute right-0 top-12 w-56 bg-white text-gray-700 rounded-xl shadow-xl shadow-black/10 border border-gray-100 z-50 overflow-hidden">
              <div className="px-4 py-3 border-b">
                <p className="text-sm font-semibold">Profile</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>

              <div className="py-1 text-sm">
                {[
                  { section: "settings", label: "User Settings" },
                  { section: "pickup", label: "Pickup Preferences" },
                  { section: "notifications", label: "Notifications" },
                  { section: "location", label: "Location Preferences" },
                  { section: "rewards", label: "Rewards & Coupons" },
                  { section: "security", label: "Security" },
                ].map(({ section, label }) => (
                  <Link
                    key={section}
                    to="/profile"
                    state={{ section }}
                    className="block px-4 py-2 hover:bg-gray-100 transition-colors"
                    onClick={closeMenu}
                  >
                    {label}
                  </Link>
                ))}
              </div>

              <div className="border-t">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
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
});

Navbar.displayName = "Navbar";
export default Navbar;