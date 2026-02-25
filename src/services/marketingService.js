import api from '../api/axios';

export const getHeroSections = async () => {
    const response = await api.get('marketing/hero/');
    return response.data;
};

export const getFeatures = async () => {
    const response = await api.get('marketing/features/');
    return response.data;
};

export const getTestimonials = async () => {
    const response = await api.get('marketing/testimonials/');
    return response.data;
};

export const getGlobalConfig = async () => {
    const response = await api.get('marketing/config/');
    return response.data;
};

// Admin functions
export const createHero = async (data) => {
    const response = await api.post('marketing/hero/', data);
    return response.data;
};

export const updateHero = async (id, data) => {
    const response = await api.put(`marketing/hero/${id}/`, data);
    return response.data;
};

export const deleteHero = async (id) => {
    const response = await api.delete(`marketing/hero/${id}/`);
    return response.data;
};

// Feature functions
export const createFeature = async (data) => {
    const response = await api.post('marketing/features/', data);
    return response.data;
};

export const updateFeature = async (id, data) => {
    const response = await api.put(`marketing/features/${id}/`, data);
    return response.data;
};

export const deleteFeature = async (id) => {
    const response = await api.delete(`marketing/features/${id}/`);
    return response.data;
};

// Testimonial functions
export const createTestimonial = async (data) => {
    const response = await api.post('marketing/testimonials/', data);
    return response.data;
};

export const updateTestimonial = async (id, data) => {
    const response = await api.put(`marketing/testimonials/${id}/`, data);
    return response.data;
};

export const deleteTestimonial = async (id) => {
    const response = await api.delete(`marketing/testimonials/${id}/`);
    return response.data;
};

export const upsertConfig = async (id, data) => {
    if (id) {
        return (await api.put(`marketing/config/${id}/`, data)).data;
    }
    return (await api.post('marketing/config/', data)).data;
};
