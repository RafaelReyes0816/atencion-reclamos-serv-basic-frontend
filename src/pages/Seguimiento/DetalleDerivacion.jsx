import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { obtenerDerivacion, actualizarDerivacion } from '../../api/seguimiento';
import { obtenerReclamo } from '../../api/reclamos';
import { Alerta, Badge, Cargando } from '../../components/UI';
import { icono } from '../../components/Iconos';

const ESTADOS = { derivada: 'Derivada', resuelta: 'Resuelta' };

const DetalleDerivacion = () => {
  const { id } = useParams();
  const navegar = useNavigate();

  const [reclamo, setReclamo] = useState(null);
  const [derivacion, setDerivacion] = useState(null);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const rec = await obtenerReclamo(id);
        setReclamo(rec);
        const der = await obtenerDerivacion(id);
        setDerivacion(der);
      } catch (err) {
        if (err.response?.status === 404) {
          setError('Este reclamo no tiene una derivación comercial.');
        } else {
          setError(err.mensaje || 'No se pudo cargar la derivación');
        }
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [id]);

  const marcarResuelta = async () => {
    setEnviando(true);
    setError(null);
    setExito(null);
    try {
      const actualizada = await actualizarDerivacion(derivacion.id_derivacion, {
        estado_derivacion: 'resuelta',
      });
      setDerivacion(actualizada);
      setExito('Derivación marcada como resuelta.');
    } catch (err) {
      setError(err.mensaje || 'No se pudo actualizar la derivación');
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
          <h1>Derivación comercial</h1>
          {reclamo && <p>Reclamo #{reclamo.id_reclamo}</p>}
        </div>
        {derivacion && <Badge valor={derivacion.estado_derivacion} />}
      </header>

      {error && <Alerta tipo="error" titulo="Error">{error}</Alerta>}
      {exito && <Alerta tipo="exito">{exito}</Alerta>}

      {derivacion && (
        <div className="detalle__grid">
          <section className="card">
            <h2 className="card__titulo">Datos de la derivación</h2>
            <dl className="lista-datos">
              <div className="lista-datos__item">
                <dt>Área comercial</dt>
                <dd>{derivacion.area_comercial}</dd>
              </div>
              <div className="lista-datos__item">
                <dt>Fecha de derivación</dt>
                <dd>{derivacion.fecha_derivacion}</dd>
              </div>
              <div className="lista-datos__item">
                <dt>Estado</dt>
                <dd>{ESTADOS[derivacion.estado_derivacion] || derivacion.estado_derivacion}</dd>
              </div>
            </dl>
          </section>

          <aside className="detalle__aside">
            {reclamo && (
              <section className="card">
                <h2 className="card__titulo">Reclamo</h2>
                <dl className="lista-datos">
                  <div className="lista-datos__item">
                    <dt>Servicio</dt>
                    <dd>{reclamo.servicio}</dd>
                  </div>
                  <div className="lista-datos__item">
                    <dt>Categoría</dt>
                    <dd>{reclamo.categoria}</dd>
                  </div>
                  <div className="lista-datos__item">
                    <dt>Estado</dt>
                    <dd><Badge valor={reclamo.estado} /></dd>
                  </div>
                </dl>
              </section>
            )}

            {derivacion.estado_derivacion !== 'resuelta' && (
              <section className="card">
                <h2 className="card__titulo">Acciones</h2>
                <button
                  type="button"
                  className="btn btn--primary btn--bloque"
                  onClick={marcarResuelta}
                  disabled={enviando}
                >
                  {icono('check')}
                  {enviando ? 'Actualizando...' : 'Marcar como resuelta'}
                </button>
              </section>
            )}
          </aside>
        </div>
      )}
    </div>
  );
};

export default DetalleDerivacion;
