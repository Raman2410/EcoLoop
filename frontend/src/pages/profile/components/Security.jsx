import { useAuthContext } from "../../../context/AuthContext";
import { ShieldCheck, LogOut } from "lucide-react";

const Security = () => {
  const {user, logout } = useAuthContext();
  

  const handleLogoutAll = () => {
    // Later: backend call to invalidate all tokens
    // await api.post("/auth/logout-all");

    logout();
    alert("Logged out from all devices");
  };

  return (
    <div className="max-w-xl">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <ShieldCheck size={18} />
        Security
      </h2>

      {/* Account Safety Info */}
      <div className="bg-white border rounded-xl p-4 mb-6">
        <p className="font-medium mb-1">Account Protection</p>
        <p className="text-sm text-gray-600">
          Your account is protected using secure authentication.
          Always log out from shared devices.
        </p>
      </div>

      {/* Last Login */}
      <div className="bg-gray-50 border rounded-xl p-4 mb-6">
        <p className="text-sm text-gray-600">Last login</p>
        <p>
  {user?.lastLogin
    ? new Date(user.lastLogin).toLocaleString()
    : "—"}
</p>

        <p className="text-xs text-gray-500 mt-1">
          (Will be fetched from server later)
        </p>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={handleLogoutAll}
          className="w-full flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-500"
        >
          <LogOut size={16} />
          Logout 
        </button>
      </div>

      {/* Help Note */}
      <p className="text-xs text-gray-500 mt-4">
        If you notice suspicious activity, contact EcoLoop support immediately.
      </p>
    </div>
  );
};

export default Security;
