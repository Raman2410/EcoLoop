import { useState, useCallback, memo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../../services/auth.service";
import toast from "react-hot-toast";

const inputClass =
  "w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-all border-slate-700 bg-slate-900 text-slate-100 placeholder-slate-500 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30";

const labelClass = "flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 tracking-widest uppercase mb-1";

const FEATURES = [
  "Verified collectors near you",
  "Real-time pickup tracking",
  "Earn rewards for recycling",
  "Zero-waste community goals",
];

// Extracted to prevent re-mount on role change
const BrandingPanel = memo(() => (
  <div className="hidden lg:flex w-[42%] flex-shrink-0 relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-900 flex-col justify-center px-14 py-16 border-r border-slate-800/60">
    <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-emerald-600/10" />
    <div className="absolute top-12 -right-12 w-48 h-48 rounded-full bg-emerald-500/5" />
    <div className="absolute top-1/2 left-1/4 w-32 h-32 rounded-full bg-emerald-400/10 blur-3xl" />
    <div className="relative z-10">
      <h1 className="text-4xl font-serif text-slate-100 tracking-tight mb-3">EcoLoop</h1>
      <p className="text-emerald-400 text-sm leading-relaxed max-w-xs mb-16">
        Closing the loop on waste, one collection at a time.
      </p>
      <ul className="flex flex-col gap-6">
        {FEATURES.map((f) => (
          <li key={f} className="flex items-center gap-3">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-[10px]">
              ✓
            </span>
            <span className="text-slate-400 text-sm">{f}</span>
          </li>
        ))}
      </ul>
    </div>
  </div>
));
BrandingPanel.displayName = "BrandingPanel";

const Register = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState("user");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const submitHandler = useCallback(async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (role === "collector" && (!businessName || !phone || !serviceArea || !vehicleType || !vehicleNumber)) {
      toast.error("Please fill all collector details");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = role === "user"
        ? { name, email, password, role }
        : { name, email, password, role, businessName, phone, serviceArea, vehicleType, vehicleNumber };

      const res = await registerUser(payload);

      if (role === "collector") {
        toast.success(`OTP sent to your phone! ${res.otp ? `(Testing OTP: ${res.otp})` : ""}`, { duration: 6000 });
        navigate(`/collector/verify-otp/${res.userId}`, { replace: true });
      } else {
        toast.success("Registration successful! Please login.");
        navigate("/", { replace: true });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed");
      setIsSubmitting(false);
    }
  }, [isSubmitting, role, name, email, password, businessName, phone, serviceArea, vehicleType, vehicleNumber, navigate]);

  const togglePassword = useCallback(() => setShowPassword((v) => !v), []);

  return (
    <div className="min-h-screen flex bg-slate-950">
      <BrandingPanel />

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 sm:px-8 py-10 bg-slate-950 overflow-y-auto">
        <div className="w-full max-w-[440px]">
          <div className="mb-6">
            <h2 className="text-2xl font-serif text-slate-100 tracking-tight mb-1">
              {role === "collector" ? "Collector Registration" : "Create your account"}
            </h2>
            <p className="text-sm text-slate-400">
              {role === "collector" ? "Set up your collection business profile" : "Join the circular economy today"}
            </p>
          </div>

          {/* Role selector */}
          <div className="flex gap-2 mb-5 p-1 rounded-xl bg-slate-900/60 border border-slate-800">
            {[{ val: "user", emoji: "🙋", label: "User" }, { val: "collector", emoji: "🚛", label: "Collector" }].map(({ val, emoji, label }) => (
              <button
                key={val}
                type="button"
                onClick={() => setRole(val)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm transition-all ${
                  role === val ? "bg-emerald-500 text-slate-950 font-semibold" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {emoji} {label}
              </button>
            ))}
          </div>

          <form onSubmit={submitHandler} className="flex flex-col gap-3">
            <div className={`grid gap-3 ${role === "collector" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
              <div>
                <label className={labelClass}>Full Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Email Address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} />
              </div>
            </div>

            <div>
              <label className={labelClass}>Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className={`${inputClass} pr-14`}
                />
                <button
                  type="button"
                  onClick={togglePassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {role === "collector" && (
              <>
                <div className="flex items-center gap-3 my-1">
                  <div className="flex-1 h-px bg-slate-800" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Business Info</span>
                  <div className="flex-1 h-px bg-slate-800" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input type="text" placeholder="Business Name" value={businessName} onChange={(e) => setBusinessName(e.target.value)} className={inputClass} />
                  <input type="tel" placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
                </div>

                <input type="text" placeholder="Service Area" value={serviceArea} onChange={(e) => setServiceArea(e.target.value)} className={inputClass} />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} className={inputClass} required>
                    <option value="">Select vehicle type</option>
                    <option value="cycle">Cycle</option>
                    <option value="bike">Bike</option>
                    <option value="auto">Auto</option>
                    <option value="truck">Truck</option>
                  </select>
                  <input type="text" placeholder="Vehicle Number" value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} className={inputClass} />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-bold transition-all hover:shadow-lg hover:shadow-emerald-500/20 disabled:opacity-50"
            >
              {isSubmitting ? "Creating Account…" : "Create Account →"}
            </button>
          </form>

          <p className="text-sm text-slate-400 mt-4">
            Already have an account?{" "}
            <Link to="/" className="font-semibold text-emerald-400 hover:text-emerald-300 underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
