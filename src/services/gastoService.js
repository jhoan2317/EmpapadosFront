import api from "../api/axios";

export const getGastos = async (page = 1, fecha = null) => {
  const params = new URLSearchParams({ page });
  if (fecha) params.append("fecha", fecha);
  const res = await api.get(`pagos/gastos/?${params.toString()}`);
  return res.data;
};

export const getGasto = async (id) => {
  const res = await api.get(`pagos/gastos/${id}/`);
  return res.data;
};

export const createGasto = async (data) => {
  const res = await api.post("pagos/gastos/", data);
  return res.data;
};

export const updateGasto = async (id, data) => {
  const res = await api.put(`pagos/gastos/${id}/`, data);
  return res.data;
};

export const deleteGasto = async (id) => {
  const res = await api.delete(`pagos/gastos/${id}/`);
  return res.data;
};

