import { memo } from "react";
import { useAuthContext } from "../../../context/AuthContext";

const FieldDisplay = memo(({ label, value }) => (
  <div>
    <label className="block text-sm text-gray-600 mb-1">{label}</label>
    <div className="w-full border rounded-lg px-4 py-2.5 bg-gray-100 text-gray-700 text-sm">
      {value || "—"}
    </div>
  </div>
));
FieldDisplay.displayName = "FieldDisplay";

const UserSettings = memo(() => {
  const { user } = useAuthContext();

  return (
    <div className="max-w-xl">
      <h2 className="text-lg font-semibold mb-4">Account Information</h2>
      <div className="space-y-4">
        <FieldDisplay label="Full Name" value={user?.name} />
        <FieldDisplay label="Email" value={user?.email} />
        <FieldDisplay label="Phone Number" value={user?.phone || "Not provided"} />
        <p className="text-xs text-gray-500 mt-2">
          Account details are managed by EcoLoop. Contact support if any information is incorrect.
        </p>
      </div>
    </div>
  );
});

UserSettings.displayName = "UserSettings";
export default UserSettings;
