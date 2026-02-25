import axios from "axios";

const API_URL = "http://localhost:8000/api";

export const loginRequest = async (username, password) => {
    const response = await axios.post(
        `${API_URL}/usuarios/admin-login/`,
        {
            username: username,
            password: password
        },
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
