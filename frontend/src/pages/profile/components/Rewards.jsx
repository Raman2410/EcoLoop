import { memo, useEffect, useState } from "react";
import { Gift, Lock } from "lucide-react";
import axiosInstance from "../../../api/axiosInstance.js";
import Loader from "../../../components/common/Loader.jsx";

const ActivityRow = memo(({ item }) => (
  <div className="flex justify-between bg-white p-3 rounded-lg border text-sm">
    <span className="text-gray-700">{item.description}</span>
    <span className={`font-medium ${item.coins > 0 ? "text-green-600" : "text-red-500"}`}>
      {item.coins > 0 ? "+" : ""}{item.coins}
    </span>
  </div>
));
ActivityRow.displayName = "ActivityRow";

const Rewards = memo(() => {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchWallet = async () => {
      try {
        const res = await axiosInstance.get("/wallet");
        if (!cancelled) setWallet(res.data);
      } catch {
        if (!cancelled) setWallet(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchWallet();
    return () => { cancelled = true; };
  }, []);

  const coins = wallet?.coins || 0;
  const history = wallet?.history || [];

  if (loading) return <Loader text="Loading rewards..." />;

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Rewards & Coupons</h2>

      {/* Coins card */}
      <div className="bg-gradient-to-r from-green-600 to-green-500 text-white rounded-2xl p-6 mb-6 shadow">
        <p className="text-sm opacity-90">Your EcoCoins</p>
        <p className="text-4xl font-bold mt-1">{coins}</p>
        <p className="text-xs opacity-80 mt-2">Earn coins by completing pickups responsibly 🌱</p>
      </div>

      {/* Coupons */}
      <div className="mb-6">
        <h3 className="font-medium mb-3 text-sm">Available Coupons</h3>
        <div className="bg-white border rounded-xl p-6 text-center text-gray-500">
          <Gift className="mx-auto mb-2 opacity-50" size={24} />
          <p className="font-medium text-sm">No coupons available</p>
          <p className="text-xs mt-1 text-gray-400">Coupons unlock once you earn EcoCoins</p>
        </div>
      </div>

      {/* Activity */}
      <div>
        <h3 className="font-medium mb-3 text-sm">Activity</h3>
        {history.length === 0 ? (
          <div className="bg-white border rounded-xl p-6 text-center text-gray-500">
            <Lock className="mx-auto mb-2 opacity-50" size={24} />
            <p className="font-medium text-sm">No activity yet</p>
            <p className="text-xs mt-1 text-gray-400">Your reward history will appear here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((item) => <ActivityRow key={item._id} item={item} />)}
          </div>
        )}
      </div>
    </div>
  );
});

Rewards.displayName = "Rewards";
export default Rewards;
