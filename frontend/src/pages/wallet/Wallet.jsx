import { useEffect, useState, memo, useCallback } from "react";
import { getWalletDetails } from "../../services/wallet.service";
import Loader from "../../components/common/Loader";
import VoucherRedemption from "../../components/vouchers/VoucherRedemption";
import MyVouchers from "../../components/vouchers/MyVouchers";

const TxRow = memo(({ tx }) => (
  <div className="flex justify-between items-center py-3 sm:py-4">
    <div>
      <p className="font-medium text-gray-800 text-sm">
        {tx.reason || "Pickup Reward"}
      </p>
      <p className="text-xs text-gray-500 mt-0.5">
        {tx.created_at ? new Date(tx.created_at).toLocaleDateString() : "—"}
      </p>
    </div>
    <span
      className={`font-semibold text-sm ${
        tx.type === "DEBIT" ? "text-red-500" : "text-green-600"
      }`}
    >
      {tx.type === "DEBIT" ? "-" : "+"}
      {tx.amount}
    </span>
  </div>
));
TxRow.displayName = "TxRow";

const Wallet = () => {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Incremented after each successful redemption to trigger MyVouchers refresh
  const [voucherRefreshKey, setVoucherRefreshKey] = useState(0);

  const fetchWallet = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(false);
    try {
      const data = await getWalletDetails();
      setWallet(data);
    } catch (err) {
      console.error("Failed to load wallet", err);
      setError(true);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  /**
   * Called by VoucherRedemption after a successful redeem.
   * Optimistically deducts coins from local state, then silently re-fetches
   * for the ground truth balance.
   */
  const handleVoucherRedeemed = useCallback(
    (coinsSpent) => {
      setWallet((prev) =>
        prev
          ? { ...prev, balance: Math.max(0, (prev.balance ?? 0) - coinsSpent) }
          : prev
      );
      setVoucherRefreshKey((k) => k + 1);
      // Silent background re-fetch to sync with server
      setTimeout(() => fetchWallet(true), 800);
    },
    [fetchWallet]
  );

  if (loading) return <Loader text="Loading wallet..." />;

  if (error || !wallet) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <p className="text-red-500">Failed to load wallet. Please try again.</p>
      </div>
    );
  }

  const ecoCoins = wallet.balance ?? 0;
  const transactions = wallet.transactions ?? [];

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
        {/* Page title */}
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Wallet
          </h2>
          <p className="text-gray-500 mt-1 text-sm">
            Your EcoCoins balance, transaction history, and cash vouchers
          </p>
        </div>

        {/* Balance Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              Available Balance
            </p>
            <div className="flex items-baseline gap-2 mt-2">
              <span
                className="text-3xl sm:text-4xl font-bold text-gray-800 transition-all duration-500"
                key={ecoCoins} // triggers re-render animation when balance changes
              >
                {ecoCoins}
              </span>
              <span className="text-sm text-gray-500">EcoCoins</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              ≈ ₹{(ecoCoins / 10).toFixed(0)} in vouchers
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-sm text-gray-600">
              Earned from completed pickups
            </p>
            <p className="text-xs text-green-600 mt-1">🌱 Eco-friendly rewards</p>
          </div>
        </div>

        {/* About EcoCoins + Transaction History */}
        <div className="grid gap-5 sm:gap-6 md:grid-cols-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
            <h3 className="font-semibold text-lg text-gray-800 mb-3">
              About EcoCoins
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              EcoCoins are reward points you earn for recycling waste
              responsibly. They represent your contribution towards a cleaner
              and more sustainable environment.
            </p>
            <ul className="mt-4 text-sm text-gray-600 space-y-2">
              <li>✔ Credited after pickup completion</li>
              <li>✔ Redeem for cash vouchers (10 coins = ₹1)</li>
              <li>✔ Encourages sustainable habits</li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Transaction History
            </h3>
            {transactions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">No transactions yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  Complete a pickup to earn EcoCoins
                </p>
              </div>
            ) : (
              <div className="divide-y max-h-64 overflow-y-auto">
                {transactions.map((tx) => (
                  <TxRow key={tx.id} tx={tx} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Voucher Redemption ──────────────────────────────────── */}
        <VoucherRedemption
          walletBalance={ecoCoins}
          onVoucherRedeemed={handleVoucherRedeemed}
        />

        {/* ── My Vouchers ─────────────────────────────────────────── */}
        <MyVouchers refreshTrigger={voucherRefreshKey} />
      </div>
    </div>
  );
};

export default Wallet;
