import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { obtenerReclamo } from '../../api/reclamos';
import { obtenerOrdenPorReclamo, listarAvances, crearAvance } from '../../api/seguimiento';
import { Alerta, Badge, Cargando, humanizar } from '../../components/UI';
import { icono } from '../../components/Iconos';

/** EstadoOrden del backend. */
const ESTADOS_ORDEN = { asignada: 'Asignada', en_curso: 'En curso', resuelta: 'Resuelta' };

/** EstadoParcial del backend. */
const ESTADOS_PARCIAL = { iniciado: 'Iniciado', en_proceso: 'En proceso', verificado: 'Verificado' };

const AvancesTrabajo = () => {
  const { id } = useParams();
  const navegar = useNavigate();

  const [reclamo, setReclamo] = useState(null);
  const [orden, setOrden] = useState(null);
  const [avances, setAvances] = useState([]);
  const [formulario, setFormulario] = useState({
    fecha_avance: new Date().toISOString().slice(0, 10),
    estado_parcial: 'iniciado',
    descripcion: '',
  });
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const rec = await obtenerReclamo(id);
      setReclamo(rec);

      // El endpoint de avances usa el id de la ORDEN, no el del reclamo.
      const ord = await obtenerOrdenPorReclamo(id);
      setOrden(ord);
      setAvances(await listarAvances(ord.id_orden));
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Este reclamo todavia no tiene una orden de trabajo asignada.');
      } else {
        setError(err.mensaje || 'No se pudo cargar el seguimiento');
      }
    } finally {
      setCargando(false);
    }
  }, [id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const enviar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const creado = await crearAvance({
        id_orden: orden.id_orden,
        fecha_avance: formulario.fecha_avance,
        estado_parcial: formulario.estado_parcial,
        descripcion: formulario.descripcion,
      });
      setAvances((prev) => [...prev, creado]);
      setFormulario({ ...formulario, descripcion: '' });
    } catch (err) {
      setError(err.mensaje || 'No se pudo registrar el avance');
    } finally {
      setEnviando(false);
    }
  };

  if (cargando) return <Cargando />;

  return (
    <div className="form-pagina">
      <header className="pagina__encabezado">
        <button type="button" className="btn btn--ghost" onClick={() => navegar(-1)}>
          {icono('volver')}
          Volver
        </button>
        <div>
          <h1>Seguimiento de la orden</h1>
          {reclamo && <p>Reclamo #{reclamo.id_reclamo}</p>}
        </div>
        {orden && <Badge valor={orden.estado_orden} tipo="orden" />}
      </header>

      {error && <Alerta tipo="aviso" titulo="Seguimiento no disponible">{error}</Alerta>}

      {orden && (
        <>
          <div className="resumen-reclamo">
            <div>
              <small>Orden</small>
              <strong>#{orden.id_orden}</strong>
            </div>
            <div>
              <small>Cuadrilla</small>
              <strong>{orden.cuadrilla}</strong>
            </div>
            <div>
              <small>Asignada</small>
              <strong>{orden.fecha_asignacion}</strong>
            </div>
            <div>
              <small>Estado</small>
              <strong>{ESTADOS_ORDEN[orden.estado_orden] || humanizar(orden.estado_orden)}</strong>
            </div>
          </div>

          <div className="seguimiento__grid">
            <section className="card">
              <h2 className="card__titulo">Avances registrados</h2>
              {avances.length === 0 ? (
                <p className="card__texto card__texto--vacio">Sin avances todavía.</p>
              ) : (
                <ol className="linea-tiempo">
                  {avances.map((a) => (
                    <li key={a.id_avance} className="linea-tiempo__item">
                      <span className={`linea-tiempo__punto linea-tiempo__punto--${a.estado_parcial}`} />
                      <div>
                        <div className="linea-tiempo__cabecera">
                          <strong>
                            {ESTADOS_PARCIAL[a.estado_parcial] || humanizar(a.estado_parcial)}
                          </strong>
                          <time>{a.fecha_avance}</time>
                        </div>
                        <p>{a.descripcion}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            <section className="card">
              <h2 className="card__titulo">Registrar avance</h2>
              <form className="form-grid form-grid--apilado" onSubmit={enviar}>
                <div className="campo">
                  <label htmlFor="fecha_avance">Fecha</label>
                  <input
                    id="fecha_avance"
                    type="date"
                    name="fecha_avance"
                    value={formulario.fecha_avance}
                    onChange={(e) => setFormulario({ ...formulario, fecha_avance: e.target.value })}
                    required
                  />
                </div>

                <div className="campo">
                  <label htmlFor="estado_parcial">Estado parcial</label>
                  <select
                    id="estado_parcial"
                    name="estado_parcial"
                    value={formulario.estado_parcial}
                    onChange={(e) => setFormulario({ ...formulario, estado_parcial: e.target.value })}
                  >
                    {Object.entries(ESTADOS_PARCIAL).map(([v, t]) => (
                      <option key={v} value={v}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="campo">
                  <label htmlFor="descripcion_avance">Descripción</label>
                  <textarea
                    id="descripcion_avance"
                    name="descripcion"
                    rows="3"
                    maxLength="1000"
                    value={formulario.descripcion}
                    onChange={(e) => setFormulario({ ...formulario, descripcion: e.target.value })}
                    required
                  />
                </div>

                <button type="submit" className="btn btn--primary btn--bloque" disabled={enviando}>
                  {enviando ? 'Guardando...' : 'Registrar avance'}
                </button>
              </form>
            </section>
          </div>
        </>
      )}
    </div>
  );
};

export default AvancesTrabajo;
