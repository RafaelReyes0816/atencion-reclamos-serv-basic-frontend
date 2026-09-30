import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { clasificarReclamo, obtenerReclamo } from '../../api/reclamos';
import { Alerta, Badge, Cargando, Modal } from '../../components/UI';
import { icono } from '../../components/Iconos';

const SERVICIOS = [
  ['agua', 'Agua'],
  ['luz', 'Luz'],
];

const CATEGORIAS = [
  ['corte', 'Corte'],
  ['fuga', 'Fuga'],
  ['facturacion', 'Facturación'],
  ['falla_tecnica', 'Falla técnica'],
];

const URGENCIAS = [
  ['programada', 'Programada'],
  ['normal', 'Normal'],
  ['alta', 'Alta'],
  ['critica', 'Crítica'],
];

const ClasificarReclamo = () => {
  const { id } = useParams();
  const navegar = useNavigate();

  const [reclamo, setReclamo] = useState(null);
  const [formulario, setFormulario] = useState({
    servicio: 'agua',
    categoria: 'corte',
    urgencia: 'normal',
  });
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [cargando, setCargando] = useState(true);
  // La clasificacion se confirma en ventana emergente antes de seguir con el plazo.
  const [clasificado, setClasificado] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      try {
        const rec = await obtenerReclamo(id);
        setReclamo(rec);
        setFormulario({
          servicio: rec.servicio,
          categoria: rec.categoria,
          urgencia: rec.urgencia,
        });
      } catch (err) {
        setError(err.mensaje || 'No se pudo cargar el reclamo');
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [id]);

  const enviar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await clasificarReclamo(id, formulario);
      setClasificado(true);
    } catch (err) {
      setError(err.mensaje || 'No se pudo clasificar el reclamo');
    } finally {
      setEnviando(false);
    }
  };

  // Recien al cerrar la confirmación se pasa a asignar plazo: la pantalla
  // siguiente no aparece encima del mensaje.
  const cerrarClasificacion = () => {
    setClasificado(false);
    navegar(`/panel/reclamos/${id}/asignar-plazo`, { replace: true });
  };

  if (cargando) return <Cargando />;
  if (error && !reclamo) return <Alerta tipo="error" titulo="Error">{error}</Alerta>;
  if (!reclamo) return null;

  const yaClasificado = reclamo.estado !== 'registrado';

  return (
    <div className="form-pagina">
      <header className="pagina__encabezado">
        <button type="button" className="btn btn--ghost" onClick={() => navegar(-1)}>
          {icono('volver')}
          Volver
        </button>
        <div>
          <h1>Clasificar reclamo</h1>
          <p>
            Reclamo #{reclamo.id_reclamo} · <Badge valor={reclamo.estado} />
          </p>
        </div>
      </header>

      {yaClasificado && (
        <Alerta tipo="aviso" titulo="Ya clasificado">
          Este reclamo ya tiene servicio, categoría y urgencia asignados. Puedes ajustarlos si
          corresponde.
        </Alerta>
      )}

      {clasificado && (
        <Modal titulo="Reclamo clasificado" onCerrar={cerrarClasificacion}>
          El reclamo #{reclamo.id_reclamo} quedó clasificado como{' '}
          <strong>{formulario.servicio === 'agua' ? 'Agua' : 'Luz'}</strong> en categoría{' '}
          <strong>{formulario.categoria.replaceAll('_', ' ')}</strong>. Al continuar se
          asigna el plazo regulatorio.
        </Modal>
      )}

      <section className="card">
        <h2 className="card__titulo">Descripción del ciudadano</h2>
        <blockquote className="cita">«{reclamo.descripcion}»</blockquote>
        <dl className="lista-datos lista-datos--horizontal">
          <div className="lista-datos__item">
            <dt>Recibido</dt>
            <dd>{reclamo.fecha_recepcion}</dd>
          </div>
        </dl>
      </section>

      <form className="card form-grid" onSubmit={enviar}>
        <h2 className="card__titulo campo--ancho">Clasificación</h2>

        {error && (
          <div className="campo--ancho">
            <Alerta tipo="error">{error}</Alerta>
          </div>
        )}

        <div className="campo">
          <label htmlFor="servicio">Servicio</label>
          <select
            id="servicio"
            name="servicio"
            value={formulario.servicio}
            onChange={(e) => setFormulario({ ...formulario, servicio: e.target.value })}
          >
            {SERVICIOS.map(([v, t]) => (
              <option key={v} value={v}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="campo">
          <label htmlFor="categoria">Categoría</label>
          <select
            id="categoria"
            name="categoria"
            value={formulario.categoria}
            onChange={(e) => setFormulario({ ...formulario, categoria: e.target.value })}
          >
            {CATEGORIAS.map(([v, t]) => (
              <option key={v} value={v}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="campo">
          <label htmlFor="urgencia">Urgencia</label>
          <select
            id="urgencia"
            name="urgencia"
            value={formulario.urgencia}
            onChange={(e) => setFormulario({ ...formulario, urgencia: e.target.value })}
          >
            {URGENCIAS.map(([v, t]) => (
              <option key={v} value={v}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="form-grid__acciones">
          <button type="button" className="btn btn--outline" onClick={() => navegar(-1)}>
            Cancelar
          </button>
          <button type="submit" className="btn btn--primary" disabled={enviando}>
            {enviando ? 'Guardando...' : 'Clasificar y asignar plazo'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClasificarReclamo;
