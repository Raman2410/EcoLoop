import { useEffect, useState } from "react";
import { useTranslation } from "../../i18n/config.js";
import Loader from "../../components/common/Loader";
import { getWalletDetails } from "../../services/wallet.service";

const REDEEM_THRESHOLD = 500;

const CollectorWallet = () => {
  const { t } = useTranslation();
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchWallet = async () => {
      try {
        const data = await getWalletDetails();
        if (!cancelled) setWallet(data);
      } catch (err) {
        console.error("Failed to load collector wallet", err);
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchWallet();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <Loader text={t("wallet.loadingWallet")} />;

  if (error || !wallet) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <p className="text-red-500">{t("wallet.loadError")}</p>
      </div>
    );
  }

  const ecoCoins  = wallet.balance || 0;
  const canRedeem = ecoCoins >= REDEEM_THRESHOLD;
  const remaining = REDEEM_THRESHOLD - ecoCoins;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">{t("wallet.title")}</h2>
          <p className="text-gray-500 mt-1 text-sm">{t("wallet.subtitle")}</p>
        </div>

        {/* Balance */}
        <div className="bg-white rounded-2xl border shadow-sm p-5 sm:p-6 flex flex-col sm:flex-row sm:justify-between gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">{t("wallet.availableEcoCoins")}</p>
            <p className="text-3xl sm:text-4xl font-bold text-green-600 mt-2">{ecoCoins}</p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-sm text-gray-600">{t("wallet.rewardedOn")}</p>
            <p className="text-xs text-green-600 mt-1">{t("wallet.otpVerifiedOnly")}</p>
          </div>
        </div>

        {/* Redeem status */}
        <div className={`rounded-2xl border p-5 sm:p-6 ${canRedeem ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"}`}>
          <h3 className="font-semibold text-base sm:text-lg">
            {canRedeem ? t("wallet.readyToRedeem") : t("wallet.redemptionLocked")}
          </h3>
          <p className="text-sm text-gray-700 mt-1">
            {canRedeem
              ? t("wallet.canRedeemMsg")
              : t("wallet.earnMoreMsg", { remaining })}
          </p>
          <button
            disabled={!canRedeem}
            className={`mt-4 px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              canRedeem ? "bg-green-600 text-white hover:bg-green-700" : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {t("wallet.redeemButton")}
          </button>
        </div>

        {/* Transaction history */}
        <div className="bg-white rounded-2xl border shadow-sm p-5 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold mb-4">{t("wallet.historyTitle")}</h3>
          {!wallet.transactions || wallet.transactions.length === 0 ? (
            <p className="text-gray-500 text-sm">{t("wallet.noTransactions")}</p>
          ) : (
            <div className="divide-y">
              {wallet.transactions.map((tx) => (
                <div key={tx.id} className="flex justify-between items-center py-3 sm:py-4">
                  <div>
                    <p className="font-medium text-gray-800 text-sm">
                      {tx.description || t("wallet.pickupCompleted")}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="font-semibold text-green-600 text-sm">+{tx.amount}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CollectorWallet;
