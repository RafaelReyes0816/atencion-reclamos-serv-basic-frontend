import axios from 'axios';

const CLAVE_TOKEN = 'token';
const CLAVE_ERROR = 'error-global';

const api = axios.create({
  headers: { 'Content-Type': 'application/json' },
});

/**
 * 401 = token ausente, vencido o credenciales invalidas -> hay que volver a loguearse.
 * 403 = token valido pero el rol no alcanza -> NO se debe cerrar sesion.
 */
const MENSAJES = {
  400: 'La operacion no se pudo completar: ya existe un registro con esos datos.',
  401: 'Sesion expirada. Inicia sesion nuevamente.',
  403: 'No tienes permisos para realizar esta accion.',
  404: 'El recurso solicitado no existe.',
  409: 'No se puede completar la operacion porque el recurso esta en un estado incompatible.',
  422: 'Los datos enviados no son validos. Revisa los campos.',
  500: 'Error interno del servidor. Intenta mas tarde.',
};

const detalleDe = (error) => {
  const data = error.response?.data;
  if (typeof data?.detail === 'string') return data.detail;
  if (Array.isArray(data?.detail)) {
    return data.detail
      .map((d) => `${(d.loc || []).slice(1).join('.')}: ${d.msg}`)
      .join(' | ');
  }
  return MENSAJES[error.response?.status] || 'Ocurrio un error inesperado.';
};

export const ultimoError = () => localStorage.getItem(CLAVE_ERROR);
export const limpiarError = () => localStorage.removeItem(CLAVE_ERROR);

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(CLAVE_TOKEN);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      localStorage.removeItem(CLAVE_TOKEN);
      localStorage.removeItem('sesion');
      const mensaje = MENSAJES[401];
      localStorage.setItem(CLAVE_ERROR, mensaje);
      if (!window.location.pathname.startsWith('/ingresar')) {
        window.location.href = '/ingresar';
      }
    } else if (status) {
      localStorage.setItem(CLAVE_ERROR, detalleDe(error));
    }

    error.mensaje = detalleDe(error);
    return Promise.reject(error);
  }
);

export default api;
