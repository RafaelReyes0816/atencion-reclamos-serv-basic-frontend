import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listarOrdenes, eliminarOrden } from '../../api/seguimiento';
import { Alerta, Badge, Cargando, Vacio } from '../../components/UI';
import { icono } from '../../components/Iconos';

const ListaOrdenes = () => {
  const [ordenes, setOrdenes] = useState([]);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      setOrdenes(await listarOrdenes());
      setError(null);
    } catch (err) {
      setError(err.mensaje || 'No se pudieron cargar las órdenes');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const borrar = async (o) => {
    if (!window.confirm(`¿Eliminar la orden #${o.id_orden} del reclamo #${o.id_reclamo}?`)) return;
    setError(null);
    setExito(null);
    try {
      await eliminarOrden(o.id_orden);
      setExito(`Orden #${o.id_orden} eliminada.`);
      await cargar();
    } catch (err) {
      setError(err.mensaje || 'No se pudo eliminar la orden');
    }
  };

  return (
    <div className="form-pagina">
      <header className="pagina__encabezado">
        <div>
          <h1>Órdenes de trabajo</h1>
          <p>{ordenes.length} orden(es) registrada(s).</p>
        </div>
      </header>

      {error && <Alerta tipo="error" titulo="Error" onCerrar={() => setError(null)}>{error}</Alerta>}
      {exito && <Alerta tipo="exito" onCerrar={() => setExito(null)}>{exito}</Alerta>}

      <section className="card">
        {cargando ? (
          <Cargando />
        ) : ordenes.length === 0 ? (
          <Vacio titulo="Sin órdenes" />
        ) : (
          <div className="tabla-scroll">
            <table className="tabla">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Reclamo</th>
                  <th>Cuadrilla</th>
                  <th>Asignada</th>
                  <th>Estado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {ordenes.map((o) => (
                  <tr key={o.id_orden}>
                    <td className="celda-fuerte">#{o.id_orden}</td>
                    <td>
                      <Link to={`/panel/reclamos/${o.id_reclamo}`}>#{o.id_reclamo}</Link>
                    </td>
                    <td>{o.cuadrilla}</td>
                    <td className="celda-menor">{o.fecha_asignacion}</td>
                    <td>
                      <Badge valor={o.estado_orden} tipo="orden" />
                    </td>
                    <td>
                      <div className="acciones-iconos">
                        <Link
                          to={`/panel/reclamos/${o.id_reclamo}/avances`}
                          className="btn-icono"
                          title="Ver avances"
                        >
                          {icono('seguimiento')}
                        </Link>
                        <button
                          type="button"
                          className="btn-icono btn-icono--peligro"
                          onClick={() => borrar(o)}
                          title="Eliminar"
                        >
                          {icono('borrar')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default ListaOrdenes;
