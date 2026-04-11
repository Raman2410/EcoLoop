import { memo, useState, useCallback } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import BottomPanel from "./BottomPanel";
import Sidebar from "../collector/Sidebar";

const DashboardLayout = memo(() => {
  const location = useLocation();
  const isDashboard = location.pathname === "/dashboard";
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = useCallback(() => setSidebarOpen((v) => !v), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <Navbar onMenuClick={toggleSidebar} />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/40 lg:hidden"
            onClick={closeSidebar}
          />
        )}

        {/* Sidebar — hidden on mobile, slides in */}
        <aside
          className={`
            fixed lg:static inset-y-0 left-0 z-30
            transform transition-transform duration-200 ease-in-out
            lg:transform-none lg:translate-x-0
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
            shrink-0 pt-16 lg:pt-0
          `}
        >
          <Sidebar onLinkClick={closeSidebar} />
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 bg-gray-50">
          <Outlet />
          {isDashboard && <BottomPanel />}
        </main>
      </div>
    </div>
  );
});

DashboardLayout.displayName = "DashboardLayout";
export default DashboardLayout;
