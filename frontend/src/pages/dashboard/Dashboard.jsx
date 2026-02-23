import { useEffect, useState } from "react";
import { getMyPickups } from "../../services/pickup.service";

const LOAD_TO_KG = {
  small: 2,
  medium: 5,
  large: 10,
  bulk: 20,
};

const Dashboard = () => {
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getMyPickups();
        setPickups(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load pickups", err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const totalPickups = pickups.length;
  const completedPickups = pickups.filter(
    (p) => p.status?.toLowerCase() === "completed"
  ).length;
  const pendingPickups = pickups.filter(
    (p) => p.status?.toLowerCase() === "pending"
  ).length;

  const totalKgRecycled = pickups
    .filter((p) => p.status?.toLowerCase() === "completed")
    .reduce((sum, p) => sum + (LOAD_TO_KG[p.approxLoad] || 0), 0);

  const co2SavedKg = Math.round(totalKgRecycled * 0.5);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* HERO */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 leading-tight">
              Welcome to <span className="text-green-600">EcoLoop</span>
            </h1>
            <p className="text-gray-600 mt-3 max-w-xl">
              EcoLoop helps you recycle scrap responsibly, track pickups,
              and earn rewards for building a cleaner and greener future.
            </p>
            <div className="mt-6 flex gap-4">
              <div className="bg-green-50 text-green-700 px-4 py-2 rounded-lg text-sm font-medium">
                ♻ Sustainable Recycling
              </div>
              <div className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium">
                🌱 Earn EcoCoins
              </div>
            </div>
          </div>
          <div className="flex justify-center">
            <img
              src="/images/dashboard.png"
              alt="EcoLoop Dashboard"
              className="w-full max-w-md rounded-xl opacity-90"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* ECO IMPACT */}
        <div className="mb-10">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h3 className="text-2xl font-semibold text-gray-800">🌍 Your Eco Impact</h3>
              <p className="text-gray-600 mt-2">Based on your completed pickups, you've helped recycle:</p>
              <div className="mt-4">
                <span className="text-4xl font-bold text-green-600">{totalKgRecycled}</span>
                <span className="text-gray-600 ml-2 text-lg">kg of scrap</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                ≈ Saved around <span className="font-medium">{co2SavedKg} kg</span> of CO₂ emissions
              </p>
            </div>
            <div className="bg-green-50 border border-green-100 rounded-xl px-6 py-4 text-sm text-green-700 max-w-sm">
              ♻ Every completed pickup directly contributes to a cleaner environment and a more sustainable future.
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition">
            <p className="text-sm text-gray-500 mb-1">Total Pickups</p>
            <h3 className="text-3xl font-bold text-gray-800">{loading ? "..." : totalPickups}</h3>
            <p className="text-xs text-gray-400 mt-2">All pickup requests created</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition">
            <p className="text-sm text-gray-500 mb-1">Completed</p>
            <h3 className="text-3xl font-bold text-green-600">{loading ? "..." : completedPickups}</h3>
            <p className="text-xs text-gray-400 mt-2">Successfully recycled pickups</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition">
            <p className="text-sm text-gray-500 mb-1">Pending</p>
            <h3 className="text-3xl font-bold text-yellow-600">{loading ? "..." : pendingPickups}</h3>
            <p className="text-xs text-gray-400 mt-2">Awaiting pickup confirmation</p>
          </div>
        </div>

        {/* WHY IT MATTERS */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex flex-col lg:flex-row gap-8 items-center">
          <div className="flex-1">
            <h3 className="text-2xl font-semibold text-gray-800 mb-3">🌍 Why Your Pickup Matters</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Every pickup you schedule helps reduce landfill waste, improves recycling efficiency,
              and supports the collectors who keep the system running.
            </p>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>✔ Scrap is sorted and sent for responsible recycling</li>
              <li>✔ Collectors save time through scheduled pickups</li>
              <li>✔ Less waste ends up in landfills</li>
            </ul>
          </div>
          <div className="flex-1 flex justify-center">
            <img src="/images/recycle.png" alt="Recycling Impact" className="max-w-xs w-full" />
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;