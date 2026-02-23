import { createBrowserRouter } from "react-router-dom";

// Auth
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

// User layout & pages
import DashboardLayout from "./components/layout/user/DashboardLayout";
import Dashboard from "./pages/dashboard/Dashboard";
import PickupList from "./pages/pickups/PickupList";
import CreatePickup from "./pages/pickups/CreatePickup";
import Wallet from "./pages/wallet/Wallet";
import Profile from "./pages/profile/Profile";

// Collector layout & pages
import CollectorLayout from "./components/layout/collector/CollectorLayout";
import CollectorDashboard from "./pages/collector/Dashboard";
import PickupRequests from "./pages/collector/PickupRequests";
import PickupDetail from "./pages/collector/PickupDetail";
import VerifyOtp from "./pages/collector/VerifyOtp";
import AssignedPickups from "./pages/collector/Assigned";
import CompletedPickups from "./pages/collector/Completed";

// Guards
import ProtectedRoute from "./components/auth/ProtectedRoute";
import CollectorWallet from "./pages/wallet/CollectorWallet";

export const router = createBrowserRouter([
  // ================= PUBLIC =================
  { path: "/", element: <Login /> },
  { path: "/register", element: <Register /> },

  // ✅ OTP page MUST be public — collector is not logged in yet during verification
  { path: "/collector/verify-otp/:userId", element: <VerifyOtp /> },

  // ================= PROTECTED =================
  {
    element: <ProtectedRoute />,
    children: [
      // ---------- USER ----------
      {
        element: <DashboardLayout />,
        children: [
          { path: "/dashboard", element: <Dashboard /> },
          { path: "/pickups", element: <PickupList /> },
          { path: "/pickups/create", element: <CreatePickup /> },
          { path: "/wallet", element: <Wallet /> },
          { path: "/profile", element: <Profile /> },
        ],
      },

      // ---------- COLLECTOR ----------
      {
        path: "/collector",
        element: <CollectorLayout />,
        children: [
          { path: "dashboard", element: <CollectorDashboard /> },
          { path: "requests", element: <PickupRequests /> },
          { path: "requests/:id", element: <PickupDetail /> },
          { path: "assigned", element: <AssignedPickups /> },
          { path: "completed", element: <CompletedPickups /> },
          { path: "Collectorwallet", element: <CollectorWallet /> },
        ],
      },
    ],
  },
]);