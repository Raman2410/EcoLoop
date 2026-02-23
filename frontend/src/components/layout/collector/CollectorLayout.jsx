import { Outlet } from "react-router-dom";
import CollectorSidebar from "./CollectorSidebar";
import CollectorNavbar from "./collectorNavbar";
const CollectorLayout = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      
      {/* FULL WIDTH NAVBAR */}
      <CollectorNavbar />

      {/* BODY SECTION */}
      <div className="flex">
        
        {/* SIDEBAR */}
        <CollectorSidebar />

        {/* MAIN CONTENT */}
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>

      </div>
    </div>
  );
};

export default CollectorLayout;