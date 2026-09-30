import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth, esInterno, esGestion } from '../../context/AuthContext';
import { obtenerReclamo, obtenerComprobante } from '../../api/reclamos';
import { obtenerDerivacion } from '../../api/seguimiento';
import { Alerta, Badge, Cargando, humanizar } from '../../components/UI';
import FlujoReclamo from '../../components/FlujoReclamo';
import { icono } from '../../components/Iconos';

const CAMPOS = [
  ['servicio', 'Cuenta'],
  ['numero_medidor', 'Número de medidor'],
  ['categoria', 'Categoría'],
  ['urgencia', 'Urgencia'],
  ['canal', 'Canal'],
  ['fecha_recepcion', 'Fecha de recepción'],
  ['fecha_tope', 'Fecha límite'],
  ['fecha_cierre', 'Fecha de cierre'],
  ['resultado', 'Resultado'],
];

const DetalleReclamo = () => {
  const { id } = useParams();
  const navegar = useNavigate();
  const { rol } = useAuth();

  const [reclamo, setReclamo] = useState(null);
  const [derivacion, setDerivacion] = useState(null);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const rec = await obtenerReclamo(id);
      setReclamo(rec);
      const der = await obtenerDerivacion(id).catch(() => null);
      setDerivacion(der);
      setError(null);
    } catch (err) {
      setError(err.mensaje || 'No se pudo cargar el reclamo');
    } finally {
      setCargando(false);
    }
  }, [id]);

  const [comprobante, setComprobante] = useState(null);
  const [cargandoComprobante, setCargandoComprobante] = useState(false);

  const cargarComprobante = async () => {
    setCargandoComprobante(true);
    try {
      setComprobante(await obtenerComprobante(id));
    } catch {
      setComprobante(null);
    } finally {
      setCargandoComprobante(false);
    }
  };

  useEffect(() => {
    cargar();
  }, [cargar]);

  if (cargando) return <Cargando />;
  if (error) {
    return (
      <div className="form-pagina">
        <Alerta tipo="error" titulo="No se pudo abrir el reclamo">
          {error}
        </Alerta>
        <button type="button" className="btn btn--outline" onClick={() => navegar('/panel/reclamos')}>
          {icono('volver')}
          Volver a la lista
        </button>
      </div>
    );
  }
  if (!reclamo) return null;

  const acciones = [];

  if (reclamo.estado === 'registrado' && esInterno(rol)) {
    acciones.push({
      a: `/panel/reclamos/${id}/clasificar`,
      texto: 'Clasificar',
      clase: 'btn--primary',
      icono: 'editar',
    });
  }
  if (reclamo.estado === 'clasificado' && !reclamo.fecha_tope && esGestion(rol)) {
    acciones.push({
      a: `/panel/reclamos/${id}/asignar-plazo`,
      texto: 'Asignar plazo',
      clase: 'btn--primary',
      icono: 'reloj',
    });
  }
  if (reclamo.estado === 'clasificado' && reclamo.fecha_tope && esInterno(rol)) {
    acciones.push({
      a: `/panel/reclamos/${id}/elegir-atencion`,
      texto: 'Elegir atención',
      clase: 'btn--primary',
      icono: 'seguimiento',
    });
  }
  if (
    ['en_atencion_tecnica', 'en_atencion_comercial', 'escalado'].includes(reclamo.estado) &&
    esInterno(rol)
  ) {
    acciones.push({
      a: `/panel/reclamos/${id}/resolver`,
      texto: 'Resolver',
      clase: 'btn--accent',
      icono: 'check',
    });
  }
  if (reclamo.estado === 'resuelto' && esGestion(rol)) {
    acciones.push({
      a: `/panel/reclamos/${id}/cerrar`,
      texto: 'Cerrar',
      clase: 'btn--primary',
      icono: 'check',
    });
  }
  if (esInterno(rol) && ['en_atencion_tecnica', 'en_atencion_comercial'].includes(reclamo.estado)) {
    acciones.push({
      a: `/panel/reclamos/${id}/avances`,
      texto: 'Ver avances',
      clase: 'btn--outline',
      icono: 'seguimiento',
    });
  }

  const diasRestantes = reclamo.fecha_tope
    ? Math.ceil((new Date(reclamo.fecha_tope) - new Date()) / 86400000)
    : null;
  const vencido = diasRestantes !== null && diasRestantes < 0 && reclamo.estado !== 'cerrado';

  return (
    <div className="detalle">
      <header className="pagina__encabezado">
        <button type="button" className="btn btn--ghost" onClick={() => navegar(-1)}>
          {icono('volver')}
          Volver
        </button>
        <div className="detalle__titulo">
          <div>
            <h1>Reclamo #{reclamo.id_reclamo}</h1>
            <p className="detalle__fecha">Registrado el {reclamo.fecha_recepcion}</p>
          </div>
          <Badge valor={reclamo.estado} />
        </div>
      </header>

      {vencido && (
        <Alerta tipo="error" titulo="Reclamo vencido">
          Pasaron {Math.abs(diasRestantes)} día(s) desde la fecha límite regulatoria.
        </Alerta>
      )}

      <FlujoReclamo reclamo={reclamo} />

      <div className="detalle__grid">
        <section className="card">
          <h2 className="card__titulo">Datos del reclamo</h2>
          <p className="detalle__descripcion">{reclamo.descripcion}</p>
          <dl className="lista-datos">
            {CAMPOS.filter(([k]) => reclamo[k]).map(([clave, etiqueta]) => (
              <div key={clave} className="lista-datos__item">
                <dt>{etiqueta}</dt>
                <dd>{humanizar(reclamo[clave])}</dd>
              </div>
            ))}
          </dl>
        </section>

        <aside className="detalle__aside">
          {reclamo.id_normativa && (
            <section className="card">
              <h2 className="card__titulo">Normativa aplicada</h2>
              <p className="card__texto">
                Normativa #{reclamo.id_normativa}
                {reclamo.fecha_tope && ` · límite ${reclamo.fecha_tope}`}
              </p>
            </section>
          )}

          {derivacion && (
            <section className="card">
              <h2 className="card__titulo">Derivación comercial</h2>
              <dl className="lista-datos">
                <div className="lista-datos__item">
                  <dt>Área</dt>
                  <dd>{derivacion.area_comercial}</dd>
                </div>
                <div className="lista-datos__item">
                  <dt>Estado</dt>
                  <dd><Badge valor={derivacion.estado_derivacion} /></dd>
                </div>
              </dl>
              <Link
                to={`/panel/reclamos/${id}/derivacion`}
                className="btn btn--outline btn--sm btn--bloque"
                style={{ marginTop: '0.5rem' }}
              >
                {icono('seguimiento')}
                Ver detalle
              </Link>
            </section>
          )}

          {diasRestantes !== null && reclamo.estado !== 'cerrado' && (
            <section className={`card card--${vencido ? 'peligro' : 'info'}`}>
              <h2 className="card__titulo">Tiempo restante</h2>
              <p className="contador">
                {diasRestantes}
                <small>días</small>
              </p>
              <p className="card__texto">
                {vencido ? 'Plazo vencido' : `Fecha límite: ${reclamo.fecha_tope}`}
              </p>
            </section>
          )}

          {acciones.length > 0 && (
            <section className="card">
              <h2 className="card__titulo">Acciones</h2>
              <div className="acciones">
                {acciones.map((a) => (
                  <Link key={a.a} to={a.a} className={`btn ${a.clase} btn--bloque`}>
                    {icono(a.icono)}
                    {a.texto}
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="card">
            <h2 className="card__titulo">Comprobante</h2>
            <button
              type="button"
              className="btn btn--outline btn--bloque"
              onClick={cargarComprobante}
              disabled={cargandoComprobante}
            >
              {icono('hoja')}
              {cargandoComprobante ? 'Generando...' : 'Ver comprobante'}
            </button>

            {comprobante && (
              <div className="comprobante">
                <div className="comprobante__fila">
                  <small>Reclamo</small>
                  <strong>#{comprobante.id_reclamo}</strong>
                </div>
                <div className="comprobante__fila">
                  <small>Cuenta</small>
                  <strong>{comprobante.servicio === 'agua' ? 'Agua' : 'Luz eléctrica'}</strong>
                </div>
                {comprobante.numero_medidor && (
                  <div className="comprobante__fila">
                    <small>Medidor</small>
                    <strong>{comprobante.numero_medidor}</strong>
                  </div>
                )}
                <div className="comprobante__fila">
                  <small>Categoría</small>
                  <strong>{humanizar(comprobante.categoria)}</strong>
                </div>
                <div className="comprobante__fila">
                  <small>Canal</small>
                  <strong>{humanizar(comprobante.canal)}</strong>
                </div>
                <div className="comprobante__fila">
                  <small>Registrado</small>
                  <strong>{comprobante.fecha_recepcion}</strong>
                </div>
                <div className="comprobante__fila">
                  <small>Fecha límite</small>
                  <strong>{comprobante.fecha_tope || 'Sin plazo asignado'}</strong>
                </div>
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
};

export default DetalleReclamo;
