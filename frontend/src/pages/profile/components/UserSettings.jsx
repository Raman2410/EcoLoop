import { useAuthContext } from "../../../context/AuthContext";

const UserSettings = () => {
  const { user } = useAuthContext();

  return (
    <div className="max-w-xl">
      <h2 className="text-lg font-semibold mb-4">Account Information</h2>

      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm text-gray-600 mb-1">
            Full Name
          </label>
          <div className="w-full border rounded-lg px-4 py-2 bg-gray-100 text-gray-700">
            {user?.name || "—"}
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm text-gray-600 mb-1">
            Email
          </label>
          <div className="w-full border rounded-lg px-4 py-2 bg-gray-100 text-gray-700">
            {user?.email || "—"}
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm text-gray-600 mb-1">
            Phone Number
          </label>
          <div className="w-full border rounded-lg px-4 py-2 bg-gray-100 text-gray-700">
            {user?.phone || "Not provided"}
          </div>
        </div>

        {/* Info Note */}
        <p className="text-xs text-gray-500 mt-2">
          Account details are managed by EcoLoop.  
          Contact support if any information is incorrect.
        </p>
      </div>
    </div>
  );
};

export default UserSettings;
