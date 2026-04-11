import { useEffect, useState, memo } from "react";
import { getMyVouchers } from "../../services/voucher.service";

const STATUS_STYLES = {
  active: "bg-green-50 text-green-700 border-green-200",
  used: "bg-gray-100 text-gray-500 border-gray-200",
  expired: "bg-red-50 text-red-500 border-red-200",
};

const getVoucherStatus = (voucher) => {
  if (voucher.isUsed) return "used";
  if (new Date(voucher.expiresAt) < new Date()) return "expired";
  return "active";
};

const VoucherRow = memo(({ voucher }) => {
  const status = getVoucherStatus(voucher);

  const expiryDate = new Date(voucher.expiresAt).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const statusLabels = {
    active: "✅ Active",
    used: "✓ Used",
    expired: "Expired",
  };

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-xl border transition-opacity ${
        status === "active"
          ? "bg-white border-gray-100"
          : "bg-gray-50 border-gray-100 opacity-70"
      }`}
    >
      {/* Value badge */}
      <div
        className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm ${
          status === "active"
            ? "bg-green-100 text-green-700"
            : "bg-gray-200 text-gray-500"
        }`}
      >
        ₹{voucher.value}
      </div>

      {/* Code + meta */}
      <div className="flex-1 min-w-0">
        <p className="font-mono font-bold text-gray-800 tracking-wider text-base">
          {voucher.code}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          {voucher.ecoCoinsUsed} EcoCoins · Expires {expiryDate}
        </p>
      </div>

      {/* Status */}
      <span
        className={`self-start sm:self-center text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_STYLES[status]}`}
      >
        {statusLabels[status]}
      </span>
    </div>
  );
});
VoucherRow.displayName = "VoucherRow";

const MyVouchers = ({ refreshTrigger }) => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      setLoading(true);
      setError(false);
      try {
        const data = await getMyVouchers();
        if (!cancelled) setVouchers(data.vouchers ?? []);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetch();
    return () => { cancelled = true; };
  }, [refreshTrigger]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">My Vouchers</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Your redeemed voucher history
          </p>
        </div>
        {vouchers.length > 0 && (
          <span className="bg-green-50 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-green-200">
            {vouchers.filter((v) => getVoucherStatus(v) === "active").length} active
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((n) => (
            <div
              key={n}
              className="h-16 bg-gray-100 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : error ? (
        <p className="text-sm text-red-500 text-center py-6">
          Failed to load vouchers. Please refresh.
        </p>
      ) : vouchers.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-3xl mb-2">🎟️</p>
          <p className="text-gray-500 text-sm font-medium">No vouchers yet</p>
          <p className="text-gray-400 text-xs mt-1">
            Redeem EcoCoins above to generate your first voucher.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {vouchers.map((v) => (
            <VoucherRow key={v._id} voucher={v} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyVouchers;
