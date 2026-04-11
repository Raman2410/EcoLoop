import { memo, useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "../../../i18n/config.js";
import { useAuthContext } from "../../../context/AuthContext";
import { Menu } from "lucide-react";
import LanguageToggle from "../../common/LanguageToggle";
import NotificationBell from "../../common/NotificationBell";

const CollectorNavbar = memo(({ onMenuClick }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthContext();
  const { t } = useTranslation();
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
    <nav className="bg-green-600/95 text-white px-4 sm:px-6 py-4 flex justify-between items-center shadow-md z-40 relative">
      {/* Left: hamburger + brand */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-1 rounded-md hover:bg-green-500 transition"
          aria-label={t("nav.openMenu")}
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
          <h1 className="text-lg sm:text-xl font-semibold">
            {t("nav.brand")} <span className="hidden sm:inline">– {t("nav.collectorSuffix")}</span>
          </h1>
          
        </div>
      </div>

      {/* Right: language toggle + user menu */}
      <div className="flex items-center gap-3">
        <NotificationBell/>
        {/* Language toggle — always visible */}
        <LanguageToggle />
        
        {user && (
          <div className="flex items-center gap-3 relative" ref={menuRef}>
            <span className="hidden sm:block text-sm">
              {t("nav.greeting", { name: user?.fullName || user?.name || "Collector" })}
            </span>
        
            <button
              onClick={toggleMenu}
              className="w-9 h-9 rounded-full bg-green-500 hover:bg-green-400 transition flex items-center justify-center"
              title={t("nav.collectorProfile")}
            >
              👤
            </button>

            {open && (
              <div className="absolute right-0 top-12 w-56 bg-white text-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b">
                  <p className="text-sm font-semibold">{t("nav.collectorProfile")}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>

                <div className="py-1 text-sm">
                  <Link
                    to="/collector/profile"
                    className="block px-4 py-2 hover:bg-gray-100 transition-colors"
                    onClick={closeMenu}
                  >
                    {t("nav.profileSettings")}
                  </Link>
                  <Link
                    to="/collector/availability"
                    className="block px-4 py-2 hover:bg-gray-100 transition-colors"
                    onClick={closeMenu}
                  >
                    {t("nav.availability")}
                  </Link>
                </div>

                <div className="border-t">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    {t("nav.logout")}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
});

CollectorNavbar.displayName = "CollectorNavbar";
export default CollectorNavbar;
