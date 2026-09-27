import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { cerrarReclamo, obtenerReclamo } from '../../api/reclamos';
import { Alerta, Badge, Cargando } from '../../components/UI';
import { icono } from '../../components/Iconos';

const CerrarReclamo = () => {
  const { id } = useParams();
  const navegar = useNavigate();

  const [reclamo, setReclamo] = useState(null);
  const [resultado, setResultado] = useState('resuelto');
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const rec = await obtenerReclamo(id);
        setReclamo(rec);
        if (rec.resultado) setResultado(rec.resultado);
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
      await cerrarReclamo(id, { resultado });
      navegar(`/panel/reclamos/${id}`, { replace: true });
    } catch (err) {
      setError(err.mensaje || 'No se pudo cerrar el reclamo');
    } finally {
      setEnviando(false);
    }
  };

  if (cargando) return <Cargando />;
  if (error && !reclamo) return <Alerta tipo="error" titulo="Error">{error}</Alerta>;
  if (!reclamo) return null;

  const puedeCerrar = reclamo.estado === 'resuelto';

  return (
    <div className="form-pagina">
      <header className="pagina__encabezado">
        <button type="button" className="btn btn--ghost" onClick={() => navegar(-1)}>
          {icono('volver')}
          Volver
        </button>
        <div>
          <h1>Cerrar reclamo</h1>
          <p>
            Reclamo #{reclamo.id_reclamo} · <Badge valor={reclamo.estado} />
          </p>
        </div>
      </header>

      {!puedeCerrar && (
        <Alerta tipo="aviso" titulo="El reclamo no está listo para cerrarse">
          Solo se puede cerrar un reclamo en estado <strong>resuelto</strong>. Este reclamo está{' '}
          <strong>{reclamo.estado?.replaceAll('_', ' ')}</strong>. Debes resolverlo primero.
        </Alerta>
      )}

      {puedeCerrar && (
      <form className="card form-grid" onSubmit={enviar}>
        {error && <Alerta tipo="error">{error}</Alerta>}

        <div className="resumen-reclamo">
          <div>
            <small>Servicio</small>
            <strong>{reclamo.servicio}</strong>
          </div>
          <div>
            <small>Categoría</small>
            <strong>{reclamo.categoria}</strong>
          </div>
          <div>
            <small>Urgencia</small>
            <strong>{reclamo.urgencia}</strong>
          </div>
          <div>
            <small>Recepción</small>
            <strong>{reclamo.fecha_recepcion}</strong>
          </div>
        </div>

        <div className="campo campo--ancho">
          <label htmlFor="resultado">Resultado final</label>
          <select
            id="resultado"
            name="resultado"
            value={resultado}
            onChange={(e) => setResultado(e.target.value)}
            required
          >
            <option value="resuelto">Resuelto</option>
            <option value="descartado">Descartado</option>
            <option value="derivado">Derivado</option>
          </select>
        </div>

        <div className="form-grid__acciones">
          <button type="button" className="btn btn--outline" onClick={() => navegar(-1)}>
            Cancelar
          </button>
          <button type="submit" className="btn btn--primary" disabled={enviando}>
            {enviando ? 'Cerrando...' : 'Confirmar cierre'}
          </button>
        </div>
      </form>
      )}
    </div>
  );
};

export default CerrarReclamo;
