import api from '../api/axios';

export const getOrders = async (date = null, page = 1, type = 'todas') => {
    // Usamos el endpoint registrado en el router del backend: /api/pedidos/pedidos/
    const params = new URLSearchParams();
    if (date) params.append('fecha', date);
    if (page) params.append('page', page);
    if (type && type !== 'todas') params.append('tipo', type);

    const response = await api.get(`pedidos/pedidos/?${params.toString()}`);
    return response.data;
};

export const getOrder = async (id) => {
    const response = await api.get(`pedidos/pedidos/${id}/`);
    return response.data;
};

export const updateOrderStatus = async (id, status) => {
    const response = await api.patch(`pedidos/pedidos/${id}/`, { estado: status });
    return response.data;
};

export const deleteOrder = async (id) => {
    const response = await api.delete(`pedidos/pedidos/${id}/`);
    return response.data;
};

export const createOrder = async (orderData) => {
    const response = await api.post('pedidos/pedidos/', orderData);
    return response.data;
};
