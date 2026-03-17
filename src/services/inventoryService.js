import api from '../api/axios';

export const getInventory = async (page = 1) => {
    const url = page === null
        ? 'inventario/inventario/?no_pagination=true'
        : `inventario/inventario/?page=${page}`;
    const response = await api.get(url);
    return response.data;
};

export const getInventoryItem = async (id) => {
    const response = await api.get(`inventario/inventario/${id}/`);
    return response.data;
};

export const updateInventory = async (id, data) => {
    const response = await api.patch(`inventario/inventario/${id}/`, data);
    return response.data;
};

export const createInventoryEntry = async (data) => {
    const response = await api.post('inventario/inventario/', data);
    return response.data;
};

export const deleteInventoryEntry = async (id) => {
    const response = await api.delete(`inventario/inventario/${id}/`);
    return response.data;
};

export const registerInventoryExit = async (data) => {
    const response = await api.post('inventario/inventario/registrar_salida/', data);
    return response.data;
};

export const getMovements = async (page = 1) => {
    const response = await api.get(`inventario/movimientos/?page=${page}`);
    return response.data;
};

export const getInventorySummary = async () => {
    const response = await api.get('inventario/inventario/resumen_movimientos/');
    return response.data;
};

export const registerTasting = async (data) => {
    const response = await api.post('inventario/inventario/registrar_degustacion/', data);
    return response.data;
};
