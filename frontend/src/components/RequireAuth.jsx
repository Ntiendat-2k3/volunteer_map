import PropTypes from "prop-types";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const loc = useLocation();

  if (loading) return null;
  if (!user)
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  return children;
}

RequireAuth.propTypes = {
  children: PropTypes.node.isRequired,
};
