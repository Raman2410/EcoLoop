import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "../../i18n/config.js";
import toast from "react-hot-toast";
import axiosInstance from "../../api/axiosInstance";

const VerifyOtp = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOtpChange = useCallback((e) => {
    setOtp(e.target.value.replace(/\D/g, ""));
  }, []);

  const submitHandler = useCallback(async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!otp || otp.length !== 6) {
      toast.error(t("verifyOtp.toastInvalidOtp"));
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axiosInstance.post("/auth/verify-otp", { userId, otp });

      const userData = {
        _id: userId,
        role: res.data.role,
        businessName: res.data.businessName,
        isVerified: res.data.isVerified,
      };
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("token", res.data.token);

      toast.success(t("verifyOtp.toastSuccess"));
      navigate("/collector/dashboard", { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || t("verifyOtp.toastFailed"));
      setIsSubmitting(false);
    }
  }, [isSubmitting, otp, userId, t, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 sm:px-6">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h2 className="text-xl font-semibold text-slate-100 text-center mb-2">
          {t("verifyOtp.title")}
        </h2>
      <p className="text-sm text-slate-400 text-center mb-6">
  {t("verifyOtp.sentToGeneric") || "OTP has been sent to your registered number"}
</p>

        <form onSubmit={submitHandler} className="space-y-4">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={handleOtpChange}
            placeholder={t("verifyOtp.placeholder")}
            className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-center tracking-widest text-lg focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30 outline-none transition-all"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all disabled:opacity-50"
          >
            {isSubmitting ? t("verifyOtp.verifying") : t("verifyOtp.verify")}
          </button>
        </form>

        <p className="text-xs text-slate-500 text-center mt-4">
          Didn't receive OTP?{" "}
          <span
            className="text-emerald-400 cursor-pointer hover:underline"
            onClick={() => navigate("/register")}
          >
            {t("verifyOtp.goBack")}
          </span>
        </p>
      </div>
    </div>
  );
};

export default VerifyOtp;
