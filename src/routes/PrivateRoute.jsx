import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function PrivateRoute({ children }) {
    const { user, loading } = useContext(AuthContext);

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#111', color: '#fff' }}>Cargando sesión...</div>;
    }

    if (!user) {
        return <Navigate to="/login" />;
    }

    return children;
}
