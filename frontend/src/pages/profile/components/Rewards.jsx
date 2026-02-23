import { Gift, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import axiosInstance from "../../../api/axiosInstance.js";

const Rewards = () => {
  const [wallet, setWallet] = useState(null);

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const res = await axiosInstance.get("/wallet");
        setWallet(res.data); // backend-driven
      } catch (err) {
        // backend not ready or wallet empty
        setWallet(null);
      }
    };

    fetchWallet();
  }, []);

  // ✅ BACKEND → UI MAPPING (THIS is the answer to your question)
  const coins = wallet?.coins || 0;
  const history = wallet?.history || [];

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Rewards & Coupons</h2>

      {/* Coins Card */}
      <div className="bg-gradient-to-r from-green-600 to-green-500 text-white rounded-2xl p-6 mb-6 shadow">
        <p className="text-sm opacity-90">Your EcoCoins</p>
        <p className="text-4xl font-bold mt-1">{coins}</p>

        <p className="text-xs opacity-80 mt-2">
          Earn coins by completing pickups responsibly 🌱
        </p>
      </div>

      {/* Coupons Section */}
      <div className="mb-8">
        <h3 className="font-medium mb-3">Available Coupons</h3>

        <div className="bg-white border rounded-xl p-6 text-center text-gray-500">
          <Gift className="mx-auto mb-2 opacity-50" />
          <p className="font-medium">No coupons available</p>
          <p className="text-sm">
            Coupons unlock once you earn EcoCoins
          </p>
        </div>
      </div>

      {/* Activity Section */}
      <div>
        <h3 className="font-medium mb-3">Activity</h3>

        {history.length === 0 ? (
          <div className="bg-white border rounded-xl p-6 text-center text-gray-500">
            <Lock className="mx-auto mb-2 opacity-50" />
            <p className="font-medium">No activity yet</p>
            <p className="text-sm">
              Your reward history will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((item) => (
              <div
                key={item._id}
                className="flex justify-between bg-white p-3 rounded-lg border"
              >
                <span>{item.description}</span>
                <span
                  className={`font-medium ${
                    item.coins > 0 ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {item.coins > 0 ? "+" : ""}
                  {item.coins}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Rewards;
