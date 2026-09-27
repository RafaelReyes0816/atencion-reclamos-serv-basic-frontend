import api from './client';

export const listarNormativas = async () => {
  const response = await api.get('/normativa/');
  return response.data;
};

export const normativaVigente = async (params) => {
  const response = await api.get('/normativa/vigente', { params });
  return response.data;
};

export const crearNormativa = async (data) => {
  const response = await api.post('/normativa/', data);
  return response.data;
};

export const actualizarNormativa = async (id, data) => {
  const response = await api.put(`/normativa/${id}`, data);
  return response.data;
};

export const eliminarNormativa = async (id) => {
  const response = await api.delete(`/normativa/${id}`);
  return response.data;
};

export const listarCuadrillas = async () => {
  const response = await api.get('/cuadrillas/');
  return response.data;
};

export const cuadrillasDisponibles = async (especialidad) => {
  const response = await api.get(`/cuadrillas/disponibles/${especialidad}`);
  return response.data;
};

export const crearCuadrilla = async (data) => {
  const response = await api.post('/cuadrillas/', data);
  return response.data;
};

export const actualizarCuadrilla = async (id, data) => {
  const response = await api.put(`/cuadrillas/${id}`, data);
  return response.data;
};

export const eliminarCuadrilla = async (id) => {
  const response = await api.delete(`/cuadrillas/${id}`);
  return response.data;
};

export const listarAreas = async () => {
  const response = await api.get('/areas-comerciales/');
  return response.data;
};

export const crearArea = async (data) => {
  const response = await api.post('/areas-comerciales/', data);
  return response.data;
};

export const actualizarArea = async (id, data) => {
  const response = await api.put(`/areas-comerciales/${id}`, data);
  return response.data;
};

export const eliminarArea = async (id) => {
  const response = await api.delete(`/areas-comerciales/${id}`);
  return response.data;
};
