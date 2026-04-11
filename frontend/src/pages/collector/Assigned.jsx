import { useEffect, useState, useCallback, useRef, memo } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "../../i18n/config.js";
import axiosInstance from "../../api/axiosInstance";
import {
  generateCompletionOtp,
  verifyOtpAndComplete,
} from "../../services/collector.service";
import Loader from "../../components/common/Loader";
import useCollectorTracking from "../../hooks/useCollectorTracking";

// ─── OTP Countdown hook ────────────────────────────────────────────────────────
const useCountdown = (expiresAt) => {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!expiresAt) { setSeconds(0); return; }
    const calc = () => Math.max(0, Math.floor((new Date(expiresAt) - Date.now()) / 1000));
    setSeconds(calc());
    const id = setInterval(() => {
      const s = calc();
      setSeconds(s);
      if (s === 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  return seconds;
};

// ─── OTP + Proof panel ────────────────────────────────────────────────────────
const OtpPanel = memo(({ pickupId, expiresAt, onSuccess, onCancel }) => {
  const { t } = useTranslation();
  const [otp, setOtp] = useState("");
  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const countdown = useCountdown(expiresAt);
  const isExpired = countdown === 0 && Boolean(expiresAt);

  const handleFileChange = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error(t("assigned.toastImageSize")); return; }
    setProofFile(file);
    setProofPreview(URL.createObjectURL(file));
  }, [t]);

  const clearProof = useCallback(() => {
    if (proofPreview) URL.revokeObjectURL(proofPreview);
    setProofFile(null);
    setProofPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [proofPreview]);

  const handleSubmit = useCallback(async () => {
    if (!otp.trim()) { toast.error(t("assigned.toastEnterOtp")); return; }
    if (otp.trim().length !== 6) { toast.error(t("assigned.toastOtpSixDigits")); return; }
    if (isExpired) { toast.error(t("assigned.toastOtpExpired")); return; }

    setSubmitting(true);
    try {
      const res = await verifyOtpAndComplete(pickupId, otp.trim(), proofFile);
      toast.success(t("assigned.toastVerified", { coins: res.ecoCoinsEarned ?? 0 }));
      onSuccess(pickupId);
    } catch (err) {
      const msg = err.response?.data?.message || t("assigned.toastVerifyFailed");
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }, [otp, isExpired, pickupId, proofFile, onSuccess, t]);

  const mins = String(Math.floor(countdown / 60)).padStart(2, "0");
  const secs = String(countdown % 60).padStart(2, "0");

  return (
    <div className="mt-3 p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
      {/* Timer row */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
          {t("assigned.enterOtp")}
        </p>
        {expiresAt && (
          <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
            isExpired ? "bg-red-100 text-red-600"
              : countdown <= 60 ? "bg-orange-100 text-orange-600"
              : "bg-green-100 text-green-700"
          }`}>
            {isExpired ? t("assigned.expired") : `${mins}:${secs}`}
          </span>
        )}
      </div>

      {isExpired ? (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {t("assigned.otpExpiredMsg")}
        </p>
      ) : (
        <>
          {/* OTP input */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              {t("assigned.sixDigitOtp")}
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="_ _ _ _ _ _"
              disabled={submitting}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-center text-lg font-mono tracking-widest
                focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
                disabled:bg-gray-100 transition"
            />
          </div>

          {/* Proof image */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              {t("assigned.proofImage")} <span className="text-gray-400">{t("assigned.proofOptional")}</span>
            </label>
            {proofPreview ? (
              <div className="relative rounded-xl overflow-hidden border border-gray-300">
                <img src={proofPreview} alt="Proof preview" className="w-full max-h-36 object-cover" />
                <button
                  type="button"
                  onClick={clearProof}
                  disabled={submitting}
                  className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-lg hover:bg-black/70"
                >
                  {t("assigned.remove")}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={submitting}
                className="w-full py-2 border-2 border-dashed border-gray-300 rounded-xl text-xs text-gray-500
                  hover:border-green-400 hover:text-green-600 transition disabled:opacity-50"
              >
                {t("assigned.uploadProof")}
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
              disabled={submitting}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSubmit}
              disabled={submitting || otp.length !== 6}
              className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold
                rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t("assigned.verifying")}
                </>
              ) : t("assigned.verifyComplete")}
            </button>
            <button
              onClick={onCancel}
              disabled={submitting}
              className="px-4 py-2.5 border border-gray-300 text-gray-600 text-sm rounded-xl
                hover:bg-gray-50 transition disabled:opacity-50"
            >
              {t("assigned.cancel")}
            </button>
          </div>
        </>
      )}
    </div>
  );
});
OtpPanel.displayName = "OtpPanel";

// ─── Mobile card ───────────────────────────────────────────────────────────────
const MobilePickupCard = memo(({ pickup, otpState, onGenerateOtp, onOtpSuccess, onOtpCancel, generatingOtp }) => {
  const { t } = useTranslation();
  const isInProgress = pickup.status === "in_progress";
  const isThisGenerating = generatingOtp === pickup._id;

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-semibold text-gray-800">{pickup.userId?.name}</p>
          <p className="text-xs text-gray-500">{pickup.userId?.phone}</p>
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
          isInProgress
            ? "text-amber-700 bg-amber-50 border border-amber-200"
            : "text-orange-600 bg-orange-50"
        }`}>
          {isInProgress ? t("assigned.otpSent") : t("assigned.assigned")}
        </span>
      </div>

      <p className="text-sm text-gray-600 truncate">📍 {pickup.address || pickup.userId?.address || "—"}</p>
      <div className="flex gap-4 text-sm text-gray-600">
        <span>⚖️ <span className="capitalize">{pickup.approxLoad}</span></span>
        <span>♻️ <span className="capitalize">{pickup.scrapType}</span></span>
      </div>

      {otpState?.pickupId === pickup._id ? (
        <OtpPanel
          pickupId={pickup._id}
          expiresAt={otpState.expiresAt}
          onSuccess={onOtpSuccess}
          onCancel={onOtpCancel}
        />
      ) : (
        <button
          onClick={() => onGenerateOtp(pickup._id)}
          disabled={isThisGenerating}
          className="w-full py-2.5 bg-green-600 text-white text-sm font-medium rounded-xl
            hover:bg-green-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
        >
          {isThisGenerating ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {t("assigned.sendingOtp")}
            </>
          ) : isInProgress ? t("assigned.resendOtp") : t("assigned.completePickup")}
        </button>
      )}
    </div>
  );
});
MobilePickupCard.displayName = "MobilePickupCard";

// ─── Main component ────────────────────────────────────────────────────────────
const AssignedPickups = () => {
  const { t } = useTranslation();
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingOtp, setGeneratingOtp] = useState(null);
  const [otpState, setOtpState] = useState(null);

  // Broadcast GPS location while a pickup is in_progress
  const activePickup = pickups.find((p) => p.status === "in_progress");
  useCollectorTracking(activePickup?._id ?? null);

  const fetchAssignedPickups = useCallback(async () => {
    try {
      const res = await axiosInstance.get("/pickups/assigned");
      setPickups(res.data?.pickups || []);
    } catch (err) {
      console.error("Failed to load assigned pickups", err);
      toast.error(t("common.error"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { fetchAssignedPickups(); }, [fetchAssignedPickups]);

  const handleGenerateOtp = useCallback(async (pickupId) => {
    setGeneratingOtp(pickupId);
    setOtpState(null);
    try {
      const res = await generateCompletionOtp(pickupId);
      setOtpState({ pickupId, expiresAt: res.otpExpiresAt });
      setPickups((prev) =>
        prev.map((p) => p._id === pickupId ? { ...p, status: "in_progress" } : p)
      );
      toast.success(res.message || t("assigned.toastOtpSent"));
    } catch (err) {
      const msg = err.response?.data?.message || t("assigned.toastOtpFailed");
      toast.error(msg);
    } finally {
      setGeneratingOtp(null);
    }
  }, [t]);

  const handleOtpSuccess = useCallback((pickupId) => {
    setOtpState(null);
    setPickups((prev) => prev.filter((p) => p._id !== pickupId));
  }, []);

  const handleOtpCancel = useCallback(() => setOtpState(null), []);

  if (loading) return <Loader text={t("assigned.loadingAssigned")} />;

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-semibold mb-1">{t("assigned.title")}</h1>
      <p className="text-gray-500 text-sm mb-6">{t("assigned.subtitle")}</p>

      {/* Info banner */}
      <div className="mb-5 p-3 rounded-xl bg-blue-50 border border-blue-100 flex items-start gap-2">
        <span className="text-blue-500 text-base shrink-0 mt-0.5">ℹ️</span>
        <p className="text-xs text-blue-700 leading-relaxed">
          <span className="font-semibold">{t("assigned.howToComplete")}</span>{" "}
          {t("assigned.howToCompleteDesc")}
        </p>
      </div>

      {pickups.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-sm text-gray-400 text-center">
          <p className="text-4xl mb-3">📦</p>
          <p className="font-medium">{t("assigned.noAssigned")}</p>
          <p className="text-sm mt-1">{t("assigned.noAssignedHint")}</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  {[
                    t("assigned.user"),
                    t("assigned.address"),
                    t("assigned.scrapType"),
                    t("assigned.load"),
                    t("assigned.status"),
                    t("assigned.action"),
                  ].map((h) => (
                    <th
                      key={h}
                      className={`text-left px-4 py-3 font-medium ${h === t("assigned.action") ? "text-right" : ""}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pickups.map((pickup) => {
                  const isInProgress = pickup.status === "in_progress";
                  const isThisGenerating = generatingOtp === pickup._id;
                  const showOtpPanel = otpState?.pickupId === pickup._id;

                  return (
                    <>
                      <tr key={pickup._id} className="border-t hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium">{pickup.userId?.name}</div>
                          <div className="text-xs text-gray-500">{pickup.userId?.phone}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-600 max-w-[180px] truncate">
                          {pickup.address || pickup.userId?.address || "—"}
                        </td>
                        <td className="px-4 py-3 capitalize">{pickup.scrapType}</td>
                        <td className="px-4 py-3 capitalize">{pickup.approxLoad}</td>
                        <td className="px-4 py-3">
                          {isInProgress ? (
                            <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full text-xs font-medium">
                              {t("assigned.otpSent")}
                            </span>
                          ) : (
                            <span className="text-orange-600 font-medium">{t("assigned.assigned")}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleGenerateOtp(pickup._id)}
                            disabled={isThisGenerating || showOtpPanel}
                            className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium
                              hover:bg-green-700 disabled:opacity-50 transition-colors
                              flex items-center gap-1.5 ml-auto"
                          >
                            {isThisGenerating ? (
                              <>
                                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                {t("assigned.sendingOtp")}
                              </>
                            ) : isInProgress ? t("assigned.resendOtp") : t("assigned.completePickup")}
                          </button>
                        </td>
                      </tr>

                      {showOtpPanel && (
                        <tr key={`${pickup._id}-otp`} className="border-t bg-amber-50/30">
                          <td colSpan={6} className="px-4 py-3">
                            <OtpPanel
                              pickupId={pickup._id}
                              expiresAt={otpState.expiresAt}
                              onSuccess={handleOtpSuccess}
                              onCancel={handleOtpCancel}
                            />
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-4">
            {pickups.map((pickup) => (
              <MobilePickupCard
                key={pickup._id}
                pickup={pickup}
                otpState={otpState}
                onGenerateOtp={handleGenerateOtp}
                onOtpSuccess={handleOtpSuccess}
                onOtpCancel={handleOtpCancel}
                generatingOtp={generatingOtp}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default AssignedPickups;