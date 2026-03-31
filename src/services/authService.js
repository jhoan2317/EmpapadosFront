import { auth } from "../firebase/config";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";

/**
 * Nota: Firebase Auth usa Email/Password por defecto. 
 * Si el usuario antes usaba un 'username', ahora deberá usar un correo.
 * Ejemplo: admin@empapados.com
 */

export const loginRequest = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    } catch (error) {
        console.error("Error en Firebase Login:", error);
        throw error;
    }
};

export const logoutRequest = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Error en Firebase Logout:", error);
        throw error;
    }
};
