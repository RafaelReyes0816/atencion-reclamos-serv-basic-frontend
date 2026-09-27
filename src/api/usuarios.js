import api from './client';

export const listarUsuarios = async () => {
  const response = await api.get('/usuarios/');
  return response.data;
};

export const obtenerUsuario = async (id) => {
  const response = await api.get(`/usuarios/${id}`);
  return response.data;
};

export const obtenerUsuarioPorDocumento = async (documento) => {
  const response = await api.get(`/usuarios/documento/${documento}`);
  return response.data;
};

export const crearUsuario = async (data) => {
  const response = await api.post('/usuarios/', data);
  return response.data;
};

export const actualizarUsuario = async (id, data) => {
  const response = await api.put(`/usuarios/${id}`, data);
  return response.data;
};

export const cambiarContrasena = async (id, { contrasena_actual, contrasena_nueva }) => {
  const response = await api.put(`/usuarios/${id}/contrasena`, {
    contrasena_actual,
    contrasena_nueva,
  });
  return response.data;
};

export const eliminarUsuario = async (id) => {
  const response = await api.delete(`/usuarios/${id}`);
  return response.data;
};
