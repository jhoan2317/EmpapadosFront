import { createContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginRequest, logoutRequest } from "../services/authService";
import Cookies from "js-cookie";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
    const navigate = useNavigate();
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem("username");
        return savedUser ? { username: savedUser } : null;
    });

    async function login(username, password) {
        try {
            await loginRequest(username, password);

            // Las cookies (access_token y refresh_token) ahora las gestiona 
            // automáticamente el backend como HTTPOnly por seguridad.
            // Ya no las guardamos manualmente aquí para evitar duplicados.

            // El nombre de usuario lo mantenemos en localStorage (fuera de las cookies)
            localStorage.setItem("username", username);

            setUser({ username });
            navigate("/dashboard");
        } catch (error) {
            console.error("Error en login:", error);
            setUser(null);
            throw error;
        }
    }

    async function logout() {
        try {
            await logoutRequest();
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
        } finally {
            // Limpiamos tod@ en el frontend independientemente del resultado del backend
            Cookies.remove("access_token", { path: '/' });
            Cookies.remove("refresh_token", { path: '/' });
            Cookies.remove("accessToken", { path: '/' });
            Cookies.remove("refreshToken", { path: '/' });
            localStorage.removeItem("username");
            setUser(null);
            // Usamos window.location.href en lugar de navigate para forzar un refresh 
            // que limpie las cookies de la consola inmediatamente.
            window.location.href = "/home";
        }
    }

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
