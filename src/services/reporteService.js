import api from "../api/axios";

export const getReporteHoy = async (fecha = null) => {
    const params = fecha ? `?fecha=${fecha}` : "";
    const response = await api.get(`pagos/reporte-hoy/${params}`);
    return response.data;
};
