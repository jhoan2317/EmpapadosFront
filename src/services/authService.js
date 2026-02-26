import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const loginRequest = async (username, password) => {
    const response = await axios.post(
        `${API_URL}/api/usuarios/admin-login/`,
        {
            username,
            password
        },
        {
            withCredentials: true
        }
    );

    return response.data;
};

export const logoutRequest = async () => {
    await axios.post(
        `${API_URL}/api/usuarios/logout/`,
        {},
        {
            withCredentials: true
        }
    );

    return response.data;
};

export const logoutRequest = async () => {
    await axios.post(
        `${API_URL}/usuarios/logout/`,
        {},
        {
            withCredentials: true
        }
    );
};
