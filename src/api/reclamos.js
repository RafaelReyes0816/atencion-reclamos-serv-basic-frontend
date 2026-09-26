import api from '../api/client';

export const listarReclamos = async () => {
  const response = await api.get('/reclamos');
  return response.data;
};

export const obtenerReclamo = async (id) => {
  const response = await api.get(`/reclamos/${id}`);
  return response.data;
};

export const crearReclamo = async (data) => {
  const response = await api.post('/reclamos', data);
  return response.data;
};

export const actualizarReclamo = async (id, data) => {
  const response = await api.put(`/reclamos/${id}`, data);
  return response.data;
};

export const clasificarReclamo = async (id, clasificacion) => {
  const response = await api.put(`/reclamos/${id}/clasificar`, clasificacion);
  return response.data;
};

export const asignarPlazo = async (id, plazo) => {
  const response = await api.put(`/reclamos/${id}/asignar-plazo`, plazo);
  return response.data;
};

export const resolverReclamo = async (id, resolucion) => {
  const response = await api.put(`/reclamos/${id}/resolver`, resolucion);
  return response.data;
};

export const cerrarReclamo = async (id, cierre) => {
  const response = await api.put(`/reclamos/${id}/cerrar`, cierre);
  return response.data;
};

export const obtenerComprobante = async (id) => {
  const response = await api.get(`/reclamos/${id}/comprobante`);
  return response.data;
};

export const consultarEstado = async (idODoc) => {
  const response = await api.get(`/reclamos/estado/${idODoc}`);
  return response.data;
};
