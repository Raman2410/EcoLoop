import { useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import axiosInstance from "../../api/axiosInstance";

const VerifyOtp = () => {
  const { userId } = useParams();
  const location = useLocation();
  const phone = location.state?.phone || "your phone";

  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitHandler = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!otp || otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await axiosInstance.post("/auth/verify-otp", {
        userId,
        otp,
      });

      // ✅ Save directly to localStorage — bypasses stale useEffect listeners
      // in Login/Register that watch AuthContext user state and cause redirect loops
      const userData = {
        _id: userId,
        role: res.data.role,
        businessName: res.data.businessName,
        isVerified: res.data.isVerified,
      };
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("token", res.data.token);

      toast.success("OTP verified successfully!");

      // Hard redirect — forces full remount so AuthContext re-reads localStorage
      // and ProtectedRoute sees the user correctly before rendering
      window.location.replace("/collector/dashboard");

    } catch (error) {
      toast.error(error.response?.data?.message || "OTP verification failed");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-6">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h2 className="text-xl font-semibold text-slate-100 text-center mb-2">
          Verify OTP
        </h2>
        <p className="text-sm text-slate-400 text-center mb-1">
          Enter the 6-digit OTP sent to
        </p>
        <p className="text-sm text-emerald-400 text-center font-semibold mb-6">
          +91{phone}
        </p>

        <form onSubmit={submitHandler} className="space-y-4">
          <input
            type="text"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            placeholder="6-digit OTP"
            className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-center tracking-widest text-lg focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30 outline-none"
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition disabled:opacity-50"
          >
            {isSubmitting ? "Verifying..." : "Verify OTP"}
          </button>
        </form>

        <p className="text-xs text-slate-500 text-center mt-4">
          Didn't receive OTP?{" "}
          <span
            className="text-emerald-400 cursor-pointer hover:underline"
            onClick={() => window.location.replace("/register")}
          >
            Go back & re-register
          </span>
        </p>
      </div>
    </div>
  );
};

export default VerifyOtp;