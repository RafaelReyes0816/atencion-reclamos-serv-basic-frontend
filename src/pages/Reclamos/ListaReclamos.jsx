import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth, esInterno } from '../../context/AuthContext';
import { listarReclamos } from '../../api/reclamos';
import { Alerta, Badge, Cargando, Vacio } from '../../components/UI';
import { icono } from '../../components/Iconos';

const ESTADOS = [
  'registrado',
  'clasificado',
  'en_atencion_tecnica',
  'en_atencion_comercial',
  'resuelto',
  'cerrado',
  'escalado',
];

const hoyISO = () => new Date().toISOString().slice(0, 10);

const ListaReclamos = () => {
  const { rol } = useAuth();
  const [params, setParams] = useSearchParams();
  const [reclamos, setReclamos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Los filtros viven en la URL para que se puedan enlazar desde el panel.
  const filtros = useMemo(
    () => ({
      estado: params.get('estado') || '',
      estados: (params.get('estados') || '').split(',').filter(Boolean),
      servicio: params.get('servicio') || '',
      categoria: params.get('categoria') || '',
      urgencia: params.get('urgencia') || '',
      vencidos: params.get('vencidos') === '1',
      por_vencer: params.get('por_vencer') === '1',
      criticos: params.get('criticos') === '1',
    }),
    [params]
  );

  /** Aplica varios cambios a la URL de una sola vez.
   *
   *  No se pueden encadenar dos `setParams` en el mismo manejador: los dos leen el
   *  mismo `params` del render anterior, asi que el segundo pisa al primero y el
   *  filtro recien elegido se pierde. Por eso se acumulan los cambios y se navega
   *  una unica vez.
   */
  const aplicarFiltros = (cambios) => {
    const nuevos = new URLSearchParams(params);
    for (const [clave, valor] of Object.entries(cambios)) {
      if (valor === '' || valor === false || valor === null) nuevos.delete(clave);
      else nuevos.set(clave, valor === true ? '1' : String(valor));
    }
    setParams(nuevos, { replace: true });
  };

  const setFiltro = (clave, valor) => aplicarFiltros({ [clave]: valor });

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      setReclamos(await listarReclamos({
        estado: filtros.estado,
        servicio: filtros.servicio,
        categoria: filtros.categoria,
        urgencia: filtros.urgencia,
      }));
      setError(null);
    } catch (err) {
      setError(err.mensaje || 'No se pudieron cargar los reclamos');
    } finally {
      setCargando(false);
    }
  }, [filtros.estado, filtros.servicio, filtros.categoria, filtros.urgencia]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const filtrados = reclamos.filter((r) => {
    if (filtros.estado && r.estado !== filtros.estado) return false;
    if (filtros.estados.length && !filtros.estados.includes(r.estado)) return false;
    if (filtros.servicio && r.servicio !== filtros.servicio) return false;
    if (filtros.categoria && r.categoria !== filtros.categoria) return false;
    if (filtros.urgencia && r.urgencia !== filtros.urgencia) return false;
    if (filtros.vencidos && !(r.fecha_tope && r.fecha_tope < hoyISO() && r.estado !== 'cerrado'))
      return false;
    if (
      filtros.por_vencer &&
      !(r.fecha_tope &&
        r.fecha_tope >= hoyISO() &&
        !['cerrado', 'registrado'].includes(r.estado))
    )
      return false;
    if (
      filtros.criticos &&
      !(r.urgencia === 'critica' && !['cerrado', 'resuelto'].includes(r.estado))
    )
      return false;
    if (busqueda) {
      const q = busqueda.toLowerCase();
      const coincide =
        String(r.id_reclamo).includes(q) ||
        (r.descripcion || '').toLowerCase().includes(q);
      if (!coincide) return false;
    }
    return true;
  });

  const limpiar = () => {
    setParams(new URLSearchParams(), { replace: true });
    setBusqueda('');
  };

  const hayFiltros =
    !!busqueda || Object.values(filtros).some((v) => v === true || (Array.isArray(v) ? v.length : v !== ''));

  /** Resumen de los filtros activos, para que se entienda qué se está viendo. */
  const etiquetas = [
    filtros.estado && `Estado: ${filtros.estado.replaceAll('_', ' ')}`,
    filtros.estados.length &&
      `Estados: ${filtros.estados.map((e) => e.replaceAll('_', ' ')).join(', ')}`,
    filtros.servicio && `Servicio: ${filtros.servicio}`,
    filtros.categoria && `Categoría: ${filtros.categoria.replaceAll('_', ' ')}`,
    filtros.urgencia && `Urgencia: ${filtros.urgencia}`,
    filtros.vencidos && 'Vencidos',
    filtros.por_vencer && 'Por vencer',
    filtros.criticos && 'Críticos',
  ].filter(Boolean);

  return (
    <div className="form-pagina">
      <header className="pagina__encabezado">
        <div>
          <h1>Reclamos</h1>
          <p>
            {esInterno(rol)
              ? `${filtrados.length} de ${reclamos.length} reclamo(s).`
              : `${filtrados.length} de ${reclamos.length} reclamo(s) a tu nombre.`}
          </p>
        </div>
        <Link to="/panel/reclamos/nuevo" className="btn btn--primary">
          {icono('nuevo')}
          Nuevo reclamo
        </Link>
      </header>

      {error && <Alerta tipo="error" titulo="Error" onCerrar={() => setError(null)}>{error}</Alerta>}

      <section className="card">
        <div className="filtros">
          <div className="buscador buscador--ancho">
            {icono('buscar')}
            <input
              type="search"
              placeholder="Buscar por ID o descripción"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <select
            value={filtros.estado}
            onChange={(e) => aplicarFiltros({ estado: e.target.value, estados: '' })}
            aria-label="Filtrar por estado"
          >
            <option value="">Todos los estados</option>
            {ESTADOS.map((e) => (
              <option key={e} value={e}>
                {e.replaceAll('_', ' ')}
              </option>
            ))}
          </select>

          <select
            value={filtros.servicio}
            onChange={(e) => setFiltro('servicio', e.target.value)}
            aria-label="Filtrar por servicio"
          >
            <option value="">Todos los servicios</option>
            <option value="agua">Agua</option>
            <option value="luz">Luz</option>
          </select>

          <select
            value={filtros.categoria}
            onChange={(e) => setFiltro('categoria', e.target.value)}
            aria-label="Filtrar por categoría"
          >
            <option value="">Todas las categorías</option>
            <option value="corte">Corte</option>
            <option value="fuga">Fuga</option>
            <option value="facturacion">Facturación</option>
            <option value="falla_tecnica">Falla técnica</option>
          </select>

          <select
            value={filtros.urgencia}
            onChange={(e) => setFiltro('urgencia', e.target.value)}
            aria-label="Filtrar por urgencia"
          >
            <option value="">Toda urgencia</option>
            <option value="programada">Programada</option>
            <option value="normal">Normal</option>
            <option value="alta">Alta</option>
            <option value="critica">Crítica</option>
          </select>

          {hayFiltros && (
            <button type="button" className="btn btn--ghost btn--sm" onClick={limpiar}>
              Limpiar
            </button>
          )}
        </div>

        {etiquetas.length > 0 && (
          <div className="filtros-activos">
            <span>Filtrando por:</span>
            {etiquetas.map((t) => (
              <span key={t} className="chip chip--filtro">
                {t}
              </span>
            ))}
          </div>
        )}

        {cargando ? (
          <Cargando />
        ) : filtrados.length === 0 ? (
          <Vacio titulo="Sin reclamos">
            {hayFiltros
              ? 'Ningún reclamo coincide con los filtros aplicados.'
              : 'Todavía no hay reclamos registrados.'}
          </Vacio>
        ) : (
          <div className="tabla-scroll">
            <table className="tabla">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Servicio</th>
                  <th>Categoría</th>
                  <th>Urgencia</th>
                  <th>Estado</th>
                  <th>Recepción</th>
                  <th>Límite</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtrados.map((r) => (
                  <tr key={r.id_reclamo}>
                    <td className="celda-fuerte">#{r.id_reclamo}</td>
                    <td>
                      <span className={`servicio servicio--${r.servicio}`}>
                        {r.servicio === 'agua' ? 'Agua' : 'Luz'}
                      </span>
                    </td>
                    <td>{r.categoria.replaceAll('_', ' ')}</td>
                    <td>
                      <Badge valor={r.urgencia} tipo="urgencia" />
                    </td>
                    <td>
                      <Badge valor={r.estado} />
                    </td>
                    <td className="celda-menor">{r.fecha_recepcion}</td>
                    <td className="celda-menor">{r.fecha_tope || '—'}</td>
                    <td>
                      <Link
                        to={`/panel/reclamos/${r.id_reclamo}`}
                        className="btn btn--ghost btn--sm"
                      >
                        Ver
                        {icono('flecha')}
                      </Link>
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

export default ListaReclamos;
