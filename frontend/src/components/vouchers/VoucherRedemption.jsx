import { useState } from "react";
import { redeemVoucher } from "../../services/voucher.service";
import VoucherSuccessModal from "./VoucherSuccessModal";

const VOUCHER_OPTIONS = [
  {
    value: 20,
    coins: 200,
    label: "Starter",
    gradient: "from-emerald-400 to-green-500",
    icon: "🌱",
    description: "Great for small purchases",
  },
  {
    value: 50,
    coins: 500,
    label: "Popular",
    gradient: "from-green-500 to-teal-500",
    icon: "♻️",
    badge: "Most Popular",
    description: "Perfect everyday value",
  },
  {
    value: 100,
    coins: 1000,
    label: "Premium",
    gradient: "from-teal-500 to-emerald-600",
    icon: "🌿",
    description: "Maximum savings",
  },
];

const VoucherRedemption = ({ walletBalance, onVoucherRedeemed }) => {
  const [loadingAmount, setLoadingAmount] = useState(null);
  const [successVoucher, setSuccessVoucher] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleRedeem = async (amount, requiredCoins) => {
    setErrorMsg("");

    if (walletBalance < requiredCoins) {
      setErrorMsg(
        `You need ${requiredCoins} EcoCoins for this voucher. You have ${walletBalance}.`
      );
      return;
    }

    try {
      setLoadingAmount(amount);
      const data = await redeemVoucher(amount);
      setSuccessVoucher(data.voucher);
      // Notify parent to refresh wallet balance
      if (onVoucherRedeemed) onVoucherRedeemed(requiredCoins);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        "Something went wrong. Please try again.";
      setErrorMsg(msg);
    } finally {
      setLoadingAmount(null);
    }
  };

  const handleModalClose = () => setSuccessVoucher(null);

  return (
    <>
      {/* Section Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-1">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              Convert EcoCoins to Cash Vouchers
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Redeem your earned coins for real cash vouchers
            </p>
          </div>
          {/* Rate pill */}
          <span className="inline-flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 text-xs font-medium px-3 py-1.5 rounded-full self-start sm:self-auto whitespace-nowrap">
            💡 10 EcoCoins = ₹1
          </span>
        </div>

        {/* Balance indicator */}
        <div className="mt-4 mb-5 flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3">
          <span className="text-sm text-gray-500">Your balance:</span>
          <span className="text-sm font-bold text-gray-800">
            {walletBalance ?? 0} EcoCoins
          </span>
          <span className="text-xs text-gray-400 ml-auto">
            = ₹{((walletBalance ?? 0) / 10).toFixed(0)} worth
          </span>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2">
            <span className="text-red-500 text-sm mt-0.5">⚠️</span>
            <p className="text-sm text-red-600">{errorMsg}</p>
          </div>
        )}

        {/* Voucher Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          {VOUCHER_OPTIONS.map((opt) => {
            const canAfford = (walletBalance ?? 0) >= opt.coins;
            const isLoading = loadingAmount === opt.value;

            return (
              <div
                key={opt.value}
                className={`relative rounded-2xl overflow-hidden border transition-all duration-200 ${
                  canAfford
                    ? "border-green-100 hover:shadow-md hover:-translate-y-0.5"
                    : "border-gray-100 opacity-60"
                }`}
              >
                {/* Top gradient bar */}
                <div className={`h-1.5 bg-gradient-to-r ${opt.gradient}`} />

                {/* Badge */}
                {opt.badge && (
                  <div className="absolute top-3 right-3">
                    <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                      {opt.badge}
                    </span>
                  </div>
                )}

                <div className="p-4">
                  <div className="text-2xl mb-2">{opt.icon}</div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-0.5">
                    {opt.label}
                  </p>
                  <p className="text-3xl font-extrabold text-gray-800">
                    ₹{opt.value}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5 mb-4">
                    {opt.description}
                  </p>

                  {/* Coin cost */}
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-4">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-yellow-400" />
                    <span>{opt.coins} EcoCoins required</span>
                  </div>

                  <button
                    onClick={() => handleRedeem(opt.value, opt.coins)}
                    disabled={!canAfford || isLoading}
                    className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                      canAfford
                        ? `bg-gradient-to-r ${opt.gradient} text-white hover:opacity-90 active:scale-95`
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg
                          className="animate-spin h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v8z"
                          />
                        </svg>
                        Processing…
                      </span>
                    ) : canAfford ? (
                      "Redeem Now"
                    ) : (
                      `Need ${opt.coins - (walletBalance ?? 0)} more coins`
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Success Modal */}
      {successVoucher && (
        <VoucherSuccessModal voucher={successVoucher} onClose={handleModalClose} />
      )}
    </>
  );
};

export default VoucherRedemption;
