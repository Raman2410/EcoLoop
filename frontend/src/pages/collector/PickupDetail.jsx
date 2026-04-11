import { memo, useCallback } from "react";
import { MapPin, Calendar, Image as ImageIcon } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "../../i18n/config.js";
import { acceptPickup } from "../../services/collector.service";
import toast from "react-hot-toast";
import PickupMap from "../../components/common/PickupMap";

const DetailField = memo(({ icon: Icon, label, value }) => (
  <div className="flex gap-3 items-start">
    <Icon className="text-gray-400 mt-0.5 shrink-0" size={18} />
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-gray-800 text-sm font-medium">{value}</p>
    </div>
  </div>
));
DetailField.displayName = "DetailField";

const PickupDetail = () => {
  const { state: pickup } = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleAccept = useCallback(async () => {
    try {
      await acceptPickup(pickup._id);
      toast.success(t("pickupDetail.toastAccepted"));
      navigate("/collector/assigned");
    } catch (error) {
      toast.error(error.response?.data?.message || t("pickupDetail.toastAcceptFailed"));
    }
  }, [pickup, navigate, t]);

  if (!pickup) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p className="text-lg">{t("pickupDetail.notFound")}</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-sm text-green-600 hover:underline">
          {t("pickupDetail.goBack")}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">{t("pickupDetail.title")}</h1>
        <p className="text-sm text-gray-500">{t("pickupDetail.subtitle")}</p>
      </div>

      <div className="bg-white border rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm">
        {/* Scrap + Status */}
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">{t("pickupDetail.scrapType")}</p>
            <h2 className="text-lg font-semibold text-gray-800 capitalize">{pickup.scrapType}</h2>
          </div>
          <span className="px-3 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700 font-medium capitalize">
            {pickup.status}
          </span>
        </div>

        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{t("pickupDetail.approxLoad")}</p>
          <p className="font-medium text-gray-800 capitalize">{pickup.approxLoad}</p>
        </div>

        <DetailField icon={MapPin} label={t("pickupDetail.pickupAddress")} value={pickup.address} />

        {/* Live map showing the pickup location */}
        <PickupMap address={pickup.address} height="200px" />

        <DetailField
          icon={Calendar}
          label={t("pickupDetail.scheduledDate")}
          value={new Date(pickup.scheduledDate).toDateString()}
        />

        {pickup.image ? (
          <img
            src={pickup.image}
            alt="Scrap"
            className="rounded-xl max-h-64 w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="border rounded-xl p-6 text-center text-gray-400">
            <ImageIcon className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">{t("pickupDetail.noImage")}</p>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row justify-end gap-3">
        <button
          onClick={() => navigate(-1)}
          className="px-5 py-2.5 border rounded-lg hover:bg-gray-50 text-sm transition-colors"
        >
          {t("pickupDetail.back")}
        </button>
        <button
          onClick={handleAccept}
          className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-500 text-sm font-medium transition-colors"
        >
          {t("pickupDetail.acceptPickup")}
        </button>
      </div>
    </div>
  );
};

export default PickupDetail;