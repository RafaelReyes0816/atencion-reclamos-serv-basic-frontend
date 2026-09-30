import { useCallback, useEffect, useState } from 'react';
import {
  listarReportes,
  generarReporteDiario,
  generarReporteMensual,
  descargarReporteExcel,
} from '../../api/reportes';
import { Alerta, Cargando, Modal, Vacio, humanizar } from '../../components/UI';
import { icono } from '../../components/Iconos';

const TIPOS = {
  operativo_diario: 'Operativo diario',
  regulatorio_mensual: 'Regulatorio mensual',
};

const GENERADORES = {
  operativo_diario: generarReporteDiario,
  regulatorio_mensual: generarReporteMensual,
};

const Reportes = () => {
  const [reportes, setReportes] = useState([]);
  const [error, setError] = useState(null);
  // La generacion de un reporte se confirma en ventana emergente: es un proceso
  // que tarda y del que el usuario quiere saber que quedo guardado.
  const [generado, setGenerado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [generando, setGenerando] = useState(null);
  const [descargando, setDescargando] = useState(null);
  const [tipo, setTipo] = useState('operativo_diario');

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

  const generar = async () => {
    setGenerando(tipo);
    setError(null);
    try {
      const r = await GENERADORES[tipo]();
      // El backend devuelve `message` e `id_reporte`; el tipo ya lo sabemos por el
      // selector de arriba, asi que no hace falta volver a buscar el reporte.
      setGenerado({ ...r, tipo });
      await cargar();
    } catch (err) {
      setError(err.mensaje || 'No se pudo generar el reporte');
    } finally {
      setGenerando(null);
    }
  };

  const descargar = async (reporte) => {
    setDescargando(reporte.id_reporte);
    setError(null);
    try {
      const blob = await descargarReporteExcel(reporte.id_reporte);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte-${reporte.tipo_reporte}-${reporte.periodo}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.mensaje || 'No se pudo descargar el archivo');
    } finally {
      setDescargando(null);
    }
  };

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
          <strong>#{generado.id_reporte}</strong> y ya podés descargarlo en Excel desde
          la tabla de abajo.
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
              disabled={generando !== null}
            >
              <option value="operativo_diario">Operativo diario</option>
              <option value="regulatorio_mensual">Regulatorio mensual</option>
            </select>
          </div>
          <button
            type="button"
            className="btn btn--primary"
            onClick={generar}
            disabled={generando !== null}
          >
            {icono('documento')}
            {generando ? 'Generando...' : 'Generar reporte'}
          </button>
        </div>
        <p className="card__texto">
          El sistema también genera el reporte diario automáticamente a las 23:00 y el
          mensual el primer día de cada mes.
        </p>
      </section>

      <section className="card">
        <div className="card__cabecera">
          <h2 className="card__titulo">Reportes generados</h2>
          <button type="button" className="btn btn--ghost btn--sm" onClick={cargar}>
            {icono('refrescar')}
            Actualizar
          </button>
        </div>

        {cargando ? (
          <Cargando />
        ) : reportes.length === 0 ? (
          <Vacio titulo="Sin reportes">
            Genera el primer reporte usando el botón de arriba.
          </Vacio>
        ) : (
          <div className="tabla-scroll">
            <table className="tabla">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tipo</th>
                  <th>Período</th>
                  <th>Generado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {reportes.map((r) => (
                  <tr key={r.id_reporte}>
                    <td className="celda-fuerte">#{r.id_reporte}</td>
                    <td>{TIPOS[r.tipo_reporte] || humanizar(r.tipo_reporte)}</td>
                    <td>{r.periodo}</td>
                    <td className="celda-menor">
                      {new Date(r.fecha_generacion).toLocaleString('es-CO')}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn--outline btn--sm"
                        onClick={() => descargar(r)}
                        disabled={descargando === r.id_reporte}
                      >
                        {icono('descargar')}
                        {descargando === r.id_reporte ? 'Descargando...' : 'Excel'}
                      </button>
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

export default Reportes;
