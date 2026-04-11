import { memo, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, lazy, Suspense } from "react";
import Loader from "../../components/common/Loader";

// Lazy-load profile subsections
const UserSettings = lazy(() => import("./components/UserSettings"));
const Rewards = lazy(() => import("./components/Rewards"));
const Security = lazy(() => import("./components/Security"));

const SECTIONS = {
  settings: "User Settings",
  rewards: "Rewards & Coupons",
  security: "Security",
};

const TabButton = memo(({ id, label, isActive, onClick }) => (
  <button
    onClick={() => onClick(id)}
    className={`px-4 py-2 rounded-full text-sm border transition-colors ${
      isActive ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100"
    }`}
  >
    {label}
  </button>
));
TabButton.displayName = "TabButton";

const Profile = () => {
  const location = useLocation();
  const [active, setActive] = useState("settings");

  useEffect(() => {
    if (location.state?.section) setActive(location.state.section);
  }, [location.state]);

  const handleTab = useCallback((id) => setActive(id), []);

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-xl sm:text-2xl font-bold mb-5">Profile</h1>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {Object.entries(SECTIONS).map(([key, label]) => (
          <TabButton key={key} id={key} label={label} isActive={active === key} onClick={handleTab} />
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6">
        <Suspense fallback={<Loader text="Loading..." />}>
          {active === "settings" && <UserSettings />}
          {active === "rewards" && <Rewards />}
          {active === "security" && <Security />}
        </Suspense>
      </div>
    </div>
  );
};

export default Profile;
