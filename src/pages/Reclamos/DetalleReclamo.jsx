import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { obtenerReclamo, clasificarReclamo, asignarPlazo, resolverReclamo, cerrarReclamo } from '../../api/reclamos';

const DetalleReclamo = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reclamo, setReclamo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarReclamo = async () => {
      try {
        const data = await obtenerReclamo(id);
        setReclamo(data);
      } catch (err) {
        setError('Reclamo no encontrado');
      }
    };
    cargarReclamo();
  }, [id]);

  if (error) return <div className="error">{error}</div>;
  if (!reclamo) return <div>Cargando...</div>;

  return (
    <div className="detalle-reclamo">
      <h1>Reclamo #{reclamo.id_reclamo}</h1>
      <div className="info-reclamo">
        <p><strong>Servicio:</strong> {reclamo.servicio}</p>
        <p><strong>Categoría:</strong> {reclamo.categoria}</p>
        <p><strong>Urgencia:</strong> {reclamo.urgencia}</p>
        <p><strong>Estado:</strong> {reclamo.estado}</p>
        <p><strong>Canal:</strong> {reclamo.canal}</p>
        <p><strong>Fecha Recepción:</strong> {reclamo.fecha_recepcion}</p>
        {reclamo.fecha_tope && <p><strong>Fecha Tope:</strong> {reclamo.fecha_tope}</p>}
        {reclamo.fecha_cierre && <p><strong>Fecha Cierre:</strong> {reclamo.fecha_cierre}</p>}
        {reclamo.resultado && <p><strong>Resultado:</strong> {reclamo.resultado}</p>}
        <p><strong>Descripción:</strong> {reclamo.descripcion}</p>
      </div>
      <div className="acciones">
        {reclamo.estado === 'registrado' && (
          <button onClick={() => navigate(`/reclamos/${id}/clasificar`)}>Clasificar</button>
        )}
        {reclamo.estado === 'clasificado' && (
          <button onClick={() => navigate(`/reclamos/${id}/asignar-plazo`)}>Asignar Plazo</button>
        )}
        {['en_atencion_tecnica', 'en_atencion_comercial'].includes(reclamo.estado) && (
          <button onClick={() => navigate(`/reclamos/${id}/resolver`)}>Resolver</button>
        )}
        {reclamo.estado === 'resuelto' && (
          <button onClick={() => navigate(`/reclamos/${id}/cerrar`)}>Cerrar</button>
        )}
      </div>
    </div>
  );
};

export default DetalleReclamo;
