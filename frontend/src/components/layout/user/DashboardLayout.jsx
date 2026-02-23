import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import BottomPanel from "./BottomPanel";
import Sidebar from "../collector/Sidebar";
const DashboardLayout = () => {
  const location = useLocation();
  const isDashboard = location.pathname === "/dashboard";
  return (
    <div className="h-screen flex flex-col bg-gray-100">

      {/* Top Navbar */}
      <Navbar />

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <aside className="shrink-0">
          <Sidebar />
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto px-6 py-6 bg-gray-50">
          <Outlet />

          {/* Bottom Insight Panel */}
         {isDashboard && <BottomPanel />}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
