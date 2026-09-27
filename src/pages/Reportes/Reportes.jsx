import { useCallback, useEffect, useState } from 'react';
import {
  listarReportes,
  generarReporteDiario,
  generarReporteMensual,
  descargarReporteExcel,
} from '../../api/reportes';
import { Alerta, Cargando, Vacio, humanizar } from '../../components/UI';
import { icono } from '../../components/Iconos';

const TIPOS = {
  operativo_diario: 'Operativo diario',
  regulatorio_mensual: 'Regulatorio mensual',
};

const Reportes = () => {
  const [reportes, setReportes] = useState([]);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [generando, setGenerando] = useState(null);
  const [descargando, setDescargando] = useState(null);

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

  const generar = async (tipo, fn) => {
    setGenerando(tipo);
    setError(null);
    setExito(null);
    try {
      const r = await fn();
      setExito(r.message || `Reporte ${TIPOS[tipo]} generado (ID ${r.id_reporte}).`);
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
      {exito && <Alerta tipo="exito" onCerrar={() => setExito(null)}>{exito}</Alerta>}

      <section className="card">
        <h2 className="card__titulo">Generar nuevo reporte</h2>
        <div className="acciones">
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => generar('operativo_diario', generarReporteDiario)}
            disabled={generando !== null}
          >
            {icono('documento')}
            {generando === 'operativo_diario' ? 'Generando...' : 'Reporte diario'}
          </button>
          <button
            type="button"
            className="btn btn--accent"
            onClick={() => generar('regulatorio_mensual', generarReporteMensual)}
            disabled={generando !== null}
          >
            {icono('documento')}
            {generando === 'regulatorio_mensual' ? 'Generando...' : 'Reporte mensual'}
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
            Genera el primer reporte usando los botones de arriba.
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
