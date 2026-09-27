import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, esGestion } from '../context/AuthContext';
import { obtenerDashboard } from '../api/reportes';
import { listarReclamos } from '../api/reclamos';
import { Alerta, Badge, Cargando, Vacio, humanizar } from '../components/UI';
import { icono } from '../components/Iconos';

/**
 * Métrica del panel. Si recibe `to`, se convierte en un enlace a la lista de
 * reclamos ya filtrada; si no, es solo informativa.
 */
const Metrica = ({ titulo, valor, clase = '', ico, to, detalle }) => {
  const cuerpo = (
    <>
      <span className="metrica__icono">{icono(ico)}</span>
      <div>
        <strong className="metrica__valor">{valor ?? 0}</strong>
        <span className="metrica__titulo">{titulo}</span>
      </div>
      {to && <span className="metrica__ir">{icono('flecha')}</span>}
    </>
  );

  if (!to) return <div className={`metrica ${clase}`}>{cuerpo}</div>;

  return (
    <Link
      to={to}
      className={`metrica metrica--enlazable ${clase}`}
      title={detalle || `Ver reclamos: ${titulo}`}
    >
      {cuerpo}
    </Link>
  );
};

const TablaAlertas = ({ filas, vacio, columna = 'Días' }) => (
  <>
    {filas?.length ? (
      <div className="tabla-scroll">
        <table className="tabla tabla--compacta">
          <thead>
            <tr>
              <th>Reclamo</th>
              <th>Estado</th>
              <th>Límite</th>
              <th>{columna}</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((a) => (
              <tr key={a.id_reclamo}>
                <td className="celda-fuerte">
                  <Link to={`/panel/reclamos/${a.id_reclamo}`}>#{a.id_reclamo}</Link>
                </td>
                <td>
                  <Badge valor={a.estado} />
                </td>
                <td className="celda-menor">{a.fecha_tope}</td>
                <td>
                  <span className={`dias ${a.dias_restantes < 0 ? 'dias--negativo' : 'dias--aviso'}`}>
                    {a.dias_restantes}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <p className="card__texto card__texto--vacio">{vacio}</p>
    )}
  </>
);

const Dashboard = () => {
  const { nombre, rol } = useAuth();
  const gestion = esGestion(rol);

  const [datos, setDatos] = useState(null);
  const [propios, setPropios] = useState(null);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      if (gestion) {
        setDatos(await obtenerDashboard());
      } else {
        // /dashboard exige GESTION: el ciudadano ve el resumen de sus propios reclamos.
        setPropios(await listarReclamos());
      }
    } catch (err) {
      setError(err.mensaje || 'No se pudo cargar el panel');
    } finally {
      setCargando(false);
    }
  }, [gestion]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  if (cargando) return <Cargando texto="Cargando indicadores..." />;

  if (error) {
    return (
      <div className="form-pagina">
        <Alerta tipo="error" titulo="No se pudo cargar el panel">{error}</Alerta>
        <button type="button" className="btn btn--outline" onClick={cargar}>
          {icono('refrescar')}
          Reintentar
        </button>
      </div>
    );
  }

  /* ---------- Vista del ciudadano ---------- */
  if (!gestion) {
    const abiertos = (propios || []).filter((r) => !['cerrado', 'descartado'].includes(r.estado));
    const resueltos = (propios || []).filter((r) => r.estado === 'resuelto');
    const cerrados = (propios || []).filter((r) => r.estado === 'cerrado');
    const ultimos = [...(propios || [])].slice(0, 5);

    return (
      <div className="form-pagina">
        <header className="pagina__encabezado">
          <div>
            <h1>Hola, {nombre?.split(' ')[0]}</h1>
            <p>Este es el estado de tus reclamos ante la empresa de servicios.</p>
          </div>
          <Link to="/panel/reclamos/nuevo" className="btn btn--primary">
            {icono('nuevo')}
            Nuevo reclamo
          </Link>
        </header>

        <section className="metricas metricas--corto">
          <Metrica titulo="Total reclamos" valor={propios?.length} ico="reclamos" to="/panel/reclamos" />
          <Metrica
            titulo="En trámite"
            valor={abiertos.length}
            clase="metrica--info"
            ico="reloj"
            to="/panel/reclamos?estados=registrado,clasificado,en_atencion_tecnica,en_atencion_comercial,escalado"
            detalle="Ver mis reclamos que aún no están cerrados"
          />
          <Metrica
            titulo="Resueltos"
            valor={resueltos.length}
            clase="metrica--exito"
            ico="check"
            to="/panel/reclamos?estado=resuelto"
            detalle="Ver mis reclamos resueltos y pendientes de cierre"
          />
          <Metrica
            titulo="Cerrados"
            valor={cerrados.length}
            clase="metrica--neutro"
            ico="candado"
            to="/panel/reclamos?estado=cerrado"
            detalle="Ver mis reclamos ya cerrados"
          />
        </section>

        <section className="card">
          <div className="card__cabecera">
            <h2 className="card__titulo">Mis últimos reclamos</h2>
            <Link to="/panel/reclamos" className="btn btn--ghost btn--sm">
              Ver todos
              {icono('flecha')}
            </Link>
          </div>

          {ultimos.length === 0 ? (
            <Vacio titulo="Sin reclamos">
              Cuando registres un reclamo aparecerá aquí con su estado y fecha límite.
            </Vacio>
          ) : (
            <ul className="lista-reclamos">
              {ultimos.map((r) => (
                <li key={r.id_reclamo}>
                  <Link to={`/panel/reclamos/${r.id_reclamo}`} className="lista-reclamos__item">
                    <div>
                      <strong>#{r.id_reclamo}</strong>
                      <span className={`servicio servicio--${r.servicio}`}>
                        {r.servicio === 'agua' ? 'Agua' : 'Luz'}
                      </span>
                    </div>
                    <p>{r.descripcion}</p>
                    <div className="lista-reclamos__meta">
                      <Badge valor={r.estado} />
                      {r.fecha_tope && <small>Límite {r.fecha_tope}</small>}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    );
  }

  /* ---------- Vista de gestión ---------- */
  if (!datos) return null;

  return (
    <div className="form-pagina">
      <header className="pagina__encabezado">
        <div>
          <h1>Panel de control</h1>
          <p>
            {datos.total_reclamos} reclamos · {datos.total_usuarios} usuarios ·{' '}
            {datos.porcentaje_cumplimiento}% de cumplimiento de plazos
          </p>
        </div>
        <button type="button" className="btn btn--outline btn--sm" onClick={cargar}>
          {icono('refrescar')}
          Actualizar
        </button>
      </header>

      <section className="metricas">
        <Metrica titulo="Total reclamos" valor={datos.total_reclamos} ico="reclamos" to="/panel/reclamos" />
        <Metrica
          titulo="Pendientes"
          valor={datos.pendientes}
          clase="metrica--info"
          ico="documento"
          to="/panel/reclamos?estados=registrado,clasificado"
          detalle="Ver reclamos registrados y clasificados"
        />
        <Metrica
          titulo="En atención"
          valor={datos.en_atencion}
          clase="metrica--info"
          ico="reloj"
          to="/panel/reclamos?estados=en_atencion_tecnica,en_atencion_comercial"
          detalle="Ver reclamos en atención técnica y comercial"
        />
        <Metrica
          titulo="Resueltos"
          valor={datos.resueltos}
          clase="metrica--exito"
          ico="check"
          to="/panel/reclamos?estado=resuelto"
        />
        <Metrica
          titulo="Cerrados"
          valor={datos.cerrados}
          clase="metrica--neutro"
          ico="candado"
          to="/panel/reclamos?estado=cerrado"
        />
        <Metrica
          titulo="Vencidos"
          valor={datos.vencidos}
          clase="metrica--peligro"
          ico="alerta"
          to="/panel/reclamos?vencidos=1"
          detalle="Ver reclamos con fecha límite superada y sin cerrar"
        />
        <Metrica
          titulo="Críticos"
          valor={datos.criticos}
          clase="metrica--peligro"
          ico="bombillo"
          to="/panel/reclamos?criticos=1"
          detalle="Ver reclamos de urgencia crítica sin resolver"
        />
        <Metrica
          titulo="Por vencer"
          valor={datos.proximos_vencer}
          clase="metrica--aviso"
          ico="reloj"
          to="/panel/reclamos?por_vencer=1"
          detalle="Ver reclamos cuya fecha límite sigue vigente"
        />
      </section>

      <div className="panel__grid">
        <section className="card">
          <div className="card__cabecera">
            <h2 className="card__titulo">Alertas de vencimiento</h2>
            <span className="contador-mini">{datos.alertas_vencidos?.length || 0}</span>
          </div>
          <TablaAlertas
            filas={datos.alertas_vencidos}
            vacio="Sin reclamos vencidos. Todo al día."
          />
        </section>

        <section className="card">
          <div className="card__cabecera">
            <h2 className="card__titulo">Vencimiento próximo</h2>
            <span className="contador-mini">{datos.alertas_vencimiento_proximo?.length || 0}</span>
          </div>
          <TablaAlertas
            filas={datos.alertas_vencimiento_proximo}
            vacio="Nada por vencer en los próximos días."
          />
        </section>

        {datos.alertas_criticas?.length > 0 && (
          <section className="card card--peligro">
            <div className="card__cabecera">
              <h2 className="card__titulo">Críticos abiertos</h2>
              <span className="contador-mini">{datos.alertas_criticas.length}</span>
            </div>
            <ul className="lista-simple">
              {datos.alertas_criticas.map((a) => (
                <li key={a.id_reclamo}>
                  <Link to={`/panel/reclamos/${a.id_reclamo}`} className="celda-fuerte">
                    #{a.id_reclamo}
                  </Link>{' '}
                  {a.servicio} / {humanizar(a.categoria)} · <Badge valor={a.estado} />
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="card">
          <div className="card__cabecera">
            <h2 className="card__titulo">Distribución por servicio</h2>
          </div>
          <ul className="barras">
            {datos.por_servicio?.map((s) => {
              const pct = datos.total_reclamos
                ? Math.round((s.total / datos.total_reclamos) * 100)
                : 0;
              return (
                <li key={s.servicio}>
                  <Link
                    to={`/panel/reclamos?servicio=${s.servicio}`}
                    className="barras__item"
                    title={`Ver reclamos de ${s.servicio === 'agua' ? 'agua' : 'luz'}`}
                  >
                    <div className="barras__cabecera">
                      <span>{s.servicio === 'agua' ? 'Agua' : 'Luz'}</span>
                      <strong>{s.total}</strong>
                    </div>
                    <div className="barras__pista">
                      <div
                        className={`barras__relleno barras__relleno--${s.servicio}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
