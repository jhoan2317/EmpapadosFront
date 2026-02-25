import axios from "axios";
import Cookies from "js-cookie";

// Configuración de Axios para usar Cookies automáticamente
const api = axios.create({
    baseURL: "http://localhost:8000/api/",
    withCredentials: true,
});

// Variables para manejar la cola de peticiones fallidas durante el refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Interceptor de respuesta mejorado para diagnóstico
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Log para diagnosticar si es un error de red o de servidor
        if (!error.response) {
            console.error("Error de Red: No se puede conectar al servidor en localhost:8000");
            return Promise.reject(error);
        }

        // 1. Evitar bucles: Si la petición ya fue reintentada o no es 401, salir.
        if (error.response?.status !== 401 || originalRequest._retry) {
            return Promise.reject(error);
        }

        // 2. Manejar concurrencia: Si ya hay un refresh en curso, poner en cola.
        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            })
                .then(() => {
                    originalRequest._retry = true;
                    return api(originalRequest);
                })
                .catch((err) => Promise.reject(err));
        }

        // 3. Iniciar renovación única de sesión
        originalRequest._retry = true;
        isRefreshing = true;
        console.log("Sesión expirada. Renovando automáticamente con cookies...");

        try {
            // El endpoint de refresh ahora recibirá la cookie de refresh automáticamente
            await axios.post("http://localhost:8000/api/token/refresh/", {}, { withCredentials: true });

            processQueue(null);
            isRefreshing = false;

            console.log("Sesión restaurada con éxito.");
            return api(originalRequest);

        } catch (refreshError) {
            isRefreshing = false;
            processQueue(refreshError, null);

            // Si el refresh falla, la sesión es inválida
            console.error("Sesión expirada permanentemente.");
            localStorage.removeItem("username");
            window.location.href = "/home";

            return Promise.reject(refreshError);
        }
    }
);

export default api;
