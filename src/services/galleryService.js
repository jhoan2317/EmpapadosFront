import api from '../api/axios';

export const getImages = async () => {
    const response = await api.get('galeria/imagenes/');
    return response.data;
};

export const uploadImage = async (formData) => {
    const response = await api.post('galeria/imagenes/', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

export const deleteImage = async (id) => {
    const response = await api.delete(`galeria/imagenes/${id}/`);
    return response.data;
};
