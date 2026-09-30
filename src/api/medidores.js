import api from './client';

/** El backend siempre devuelve listas; si no llega lista, se devuelve vacia. */
const comoLista = (datos) => (Array.isArray(datos) ? datos : []);

export const listarMedidores = async (idUsuario) => {
  const params = idUsuario ? { id_usuario: idUsuario } : {};
  const response = await api.get('/medidores/', { params });
  return comoLista(response.data);
};

/** Solo roles internos: ciudadanos con sus medidores, para registrar por ventanilla. */
export const listarMedidoresDeCiudadanos = async () => {
  const response = await api.get('/medidores/ciudadanos');
  return comoLista(response.data);
};

export const obtenerMedidor = async (id) => {
  const response = await api.get(`/medidores/${id}`);
  return response.data;
};

export const crearMedidor = async (data) => {
  const response = await api.post('/medidores/', data);
  return response.data;
};

export const actualizarMedidor = async (id, data) => {
  const response = await api.put(`/medidores/${id}`, data);
  return response.data;
};

export const eliminarMedidor = async (id) => {
  const response = await api.delete(`/medidores/${id}`);
  return response.data;
};
