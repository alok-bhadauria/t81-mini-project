import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";


export function ProtectedRoute({ children }) {
    const { isLoggedIn, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return null;
    }

    if (!isLoggedIn) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
}
