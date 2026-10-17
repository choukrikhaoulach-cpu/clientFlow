import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "./LoadingSpinner";

export default function ProtectedRoute({ children }) {
  const { user, loading, token } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!token || !user) return <Navigate to="/login" replace />;

  return children;
}
