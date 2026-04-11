import { useState } from "react";
import { useAuthContext } from "../../context/AuthContext";
import { useTranslation } from "../../i18n/config.js";
import axiosInstance from "../../api/axiosInstance";
import toast from "react-hot-toast";
import { User, Smartphone, Building, MapPin, Truck, Save, Hash } from "lucide-react";
import Button from "../../components/common/Button";

const CollectorProfile = () => {
  const { user, refreshUser } = useAuthContext();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.name || "",
    businessName: user?.businessName || "",
    serviceArea: user?.serviceArea || "",
    vehicleType: user?.vehicleType || "bike",
    vehicleNumber: user?.vehicleNumber || "",
    phone: user?.phone || "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axiosInstance.put("/auth/profile", formData);
      await refreshUser();
      toast.success(t("collectorProfile.updateSuccess"));
    } catch (error) {
      toast.error(t("collectorProfile.updateError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t("collectorProfile.title")}</h1>
        <p className="text-gray-500 mt-2">{t("collectorProfile.subtitle")}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal section */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <User className="text-blue-600 w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">{t("collectorProfile.personalInfo")}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-500 uppercase tracking-widest block">{t("collectorProfile.name")}</label>
              <div className="relative group">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-12 pr-4 focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all outline-none"
                />
                <User size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
              </div>
            </div>

            <div className="space-y-2 opacity-60">
              <label className="text-sm font-bold text-gray-500 uppercase tracking-widest block">{t("collectorProfile.email")}</label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-6 cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-500 uppercase tracking-widest block">{t("collectorProfile.phone")}</label>
              <div className="relative group">
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-12 pr-4 focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all outline-none"
                />
                <Smartphone size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
              </div>
            </div>
          </div>
        </div>

        {/* Business section */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Building className="text-green-600 w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">{t("collectorProfile.businessInfo")}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-500 uppercase tracking-widest block">{t("collectorProfile.businessName")}</label>
              <div className="relative group">
                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-12 pr-4 focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all outline-none"
                />
                <Building size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-500 uppercase tracking-widest block">{t("collectorProfile.serviceArea")}</label>
              <div className="relative group">
                <input
                  type="text"
                  name="serviceArea"
                  value={formData.serviceArea}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-12 pr-4 focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all outline-none"
                />
                <MapPin size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-500 uppercase tracking-widest block">{t("collectorProfile.vehicleType")}</label>
              <div className="relative group">
                <select
                  name="vehicleType"
                  value={formData.vehicleType}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-12 pr-4 focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all outline-none appearance-none cursor-pointer"
                >
                  <option value="cycle">Cycle</option>
                  <option value="bike">Bike</option>
                  <option value="auto">Auto Rikshaw</option>
                  <option value="truck">Truck</option>
                </select>
                <Truck size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-500 uppercase tracking-widest block">{t("collectorProfile.vehicleNumber")}</label>
              <div className="relative group">
                <input
                  type="text"
                  name="vehicleNumber"
                  value={formData.vehicleNumber}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-12 pr-4 focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all outline-none"
                />
                <Hash size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            loading={loading}
            className="w-full sm:w-auto h-14 min-w-[200px] rounded-2xl text-lg font-bold shadow-lg"
          >
            <Save className="mr-2" size={20} />
            {t("collectorProfile.saveChanges")}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CollectorProfile;
