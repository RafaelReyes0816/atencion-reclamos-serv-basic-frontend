import api from './client';

export const obtenerDashboard = async () => {
  const response = await api.get('/dashboard/');
  return response.data;
};

export const listarReportes = async () => {
  const response = await api.get('/reportes/');
  return response.data;
};

export const obtenerReporte = async (id) => {
  const response = await api.get(`/reportes/${id}`);
  return response.data;
};

export const generarReporteDiario = async () => {
  const response = await api.post('/reportes/diario');
  return response.data;
};

export const generarReporteMensual = async (periodo) => {
  // Sin periodo el backend usa el mes anterior; se envia solo si se eligio uno.
  const response = periodo
    ? await api.post('/reportes/mensual', null, { params: { periodo } })
    : await api.post('/reportes/mensual');
  return response.data;
};

/** Descarga el .xlsx. Devuelve un Blob, no JSON. */
export const descargarReporteExcel = async (id) => {
  const response = await api.get(`/reportes/${id}/excel`, { responseType: 'blob' });
  return response.data;
};

export const verificarVencimientos = async () => {
  const response = await api.post('/plazos/verificar-vencimientos');
  return response.data;
};

export const verificarVencidos = async () => {
  const response = await api.post('/plazos/verificar-vencidos');
  return response.data;
};

export const verificarCriticos = async () => {
  const response = await api.post('/plazos/verificar-criticos');
  return response.data;
};
