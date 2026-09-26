import { useState, useEffect } from 'react';
import { listarReclamos } from '../api/reclamos';

const Dashboard = () => {
  const [metricas, setMetricas] = useState({
    total: 0,
    registrados: 0,
    enAtencion: 0,
    resueltos: 0,
    cerrados: 0,
    vencidos: 0,
    criticos: 0,
  });

  useEffect(() => {
    const cargarMetricas = async () => {
      try {
        const reclamos = await listarReclamos();
        const hoy = new Date();
        setMetricas({
          total: reclamos.length,
          registrados: reclamos.filter((r) => r.estado === 'registrado').length,
          enAtencion: reclamos.filter((r) =>
            ['en_atencion_tecnica', 'en_atencion_comercial'].includes(r.estado)
          ).length,
          resueltos: reclamos.filter((r) => r.estado === 'resuelto').length,
          cerrados: reclamos.filter((r) => r.estado === 'cerrado').length,
          vencidos: reclamos.filter(
            (r) => r.fecha_tope && new Date(r.fecha_tope) < hoy && r.estado !== 'cerrado'
          ).length,
          criticos: reclamos.filter((r) => r.urgencia === 'critica' && r.estado !== 'cerrado').length,
        });
      } catch (error) {
        console.error('Error al cargar métricas:', error);
      }
    };
    cargarMetricas();
  }, []);

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <div className="metricas">
        <div className="metrica">
          <h3>Total Reclamos</h3>
          <p>{metricas.total}</p>
        </div>
        <div className="metrica">
          <h3>Registrados</h3>
          <p>{metricas.registrados}</p>
        </div>
        <div className="metrica">
          <h3>En Atención</h3>
          <p>{metricas.enAtencion}</p>
        </div>
        <div className="metrica">
          <h3>Resueltos</h3>
          <p>{metricas.resueltos}</p>
        </div>
        <div className="metrica">
          <h3>Cerrados</h3>
          <p>{metricas.cerrados}</p>
        </div>
        <div className="metrica alerta">
          <h3>Vencidos</h3>
          <p>{metricas.vencidos}</p>
        </div>
        <div className="metrica critico">
          <h3>Críticos</h3>
          <p>{metricas.criticos}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
