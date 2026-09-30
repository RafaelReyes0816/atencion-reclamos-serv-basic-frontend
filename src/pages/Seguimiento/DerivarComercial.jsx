import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { crearDerivacion, obtenerDerivacion } from '../../api/seguimiento';
import { listarAreas } from '../../api/catalogos';
import { obtenerReclamo } from '../../api/reclamos';
import { Alerta, Badge, Cargando, Modal } from '../../components/UI';
import { icono } from '../../components/Iconos';

const DerivarComercial = () => {
  const { id } = useParams();
  const navegar = useNavigate();

  const [reclamo, setReclamo] = useState(null);
  const [areas, setAreas] = useState([]);
  const [formulario, setFormulario] = useState({
    area_comercial: '',
    fecha_derivacion: new Date().toISOString().slice(0, 10),
  });
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [cargando, setCargando] = useState(true);
  // La derivacion se confirma antes de volver al detalle del reclamo.
  const [derivada, setDerivada] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      try {
        const rec = await obtenerReclamo(id);
        setReclamo(rec);

        const yaTiene = await obtenerDerivacion(id).catch(() => null);
        if (yaTiene) {
          navegar(`/panel/reclamos/${id}/derivacion`, { replace: true });
          return;
        }

        const lista = await listarAreas();
        setAreas(lista);
        if (lista.length > 0) {
          setFormulario((f) => ({ ...f, area_comercial: lista[0].tipo }));
        }
      } catch (err) {
        setError(err.mensaje || 'No se pudo cargar la información');
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [id, navegar]);

  const enviar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await crearDerivacion({
        id_reclamo: parseInt(id),
        area_comercial: formulario.area_comercial,
        fecha_derivacion: formulario.fecha_derivacion,
      });
      setDerivada(true);
    } catch (err) {
      setError(err.mensaje || 'No se pudo crear la derivación');
    } finally {
      setEnviando(false);
    }
  };

  const cerrarDerivacion = () => {
    setDerivada(false);
    navegar(`/panel/reclamos/${id}`, { replace: true });
  };

  if (cargando) return <Cargando />;
  if (error && !reclamo) return <Alerta tipo="error" titulo="Error">{error}</Alerta>;
  if (!reclamo) return null;

  return (
    <div className="form-pagina">
      <header className="pagina__encabezado">
        <button type="button" className="btn btn--ghost" onClick={() => navegar(-1)}>
          {icono('volver')}
          Volver
        </button>
        <div>
          <h1>Derivar a área comercial</h1>
          <p>
            Reclamo #{reclamo.id_reclamo} · {reclamo.servicio} / {reclamo.categoria} ·{' '}
            <Badge valor={reclamo.estado} />
          </p>
        </div>
      </header>

      {error && <Alerta tipo="error" titulo="Error">{error}</Alerta>}

      {derivada && (
        <Modal titulo="Derivación registrada" onCerrar={cerrarDerivacion}>
          El reclamo #{reclamo.id_reclamo} quedó derivado al área{' '}
          <strong>{formulario.area_comercial.replaceAll('_', ' ')}</strong> el{' '}
          <strong>{formulario.fecha_derivacion}</strong>. Quedó en estado{' '}
          <strong>en atención comercial</strong>.
        </Modal>
      )}

      {areas.length === 0 && !error && (
        <Alerta tipo="aviso" titulo="Sin áreas comerciales">
          No hay áreas comerciales registradas. Un supervisor debe crearlas en Administración → Áreas
          Comerciales.
        </Alerta>
      )}

      <section className="card">
        <h2 className="card__titulo">Descripción del reclamo</h2>
        <p className="card__texto">{reclamo.descripcion}</p>
      </section>

      <form className="card form-grid" onSubmit={enviar}>
        <h2 className="card__titulo campo--ancho">Datos de la derivación</h2>

        <div className="campo campo--ancho">
          <label htmlFor="area_comercial">Área comercial</label>
          <select
            id="area_comercial"
            value={formulario.area_comercial}
            onChange={(e) => setFormulario({ ...formulario, area_comercial: e.target.value })}
            required
          >
            {areas.map((a) => (
              <option key={a.id_area} value={a.tipo}>
                {a.nombre} ({a.tipo})
              </option>
            ))}
          </select>
        </div>

        <div className="campo">
          <label htmlFor="fecha_derivacion">Fecha de derivación</label>
          <input
            id="fecha_derivacion"
            type="date"
            value={formulario.fecha_derivacion}
            onChange={(e) => setFormulario({ ...formulario, fecha_derivacion: e.target.value })}
            required
          />
        </div>

        <div className="form-grid__acciones">
          <button type="button" className="btn btn--outline" onClick={() => navegar(-1)}>
            Cancelar
          </button>
          <button type="submit" className="btn btn--accent" disabled={enviando || areas.length === 0}>
            {enviando ? 'Derivando...' : 'Derivar reclamo'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DerivarComercial;
