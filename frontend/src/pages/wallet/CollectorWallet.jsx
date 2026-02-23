import { useEffect, useState } from "react";
import Loader from "../../components/common/Loader";
import { getWalletDetails } from "../../services/wallet.service";

const REDEEM_THRESHOLD = 500;

const CollectorWallet = () => {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const data = await getWalletDetails(); // 🔴 REAL API
        setWallet(data);
      } catch (err) {
        console.error("Failed to load collector wallet", err);
      } finally {
        setLoading(false);
      }
    };

    fetchWallet();
  }, []);

  if (loading) return <Loader text="Loading EcoCoins..." />;

  const ecoCoins = wallet.balance || 0;
  const canRedeem = ecoCoins >= REDEEM_THRESHOLD;
  const remaining = REDEEM_THRESHOLD - ecoCoins;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* HEADER */}
        <div>
          <h2 className="text-3xl font-bold text-gray-800">
            Collector Wallet
          </h2>
          <p className="text-gray-500 mt-1">
            EcoCoins earned from completed pickups
          </p>
        </div>

        {/* BALANCE */}
        <div className="bg-white rounded-2xl border shadow-sm p-6 flex justify-between">
          <div>
            <p className="text-sm text-gray-500 uppercase">
              Available EcoCoins
            </p>
            <p className="text-4xl font-bold text-green-600 mt-2">
              {ecoCoins}
            </p>
          </div>

          <div className="text-right hidden sm:block">
            <p className="text-sm text-gray-600">
              Rewarded on pickup completion
            </p>
            <p className="text-xs text-green-600 mt-1">
              OTP verified only
            </p>
          </div>
        </div>

        {/* REDEEM STATUS */}
        <div
          className={`rounded-2xl border p-6 ${
            canRedeem
              ? "bg-green-50 border-green-200"
              : "bg-yellow-50 border-yellow-200"
          }`}
        >
          <h3 className="font-semibold text-lg">
            {canRedeem ? "🎉 Ready to Redeem" : "⏳ Redemption Locked"}
          </h3>

          <p className="text-sm text-gray-700 mt-1">
            {canRedeem
              ? "You have enough EcoCoins to redeem rewards."
              : `Earn ${remaining} more EcoCoins to unlock redemption.`}
          </p>

          <button
            disabled={!canRedeem}
            className={`mt-4 px-5 py-2 rounded-lg text-sm font-medium ${
              canRedeem
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Redeem EcoCoins
          </button>
        </div>

        {/* TRANSACTION HISTORY */}
        <div className="bg-white rounded-2xl border shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">
            EcoCoins History
          </h3>

          {!wallet.transactions || wallet.transactions.length === 0 ? (
            <p className="text-gray-500 text-sm">
              No EcoCoins transactions yet.
            </p>
          ) : (
            <div className="divide-y">
              {wallet.transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex justify-between items-center py-4"
                >
                  <div>
                    <p className="font-medium text-gray-800">
                      {tx.description || "Pickup Completed"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <span className="font-semibold text-green-600">
                    +{tx.amount}
                  </span>
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