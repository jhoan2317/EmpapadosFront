import { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loginRequest, logoutRequest } from "../services/authService";
import { auth } from "../firebase/config";
import { onAuthStateChanged } from "firebase/auth";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                setUser({
                    email: firebaseUser.email,
                    uid: firebaseUser.uid,
                    displayName: firebaseUser.displayName
                });
                localStorage.setItem("username", firebaseUser.email);
            } else {
                setUser(null);
                localStorage.removeItem("username");
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    async function login(email, password) {
        try {
            await loginRequest(email, password);
            // El estado del usuario se actualizará a través de onAuthStateChanged
            navigate("/dashboard");
        } catch (error) {
            console.error("Error en login:", error);
            throw error;
        }
    }

    async function logout() {
        try {
            await logoutRequest();
            window.location.href = "/home";
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
        }
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}
