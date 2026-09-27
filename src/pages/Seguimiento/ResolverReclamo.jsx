import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth, esInterno } from '../../context/AuthContext';
import { obtenerReclamo, resolverReclamo } from '../../api/reclamos';
import { Alerta, Badge, Cargando } from '../../components/UI';
import { icono } from '../../components/Iconos';

const RESULTADOS = [
  ['resuelto', 'Resuelto — se atendió la solicitud'],
  ['descartado', 'Descartado — no aplica'],
  ['derivado', 'Derivado — enviado a otra área'],
];

const ResolverReclamo = () => {
  const { id } = useParams();
  const navegar = useNavigate();
  const { rol } = useAuth();

  const [reclamo, setReclamo] = useState(null);
  const [formulario, setFormulario] = useState({ resultado: 'resuelto' });
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const rec = await obtenerReclamo(id);
        setReclamo(rec);
        if (rec.resultado) setFormulario((f) => ({ ...f, resultado: rec.resultado }));
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
      await resolverReclamo(id, formulario);
      navegar(`/panel/reclamos/${id}`, { replace: true });
    } catch (err) {
      setError(err.mensaje || 'No se pudo resolver el reclamo');
    } finally {
      setEnviando(false);
    }
  };

  if (cargando) return <Cargando />;
  if (error && !reclamo) return <Alerta tipo="error" titulo="Error">{error}</Alerta>;
  if (!reclamo) return null;

  const yaResuelto = reclamo.estado === 'resuelto';
  const yaCerrado = reclamo.estado === 'cerrado';

  return (
    <div className="form-pagina">
      <header className="pagina__encabezado">
        <button type="button" className="btn btn--ghost" onClick={() => navegar(-1)}>
          {icono('volver')}
          Volver
        </button>
        <div>
          <h1>Resolver reclamo</h1>
          <p>
            Reclamo #{reclamo.id_reclamo} · <Badge valor={reclamo.estado} />
          </p>
        </div>
      </header>

      {yaCerrado && (
        <Alerta tipo="aviso" titulo="Reclamo cerrado">
          Un reclamo cerrado no se puede volver a resolver.
        </Alerta>
      )}

      {yaResuelto && !yaCerrado && (
        <Alerta tipo="info" titulo="Ya está resuelto">
          Un supervisor debe cerrarlo para completar el proceso.
        </Alerta>
      )}

      {!yaCerrado && (
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
          <label htmlFor="resultado">Resultado de la atención</label>
          <select
            id="resultado"
            name="resultado"
            value={formulario.resultado}
            onChange={(e) => setFormulario({ ...formulario, resultado: e.target.value })}
            required
          >
            {RESULTADOS.map(([v, t]) => (
              <option key={v} value={v}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="form-grid__acciones">
          <button type="button" className="btn btn--outline" onClick={() => navegar(-1)}>
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn--accent"
            disabled={enviando || (yaResuelto && !esInterno(rol))}
          >
            {enviando ? 'Guardando...' : 'Marcar como resuelto'}
          </button>
        </div>
      </form>
      )}
    </div>
  );
};

export default ResolverReclamo;
