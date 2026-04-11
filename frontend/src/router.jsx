import { createBrowserRouter } from "react-router-dom";
import { lazy, Suspense } from "react";
import Loader from "./components/common/Loader";

// Always-loaded (critical path)
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import DashboardLayout from "./components/layout/user/DashboardLayout";
import CollectorLayout from "./components/layout/collector/CollectorLayout";


// Lazy-loaded user pages
const Dashboard = lazy(() => import("./pages/dashboard/Dashboard"));
const PickupList = lazy(() => import("./pages/pickups/PickupList"));
const CreatePickup = lazy(() => import("./pages/pickups/CreatePickup"));
const PickupHistory = lazy(() => import("./pages/pickups/PickupHistory"));
const PickupDetails = lazy(() => import("./pages/pickups/PickupDetails"));
const Wallet = lazy(() => import("./pages/wallet/Wallet"));
const Profile = lazy(() => import("./pages/profile/Profile"));

// AI Decision Engine page
const AiDecision = lazy(() => import("./pages/AiDecision"));

// Lazy-loaded collector pages
const CollectorDashboard = lazy(() => import("./pages/collector/Dashboard"));
const PickupRequests = lazy(() => import("./pages/collector/PickupRequests"));
const PickupDetail = lazy(() => import("./pages/collector/PickupDetail"));
const VerifyOtp = lazy(() => import("./pages/collector/VerifyOtp"));
const AssignedPickups = lazy(() => import("./pages/collector/Assigned"));
const CompletedPickups = lazy(() => import("./pages/collector/Completed"));
const CollectorProfile = lazy(() => import("./pages/collector/Profile"));
const Availability = lazy(() => import("./pages/collector/Availability"));

// Suspense wrapper for lazy routes
const SuspenseWrapper = ({ children }) => (
  <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader text="Loading page..." /></div>}>
    {children}
  </Suspense>
);

export const router = createBrowserRouter([
  // ================= PUBLIC =================
  { path: "/", element: <Login /> },
  { path: "/register", element: <Register /> },

  { path: "/collector/verify-otp/:userId", element: <SuspenseWrapper><VerifyOtp /></SuspenseWrapper> },

  // ================= PROTECTED =================
  {
    element: <ProtectedRoute />,
    children: [
      // ---------- USER ----------
      {
        element: <DashboardLayout />,
        children: [
          { path: "/dashboard", element: <SuspenseWrapper><Dashboard /></SuspenseWrapper> },
          { path: "/pickups", element: <SuspenseWrapper><PickupList /></SuspenseWrapper> },
          { path: "/pickups/create", element: <SuspenseWrapper><CreatePickup /></SuspenseWrapper> },
          { path: "/pickups/history", element: <SuspenseWrapper><PickupHistory /></SuspenseWrapper> },
          { path: "/pickups/:id", element: <SuspenseWrapper><PickupDetails /></SuspenseWrapper> },
          { path: "/wallet", element: <SuspenseWrapper><Wallet /></SuspenseWrapper> },
          { path: "/profile", element: <SuspenseWrapper><Profile /></SuspenseWrapper> },
          { path: "/ai-decision", element: <SuspenseWrapper><AiDecision /></SuspenseWrapper> },
        ],
      },

      // ---------- COLLECTOR ----------
      {
        path: "/collector",
        element: <CollectorLayout />,
        children: [
          { path: "dashboard", element: <SuspenseWrapper><CollectorDashboard /></SuspenseWrapper> },
          { path: "requests", element: <SuspenseWrapper><PickupRequests /></SuspenseWrapper> },
          { path: "requests/:id", element: <SuspenseWrapper><PickupDetail /></SuspenseWrapper> },
          { path: "assigned", element: <SuspenseWrapper><AssignedPickups /></SuspenseWrapper> },
          { path: "completed", element: <SuspenseWrapper><CompletedPickups /></SuspenseWrapper> },
          { path: "profile", element: <SuspenseWrapper><CollectorProfile /></SuspenseWrapper> },
          { path: "availability", element: <SuspenseWrapper><Availability /></SuspenseWrapper> },
        ],
      },
    ],
  },
]);