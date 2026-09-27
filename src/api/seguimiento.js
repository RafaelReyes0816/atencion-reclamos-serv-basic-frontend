import api from './client';

export const obtenerOrdenPorReclamo = async (idReclamo) => {
  const response = await api.get(`/seguimiento/ordenes/reclamo/${idReclamo}`);
  return response.data;
};

export const listarOrdenes = async () => {
  const response = await api.get('/seguimiento/ordenes');
  return response.data;
};

export const crearOrden = async (data) => {
  const response = await api.post('/seguimiento/ordenes', data);
  return response.data;
};

export const actualizarOrden = async (id, data) => {
  const response = await api.put(`/seguimiento/ordenes/${id}`, data);
  return response.data;
};

export const eliminarOrden = async (id) => {
  const response = await api.delete(`/seguimiento/ordenes/${id}`);
  return response.data;
};

/** idOrden es el id de la orden de trabajo, no el del reclamo. */
export const listarAvances = async (idOrden) => {
  const response = await api.get(`/seguimiento/avances/${idOrden}`);
  return response.data;
};

export const crearAvance = async (data) => {
  const response = await api.post('/seguimiento/avances', data);
  return response.data;
};

export const obtenerDerivacion = async (idReclamo) => {
  const response = await api.get(`/seguimiento/derivaciones/reclamo/${idReclamo}`);
  return response.data;
};
