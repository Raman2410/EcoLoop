import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import UserSettings from "./components/UserSettings";
import Rewards from "./components/Rewards";
import Security from "./components/Security";



const sections = {
  settings: "User Settings",
  rewards: "Rewards & Coupons",
  security: "Security",
};

const Profile = () => {
  const location = useLocation();
  const [active, setActive] = useState("settings");

  useEffect(() => {
    if (location.state?.section) {
      setActive(location.state.section);
    }
  }, [location.state]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Profile</h1>

      {/* Tabs */}
      <div className="flex gap-3 flex-wrap mb-6">
        {Object.entries(sections).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActive(key)}
            className={`px-4 py-2 rounded-full text-sm border transition
              ${
                active === key
                  ? "bg-green-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow p-6">
  {active === "settings" && <UserSettings />}
  {active === "rewards" && <Rewards />}
  {active === "security" && <Security />}

</div>

    </div>
  );
};

export default Profile;
