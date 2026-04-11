import { useState, useEffect, memo, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useAuthContext } from "../../context/AuthContext";
import toast from "react-hot-toast";

const inputClass =
  "w-full px-4 py-3 rounded-lg border text-sm outline-none transition-all border-slate-700 bg-slate-900 text-slate-100 placeholder-slate-500 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30";

const Login = () => {
  const navigate = useNavigate();
  const { loginHandler } = useAuth();
  const { user, loading } = useAuthContext();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      navigate(user.role === "collector" ? "/collector/dashboard" : "/dashboard", { replace: true });
    }
  }, [user, loading, navigate]);

  const submitHandler = useCallback(async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const loggedInUser = await loginHandler({ email, password });
      navigate(loggedInUser.role === "collector" ? "/collector/dashboard" : "/dashboard", { replace: true });
    } catch (error) {
      const status = error.response?.status;
      if (status === 403) {
        toast.error("Collector account not verified. Please complete OTP verification.");
      } else {
        toast.error(error.response?.data?.message || "Invalid email or password");
      }
      setIsSubmitting(false);
    }
  }, [isSubmitting, loginHandler, email, password, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 gap-4">
        <div className="w-9 h-9 border-4 border-slate-700 border-t-emerald-400 rounded-full animate-spin" />
        <p className="text-slate-400 text-sm font-medium tracking-wide">Checking authentication…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 sm:px-6">
      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl">
        <h2 className="text-2xl sm:text-3xl font-serif text-slate-100 text-center mb-2">
          Welcome Back 👋
        </h2>
        <p className="text-center text-slate-400 text-sm mb-8">
          Login to continue your EcoLoop journey
        </p>

        <form onSubmit={submitHandler} className="space-y-5">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={isSubmitting}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              disabled={isSubmitting}
              required
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-bold tracking-wide transition-all hover:shadow-lg hover:shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Logging in…" : "Login →"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-6">
          New to EcoLoop?{" "}
          <Link
            to="/register"
            className="font-semibold text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition-colors"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
