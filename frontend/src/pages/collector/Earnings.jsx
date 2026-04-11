import { useAuthContext } from "../../context/AuthContext";
import { useTranslation } from "../../i18n/config.js";
import { Trophy, Star, TrendingUp, Wallet, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const CollectorEarnings = () => {
  const { user } = useAuthContext();
  const { t } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t("earnings.title")}</h1>
        <p className="text-gray-500 mt-2">{t("earnings.subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* EcoPoints summary */}
        <div className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-3xl p-8 text-white shadow-xl flex flex-col justify-between overflow-hidden relative group">
          <Trophy className="absolute top-4 right-4 text-white/20 w-32 h-32 rotate-12 group-hover:scale-110 transition-transform duration-500" />
          <div className="relative z-10">
            <h3 className="text-sm font-bold uppercase tracking-widest text-white/80 mb-2">
              {t("earnings.totalEcoPoints")}
            </h3>
            <p className="text-6xl font-extrabold mb-4">{user?.ecoPoints || 0}</p>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 inline-flex items-center gap-2">
              <Star className="text-yellow-200 fill-yellow-200 w-5 h-5" />
              <p className="text-sm font-medium">{t("earnings.pointsDesc")}</p>
            </div>
          </div>
        </div>

        {/* Current balance */}
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-6">
            <div className="w-14 h-14 bg-green-100 rounded-3xl flex items-center justify-center">
              <TrendingUp className="text-green-600 w-8 h-8" />
            </div>
            <Link 
              to="/collector/Collectorwallet" 
              className="text-green-600 font-bold text-sm flex items-center gap-1 hover:gap-2 transition-all p-2 hover:bg-green-50 rounded-xl"
            >
              View Wallet <ArrowRight size={16} />
            </Link>
          </div>
          
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-1">
              Current EcoCoins
            </h3>
            <p className="text-5xl font-extrabold text-gray-900 flex items-center gap-3">
              <img src="/LogoE.png" className="w-10 h-10 rounded-full" alt="coin" />
              {user?.ecoCoins || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-bold mb-2">Total Pickups</p>
          <p className="text-3xl font-bold text-gray-800">{user?.totalPickups || 0}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-bold mb-2">Best Day</p>
          <p className="text-3xl font-bold text-green-600">{user?.bestDayRecord || 0}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-bold mb-2">Today's Progress</p>
          <p className="text-3xl font-bold text-blue-600">{user?.todayPickups || 0}</p>
        </div>
      </div>

      {/* History placeholder */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-50 flex items-center gap-3">
          <Wallet className="text-gray-400 w-6 h-6" />
          <h2 className="text-xl font-bold text-gray-800">{t("earnings.redeemHistory")}</h2>
        </div>
        <div className="p-12 text-center text-gray-400 font-medium italic">
          {t("earnings.noHistory")}
        </div>
      </div>
    </div>
  );
};

export default CollectorEarnings;
