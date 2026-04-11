import { memo, useState, useCallback } from "react";
import { Outlet } from "react-router-dom";
import CollectorSidebar from "./CollectorSidebar";
import CollectorNavbar from "./CollectorNavbar";

const CollectorLayout = memo(() => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = useCallback(() => setSidebarOpen((v) => !v), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <CollectorNavbar onMenuClick={toggleSidebar} />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/40 lg:hidden"
            onClick={closeSidebar}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
            fixed lg:static inset-y-0 left-0 z-30
            transform transition-transform duration-200 ease-in-out
            lg:transform-none lg:translate-x-0
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
            shrink-0 pt-16 lg:pt-0
          `}
        >
          <CollectorSidebar onLinkClick={closeSidebar} />
        </aside>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
});

CollectorLayout.displayName = "CollectorLayout";
export default CollectorLayout;
