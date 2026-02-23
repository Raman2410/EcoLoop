import { useEffect, useState } from "react";
import { getWalletDetails } from "../../services/wallet.service";
import Loader from "../../components/common/Loader";

const Wallet = () => {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const data = await getWalletDetails();
        setWallet(data);
      } catch (err) {
        console.error("Failed to load wallet", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchWallet();
  }, []);

  if (loading) return <Loader text="Loading wallet..." />;

  if (error || !wallet) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <p className="text-red-500">Failed to load wallet. Please try again.</p>
      </div>
    );
  }

  // ✅ API returns { balance, transactions } — not ecoCoins/history
  const ecoCoins = wallet.balance ?? 0;
  const transactions = wallet.transactions ?? [];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* HEADER */}
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Wallet</h2>
          <p className="text-gray-500 mt-1">Your EcoCoins balance and transaction history</p>
        </div>

        {/* BALANCE */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 uppercase tracking-wide">Available Balance</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-4xl font-bold text-gray-800">{ecoCoins}</span>
              <span className="text-sm text-gray-500">EcoCoins</span>
            </div>
          </div>
          <div className="hidden sm:block text-right">
            <p className="text-sm text-gray-600">Earned from completed pickups</p>
            <p className="text-xs text-green-600 mt-1">🌱 Eco-friendly rewards</p>
          </div>
        </div>

        {/* INFO + HISTORY */}
        <div className="grid gap-6 md:grid-cols-2">

          {/* About */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-semibold text-lg text-gray-800 mb-3">About EcoCoins</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              EcoCoins are reward points you earn for recycling waste responsibly.
              They represent your contribution towards a cleaner and more sustainable environment.
            </p>
            <ul className="mt-4 text-sm text-gray-600 space-y-2">
              <li>✔ Credited after pickup completion</li>
              <li>✔ Can be redeemed for future rewards</li>
              <li>✔ Encourages sustainable habits</li>
            </ul>
          </div>

          {/* Transaction History */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Transaction History</h3>

            {transactions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No transactions yet</p>
                <p className="text-sm text-gray-400 mt-1">Complete a pickup to earn EcoCoins</p>
              </div>
            ) : (
              <div className="divide-y">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex justify-between items-center py-4">
                    <div>
                      <p className="font-medium text-gray-800">
                        {tx.reason || "Pickup Reward"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {tx.created_at ? new Date(tx.created_at).toLocaleDateString() : "—"}
                      </p>
                    </div>
                    <span className="font-semibold text-green-600">+{tx.amount}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Wallet;