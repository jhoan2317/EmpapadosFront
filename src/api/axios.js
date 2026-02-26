import axios from "axios";
import Cookies from "js-cookie";

const API = import.meta.env.VITE_API_URL;

// Axios
const api = axios.create({
    baseURL: `${API}/api/`,
    withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (error) prom.reject(error);
        else prom.resolve(token);
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (!error.response) {
            console.error("Error de red contra backend:", API);
            return Promise.reject(error);
        }

        if (error.response?.status !== 401 || originalRequest._retry) {
            return Promise.reject(error);
        }

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

        originalRequest._retry = true;
        isRefreshing = true;

        try {
            await axios.post(`${API}/api/token/refresh/`, {}, { withCredentials: true });

            processQueue(null);
            isRefreshing = false;

            return api(originalRequest);

        } catch (refreshError) {
            isRefreshing = false;
            processQueue(refreshError, null);

            localStorage.removeItem("username");
            window.location.href = "/home";

            return Promise.reject(refreshError);
        }
    }
);

export default api;
