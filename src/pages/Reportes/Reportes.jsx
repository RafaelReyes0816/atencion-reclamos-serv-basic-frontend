import { useState, useEffect } from 'react';
import api from '../../api/client';

const Reportes = () => {
  const [reportes, setReportes] = useState([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    cargarReportes();
  }, []);

  const cargarReportes = async () => {
    try {
      const response = await api.get('/reportes');
      setReportes(response.data);
    } catch (error) {
      console.error('Error al cargar reportes:', error);
    }
  };

  const generarDiario = async () => {
    setCargando(true);
    try {
      await api.post('/reportes/diario');
      cargarReportes();
    } catch (error) {
      console.error('Error al generar reporte diario:', error);
    }
    setCargando(false);
  };

  const generarMensual = async () => {
    setCargando(true);
    try {
      await api.post('/reportes/mensual');
      cargarReportes();
    } catch (error) {
      console.error('Error al generar reporte mensual:', error);
    }
    setCargando(false);
  };

  return (
    <div className="reportes">
      <h1>Reportes</h1>
      <div className="acciones">
        <button onClick={generarDiario} disabled={cargando}>
          {cargando ? 'Generando...' : 'Generar Reporte Diario'}
        </button>
        <button onClick={generarMensual} disabled={cargando}>
          {cargando ? 'Generando...' : 'Generar Reporte Mensual'}
        </button>
      </div>
      <h2>Reportes Generados</h2>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Tipo</th>
            <th>Período</th>
            <th>Fecha Generación</th>
          </tr>
        </thead>
        <tbody>
          {reportes.map((reporte) => (
            <tr key={reporte.id_reporte}>
              <td>{reporte.id_reporte}</td>
              <td>{reporte.tipo_reporte}</td>
              <td>{reporte.periodo}</td>
              <td>{reporte.fecha_generacion}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Reportes;
