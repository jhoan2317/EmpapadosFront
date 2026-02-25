import api from '../api/axios';

export const getCategories = async () => {
    const response = await api.get('productos/categorias/');
    return response.data;
};

export const getProducts = async (page = null) => {
    const url = page ? `productos/productos/?page=${page}` : 'productos/productos/?no_pagination=true';
    const response = await api.get(url);
    return response.data;
};

export const getProduct = async (id) => {
    const response = await api.get(`productos/productos/${id}/`);
    return response.data;
};

export const createProduct = async (productData) => {
    const response = await api.post('productos/productos/', productData);
    return response.data;
};

export const updateProduct = async (id, productData) => {
    const response = await api.put(`productos/productos/${id}/`, productData);
    return response.data;
};

export const deleteProduct = async (id) => {
    const response = await api.delete(`productos/productos/${id}/`);
    return response.data;
};
