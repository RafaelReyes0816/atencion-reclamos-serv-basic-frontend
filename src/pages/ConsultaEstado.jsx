import { useState } from 'react';
import { Link } from 'react-router-dom';
import { consultarEstado } from '../api/reclamos';
import { Alerta, Badge, humanizar } from '../components/UI';
import { icono } from '../components/Iconos';

const PASOS = ['Registrado', 'Clasificado', 'En atención', 'Resuelto', 'Cerrado'];

const ORDEN_ESTADO = {
  registrado: 0,
  clasificado: 1,
  en_atencion_tecnica: 2,
  en_atencion_comercial: 2,
  escalado: 2,
  resuelto: 3,
  cerrado: 4,
};

const ConsultaEstado = () => {
  const [busqueda, setBusqueda] = useState('');
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);
  const [consultando, setConsultando] = useState(false);

  const buscar = async (e) => {
    e.preventDefault();
    setConsultando(true);
    setError(null);
    setResultado(null);
    try {
      setResultado(await consultarEstado(busqueda.trim()));
    } catch {
      setError('No encontramos ningún reclamo con ese dato. Verifica el número.');
    } finally {
      setConsultando(false);
    }
  };

  const pasoActual = resultado ? ORDEN_ESTADO[resultado.estado] ?? 0 : -1;

  return (
    <div className="consulta">
      <header className="consulta__encabezado">
        <span className="consulta__logo">{icono('gota')}</span>
        <div>
          <h1>Consulta el estado de tu reclamo</h1>
          <p>Ingresa el número de reclamo o tu documento. No necesitas crear una cuenta.</p>
        </div>
      </header>

      <form className="consulta__buscador" onSubmit={buscar}>
        <div className="buscador buscador--grande">
          {icono('buscar')}
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Ej. 9 o 12345678"
            aria-label="Número de reclamo o documento"
            required
          />
        </div>
        <button type="submit" className="btn btn--primary" disabled={consultando}>
          {consultando ? 'Buscando...' : 'Consultar'}
        </button>
      </form>

      {error && <Alerta tipo="aviso" titulo="Sin resultados">{error}</Alerta>}

      {resultado && (
        <section className="card consulta__resultado">
          <div className="consulta__resultado-cabecera">
            <div>
              <small>Reclamo</small>
              <h2>#{resultado.id_reclamo}</h2>
            </div>
            <Badge valor={resultado.estado} />
          </div>

          <ol className="pasos">
            {PASOS.map((paso, i) => (
              <li
                key={paso}
                className={`pasos__paso ${i < pasoActual ? 'pasos__paso--hecho' : ''} ${
                  i === pasoActual ? 'pasos__paso--actual' : ''
                }`}
              >
                <span className="pasos__marca">{i < pasoActual ? icono('check') : i + 1}</span>
                <span className="pasos__texto">{paso}</span>
              </li>
            ))}
          </ol>

          <dl className="lista-datos lista-datos--horizontal">
            <div className="lista-datos__item">
              <dt>Estado actual</dt>
              <dd>{humanizar(resultado.estado)}</dd>
            </div>
            {resultado.fecha_tope && (
              <div className="lista-datos__item">
                <dt>Fecha límite</dt>
                <dd>{resultado.fecha_tope}</dd>
              </div>
            )}
          </dl>

          <p className="consulta__nota">
            Para ver el detalle completo y los avances del trabajo,{' '}
            <Link to="/">inicia sesión</Link> con tu documento.
          </p>
        </section>
      )}
    </div>
  );
};

export default ConsultaEstado;
