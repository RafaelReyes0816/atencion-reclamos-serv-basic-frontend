import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { listarReclamos } from '../../api/reclamos';

const ListaReclamos = () => {
  const [reclamos, setReclamos] = useState([]);
  const [filtro, setFiltro] = useState({ estado: '', servicio: '', categoria: '' });

  useEffect(() => {
    const cargarReclamos = async () => {
      try {
        const data = await listarReclamos();
        setReclamos(data);
      } catch (error) {
        console.error('Error al cargar reclamos:', error);
      }
    };
    cargarReclamos();
  }, []);

  const filtrados = reclamos.filter((r) => {
    if (filtro.estado && r.estado !== filtro.estado) return false;
    if (filtro.servicio && r.servicio !== filtro.servicio) return false;
    if (filtro.categoria && r.categoria !== filtro.categoria) return false;
    return true;
  });

  return (
    <div className="lista-reclamos">
      <h1>Lista de Reclamos</h1>
      <div className="filtros">
        <select value={filtro.estado} onChange={(e) => setFiltro({ ...filtro, estado: e.target.value })}>
          <option value="">Todos los estados</option>
          <option value="registrado">Registrado</option>
          <option value="clasificado">Clasificado</option>
          <option value="en_atencion_tecnica">En Atención Técnica</option>
          <option value="en_atencion_comercial">En Atención Comercial</option>
          <option value="resuelto">Resuelto</option>
          <option value="cerrado">Cerrado</option>
          <option value="escalado">Escalado</option>
        </select>
        <select value={filtro.servicio} onChange={(e) => setFiltro({ ...filtro, servicio: e.target.value })}>
          <option value="">Todos los servicios</option>
          <option value="agua">Agua</option>
          <option value="luz">Luz</option>
        </select>
        <select value={filtro.categoria} onChange={(e) => setFiltro({ ...filtro, categoria: e.target.value })}>
          <option value="">Todas las categorías</option>
          <option value="corte">Corte</option>
          <option value="facturacion">Facturación</option>
          <option value="fuga">Fuga</option>
          <option value="falla_tecnica">Falla Técnica</option>
        </select>
      </div>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Servicio</th>
            <th>Categoría</th>
            <th>Urgencia</th>
            <th>Estado</th>
            <th>Fecha Recepción</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filtrados.map((reclamo) => (
            <tr key={reclamo.id_reclamo}>
              <td>{reclamo.id_reclamo}</td>
              <td>{reclamo.servicio}</td>
              <td>{reclamo.categoria}</td>
              <td>{reclamo.urgencia}</td>
              <td>{reclamo.estado}</td>
              <td>{reclamo.fecha_recepcion}</td>
              <td>
                <Link to={`/reclamos/${reclamo.id_reclamo}`}>Ver</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ListaReclamos;
