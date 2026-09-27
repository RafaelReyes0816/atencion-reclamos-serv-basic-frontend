import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { obtenerReclamo } from '../../api/reclamos';
import { Alerta, Badge, Cargando } from '../../components/UI';
import { icono } from '../../components/Iconos';

const EleccionAtencion = () => {
  const { id } = useParams();
  const navegar = useNavigate();

  const [reclamo, setReclamo] = useState(null);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const rec = await obtenerReclamo(id);
        setReclamo(rec);
      } catch (err) {
        setError(err.mensaje || 'No se pudo cargar el reclamo');
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [id]);

  if (cargando) return <Cargando />;
  if (error) return <Alerta tipo="error" titulo="Error">{error}</Alerta>;
  if (!reclamo) return null;

  return (
    <div className="form-pagina">
      <header className="pagina__encabezado">
        <button type="button" className="btn btn--ghost" onClick={() => navegar(-1)}>
          {icono('volver')}
          Volver
        </button>
        <div>
          <h1>¿Cómo atender este reclamo?</h1>
          <p>
            Reclamo #{reclamo.id_reclamo} · {reclamo.servicio} / {reclamo.categoria} ·{' '}
            <Badge valor={reclamo.estado} />
          </p>
        </div>
      </header>

      <section className="card">
        <h2 className="card__titulo">Descripción del problema</h2>
        <p className="card__texto">{reclamo.descripcion}</p>
        <dl className="lista-datos lista-datos--horizontal">
          <div className="lista-datos__item">
            <dt>Servicio</dt>
            <dd>{reclamo.servicio === 'agua' ? 'Agua' : 'Luz'}</dd>
          </div>
          <div className="lista-datos__item">
            <dt>Categoría</dt>
            <dd>{reclamo.categoria?.replaceAll('_', ' ')}</dd>
          </div>
          <div className="lista-datos__item">
            <dt>Urgencia</dt>
            <dd><Badge valor={reclamo.urgencia} tipo="urgencia" /></dd>
          </div>
          {reclamo.fecha_tope && (
            <div className="lista-datos__item">
              <dt>Fecha límite</dt>
              <dd>{reclamo.fecha_tope}</dd>
            </div>
          )}
        </dl>
      </section>

      <div className="eleccion-grid">
        <Link
          to={`/panel/reclamos/${id}/asignar-cuadrilla`}
          className="card eleccion-card eleccion-card--tecnica"
        >
          <div className="eleccion-card__icono">{icono('seguimiento')}</div>
          <h3 className="eleccion-card__titulo">Atención Técnica</h3>
          <p className="eleccion-card__desc">
            Asignar una cuadrilla técnica para realizar trabajo en campo: reparaciones,
            instalaciones, inspecciones, etc.
          </p>
          <ul className="eleccion-card__lista">
            <li>Se crea una orden de trabajo</li>
            <li>Se registran avances paso a paso</li>
            <li>La cuadrilla reporta desde el sitio</li>
          </ul>
          <span className="btn btn--primary btn--bloque" style={{ marginTop: 'auto' }}>
            {icono('seguimiento')}
            Asignar cuadrilla
          </span>
        </Link>

        <Link
          to={`/panel/reclamos/${id}/derivar-comercial`}
          className="card eleccion-card eleccion-card--comercial"
        >
          <div className="eleccion-card__icono">{icono('usuarios')}</div>
          <h3 className="eleccion-card__titulo">Derivación Comercial</h3>
          <p className="eleccion-card__desc">
            Enviar el reclamo a un área comercial para gestión de facturación, cobranza,
            ajustes de cuenta o reclamaciones administrativas.
          </p>
          <ul className="eleccion-card__lista">
            <li>Se registra la derivación</li>
            <li>El área comercial lo gestiona</li>
            <li>Solución sin trabajo en campo</li>
          </ul>
          <span className="btn btn--outline btn--bloque" style={{ marginTop: 'auto' }}>
            {icono('usuarios')}
            Derivar a área comercial
          </span>
        </Link>
      </div>
    </div>
  );
};

export default EleccionAtencion;
