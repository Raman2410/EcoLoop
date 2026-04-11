import { memo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../../context/AuthContext";
import { ShieldCheck, LogOut } from "lucide-react";

const Security = memo(() => {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();

  const handleLogout = useCallback(() => {
    logout();
    navigate("/", { replace: true });
  }, [logout, navigate]);

  return (
    <div className="max-w-xl">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <ShieldCheck size={18} />
        Security
      </h2>

      <div className="bg-white border rounded-xl p-4 mb-4">
        <p className="font-medium mb-1 text-sm">Account Protection</p>
        <p className="text-sm text-gray-600">
          Your account is protected using secure authentication. Always log out from shared devices.
        </p>
      </div>

      <div className="bg-gray-50 border rounded-xl p-4 mb-6">
        <p className="text-sm text-gray-500">Last login</p>
        <p className="text-sm font-medium text-gray-800 mt-0.5">
          {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : "—"}
        </p>
      </div>

      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
      >
        <LogOut size={16} />
        Logout
      </button>

      <p className="text-xs text-gray-500 mt-4">
        If you notice suspicious activity, contact EcoLoop support immediately.
      </p>
    </div>
  );
});

Security.displayName = "Security";
export default Security;
