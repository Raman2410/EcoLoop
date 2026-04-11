import { useState } from "react";
import { useAuthContext } from "../../context/AuthContext";
import { useTranslation } from "../../i18n/config.js";
import axiosInstance from "../../api/axiosInstance";
import toast from "react-hot-toast";
import { Power, CheckCircle, XCircle } from "lucide-react";
import Button from "../../components/common/Button";

const Availability = () => {
  const { user, refreshUser } = useAuthContext();
  const { t } = useTranslation();
  const [updating, setUpdating] = useState(false);

  // Use local state for immediate feedback, then sync with DB
  const [isAvailable, setIsAvailable] = useState(user?.isAvailable ?? true);

  const toggleAvailability = async () => {
    setUpdating(true);
    const newValue = !isAvailable;
    try {
      await axiosInstance.patch("/auth/availability", { isAvailable: newValue });
      setIsAvailable(newValue);
      await refreshUser(); // Sync central auth state
      toast.success(t("availability.toastUpdate"));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t("availability.title")}</h1>
        <p className="text-gray-500 mt-2">{t("availability.subtitle")}</p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
        <div className="flex flex-col items-center text-center space-y-6">
          {/* Visual indicator */}
          <div className={`w-24 h-24 rounded-full flex items-center justify-center ${
            isAvailable ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
          }`}>
            {isAvailable ? <CheckCircle size={48} /> : <XCircle size={48} />}
          </div>

          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-1">
              {t("availability.statusLabel")}
            </p>
            <h2 className={`text-4xl font-extrabold ${isAvailable ? "text-green-600" : "text-red-600"}`}>
              {isAvailable ? t("availability.available") : t("availability.unavailable")}
            </h2>
          </div>

          <p className="text-gray-600 max-w-sm">
            {isAvailable ? t("availability.availableDesc") : t("availability.unavailableDesc")}
          </p>

          <Button
            onClick={toggleAvailability}
            loading={updating}
            variant={isAvailable ? "danger" : "primary"}
            className="w-full max-w-xs h-14 rounded-2xl text-lg font-bold shadow-lg"
          >
            <Power className="mr-2" size={20} />
            {isAvailable ? t("availability.toggleOn") : t("availability.toggleOff")}
          </Button>
        </div>
      </div>

      {/* Helper boxes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
          <h3 className="font-bold text-blue-800 mb-1">📅 Scheduled Pickups</h3>
          <p className="text-sm text-blue-600">Going offline only prevents new requests. Your already assigned pickups must still be completed.</p>
        </div>
        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5">
          <h3 className="font-bold text-orange-800 mb-1">🔌 Battery Tip</h3>
          <p className="text-sm text-orange-600">Switching to offline stops GPS tracking and saves battery while you're not working.</p>
        </div>
      </div>
    </div>
  );
};

export default Availability;
