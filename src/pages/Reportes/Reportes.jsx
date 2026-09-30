import { useCallback, useEffect, useState } from 'react';
import {
  listarReportes,
  obtenerReporte,
  generarReporteDiario,
  generarReporteMensual,
  descargarReporteExcel,
} from '../../api/reportes';
import { Alerta, Cargando, Modal, Vacio, humanizar } from '../../components/UI';
import { icono } from '../../components/Iconos';
import { Barras, Torta } from '../../components/Graficos';

const TIPOS = {
  operativo_diario: 'Operativo diario',
  regulatorio_mensual: 'Regulatorio mensual',
};

const GENERADORES = {
  operativo_diario: generarReporteDiario,
  regulatorio_mensual: generarReporteMensual,
};

/**
 * Etiqueta en español y tono de cada métrica. El tono es la gravedad: lo que
 * está vencido o crítico se ve en rojo sin necesidad de leer el número.
 *
 * `porcentaje_cumplimiento` va aparte porque es 0-100 y los conteos son 0-~15:
 * en las barras sharing las aplastaría contra cero.
 */
const METRICAS = {
  operativo_diario: {
    ingresados: { etiqueta: 'Ingresados', tono: 'info' },
    en_atencion: { etiqueta: 'En atención', tono: 'azul' },
    proximos_vencer: { etiqueta: 'Próximos a vencer', tono: 'aviso' },
    vencidos: { etiqueta: 'Vencidos', tono: 'peligro' },
    criticos: { etiqueta: 'Críticos', tono: 'peligro' },
  },
  regulatorio_mensual: {
    total_ingresados: { etiqueta: 'Ingresados', tono: 'info' },
    total_cerrados: { etiqueta: 'Cerrados', tono: 'exito' },
    total_vencidos: { etiqueta: 'Vencidos', tono: 'peligro' },
  },
};

/** El histórico viene como { clave: valor }; fuera los textos y los no-números. */
const aBarras = (datos, mapa) =>
  Object.entries(mapa)
    .filter(([clave]) => typeof datos[clave] === 'number')
    .map(([clave, { etiqueta, tono }]) => ({
      etiqueta,
      tono,
      valor: datos[clave],
    }));

const Reportes = () => {
  const [reportes, setReportes] = useState([]);
  const [detalle, setDetalle] = useState(null);
  const [error, setError] = useState(null);
  // La generacion de un reporte se confirma en ventana emergente: es un proceso
  // que tarda y del que el usuario quiere saber que quedo guardado.
  const [generado, setGenerado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [generando, setGenerando] = useState(false);
  const [descargando, setDescargando] = useState(null);
  const [tipo, setTipo] = useState('operativo_diario');
  // Vacío significa "el mes anterior", que es el período cerrado que reporta
  // el job del día 1. Se llena solo cuando el usuario elige un mes puntual,
  // porque el mensual siempre cae en el mes anterior si no se indica otro.
  const [periodo, setPeriodo] = useState('');

  // `get_all` del backend ordena por id_reporte desc, así que el más reciente
  // del tipo es el primero de la lista.
  const ultimo = reportes.find((r) => r.tipo_reporte === tipo) || null;
  const ultimoId = ultimo?.id_reporte ?? null;
  // El detalle solo vale mientras sea del reporte que se está mirando. Al
  // cambiar de tipo el anterior queda invalidado aquí, sin setState en el
  // efecto y sin parpadeo de "cargando" por un estado que ya se sabe obsolete.
  const datos = detalle?.id_reporte === ultimoId ? detalle.datos : null;

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      setReportes(await listarReportes());
      setError(null);
    } catch (err) {
      setError(err.mensaje || 'No se pudieron cargar los reportes');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Las métricas para los gráficos vienen del reporte con detalle, que el
  // listado no trae.
  useEffect(() => {
    if (ultimoId === null) return undefined;
    let vigente = true;
    obtenerReporte(ultimoId)
      .then((r) => {
        if (vigente) setDetalle(r);
      })
      .catch((err) => {
        if (vigente) setError(err.mensaje || 'No se pudo leer el contenido del reporte');
      });
    return () => {
      vigente = false;
    };
  }, [ultimoId]);

  const bajar = useCallback(async (reporte) => {
    const blob = await descargarReporteExcel(reporte.id_reporte);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // El `periodo` lo devuelve el backend en ambos endpoints; el id es el
    // respaldo para que el archivo nunca se llame "...-undefined.xlsx".
    a.download = `reporte-${reporte.tipo_reporte}-${reporte.periodo ?? reporte.id_reporte}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, []);

  const generar = async () => {
    setGenerando(true);
    setError(null);

    // Generación y descarga son dos pasos que pueden fallar por separado: si
    // solo falla la descarga el reporte ya quedó guardado, así que no se puede
    // reportar como error de generación.
    let nuevo;
    try {
      // El generador diario ignora el argumento; el mensual es el que lo usa.
      const r = await GENERADORES[tipo](periodo || undefined);
      nuevo = { ...r, tipo };
      await cargar();
    } catch (err) {
      setError(err.mensaje || 'No se pudo generar el reporte');
      setGenerando(false);
      return;
    }

    let descargado = true;
    try {
      // El backend ya devolvió el id, así que no hace falta pasar por la lista
      // para encontrar el archivo: un clic genera y baja.
      await bajar({
        id_reporte: nuevo.id_reporte,
        tipo_reporte: tipo,
        periodo: nuevo.periodo,
      });
    } catch (err) {
      descargado = false;
      setError(
        `El reporte #${nuevo.id_reporte} se generó y quedó guardado, pero la `
        + `descarga falló: ${err.mensaje || 'error desconocido'}. `
        + 'Podés bajarlo desde el historial.'
      );
    } finally {
      setGenerado({ ...nuevo, descargado });
      setGenerando(false);
    }
  };

  const descargar = async (reporte) => {
    setDescargando(reporte.id_reporte);
    setError(null);
    try {
      await bajar(reporte);
    } catch (err) {
      setError(err.mensaje || 'No se pudo descargar el archivo');
    } finally {
      setDescargando(null);
    }
  };

  const barras = datos ? aBarras(datos, METRICAS[tipo]) : [];
  const cumple = datos?.porcentaje_cumplimiento;
  const cerrados = datos?.total_cerrados ?? 0;
  const pendientes = Math.max((datos?.total_ingresados ?? 0) - cerrados, 0);

  return (
    <div className="form-pagina">
      <header className="pagina__encabezado">
        <div>
          <h1>Reportes</h1>
          <p>Genera y descarga los reportes operativos y regulatorios.</p>
        </div>
      </header>

      {error && <Alerta tipo="error" titulo="Error" onCerrar={() => setError(null)}>{error}</Alerta>}

      {generado && (
        <Modal titulo="Reporte generado" onCerrar={() => setGenerado(null)}>
          {generado.message || `Reporte generado.`} Quedó guardado con el ID{' '}
          <strong>#{generado.id_reporte}</strong>.{' '}
          {generado.descargado
            ? 'Su archivo de Excel ya se empezó a descargar.'
            : 'Podés bajarlo desde el historial.'}
        </Modal>
      )}

      <section className="card">
        <h2 className="card__titulo">Generar nuevo reporte</h2>
        <div className="acciones">
          <div className="campo">
            <label htmlFor="tipo_reporte">Tipo de reporte</label>
            <select
              id="tipo_reporte"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              disabled={generando}
            >
              <option value="operativo_diario">Operativo diario</option>
              <option value="regulatorio_mensual">Regulatorio mensual</option>
            </select>
          </div>
          {/* El diario es siempre el de hoy, así que el período solo aplica al
              mensual. Sin elegir nada se reporta el mes anterior ya cerrado. */}
          {tipo === 'regulatorio_mensual' && (
            <div className="campo">
              <label htmlFor="periodo_reporte">Mes a reportar</label>
              <input
                id="periodo_reporte"
                type="month"
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                disabled={generando}
              />
            </div>
          )}
          <button
            type="button"
            className="btn btn--primary"
            onClick={generar}
            disabled={generando}
          >
            {icono('documento')}
            {generando ? 'Generando...' : 'Generar y descargar'}
          </button>
        </div>
        <p className="card__texto">
          El sistema también genera el reporte diario automáticamente a las 23:00 y el
          mensual el primer día de cada mes. Si no eliges un mes, el mensual sale
          con los datos del mes anterior, que es el último período cerrado.
        </p>
      </section>

      <section className="card">
        <div className="card__cabecera">
          <div>
            <h2 className="card__titulo">
              {TIPOS[tipo] || humanizar(tipo)}
            </h2>
            {ultimo && (
              <p className="card__texto">
                Período <strong>{ultimo.periodo}</strong> · generado el{' '}
                {new Date(ultimo.fecha_generacion).toLocaleString('es-CO')}
              </p>
            )}
          </div>
          <button type="button" className="btn btn--ghost btn--sm" onClick={cargar}>
            {icono('refrescar')}
            Actualizar
          </button>
        </div>

        {cargando ? (
          <Cargando />
        ) : !ultimo ? (
          <Vacio titulo="Sin reportes de este tipo">
            Genera el primero con el botón de arriba.
          </Vacio>
        ) : !datos ? (
          <Cargando texto="Leyendo el reporte..." />
        ) : (
          <div className="reporte-graficos">
            {/* Un mes sin reclamos deja todo en cero y la torta sin dibujar,
                lo que parece un gráfico roto. Se aclara que es un período
                sin movimiento. */}
            {tipo === 'regulatorio_mensual' && datos.total_ingresados === 0 && (
              <p className="reporte-sin-movimiento">
                No se registraron reclamos en <strong>{ultimo.periodo}</strong>. Los
                indicadores en cero son correctos: ese mes no tuvo movimiento.
              </p>
            )}
            <div>
              <h3 className="card__titulo">Indicadores</h3>
              <Barras datos={barras} />
            </div>

            {/* Solo el mensual tiene una relación parte-todo real: el diario
                suma métricas que se solapan y la torta las contaría dos veces. */}
            {tipo === 'regulatorio_mensual' && (
              <div>
                <h3 className="card__titulo">Cierre del período</h3>
                <Torta
                  datos={[
                    { etiqueta: 'Cerrados', valor: cerrados, tono: 'exito' },
                    { etiqueta: 'Pendientes', valor: pendientes, tono: 'peligro' },
                  ]}
                  centro={`${cumple ?? 0}%`}
                  centroTitulo="cumplimiento"
                />
              </div>
            )}
          </div>
        )}
      </section>

      <section className="card">
        <div className="card__cabecera">
          <h2 className="card__titulo">Historial</h2>
        </div>

        {cargando ? (
          <Cargando />
        ) : reportes.length === 0 ? (
          <Vacio titulo="Sin reportes">Genera el primero usando el botón de arriba.</Vacio>
        ) : (
          <ul className="historial-reportes">
            {reportes.map((r) => (
              <li key={r.id_reporte}>
                <div>
                  <strong>{TIPOS[r.tipo_reporte] || humanizar(r.tipo_reporte)}</strong>
                  <span className="celda-menor">
                    {r.periodo} · {new Date(r.fecha_generacion).toLocaleString('es-CO')}
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn--outline btn--sm"
                  onClick={() => descargar(r)}
                  disabled={descargando === r.id_reporte}
                >
                  {icono('descargar')}
                  {descargando === r.id_reporte ? 'Descargando...' : 'Excel'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default Reportes;
