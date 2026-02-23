import { Navigate, Outlet } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";

const ProtectedRoute = () => {
  const { user, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Checking authentication...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
