import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { asignarPlazo, obtenerReclamo } from '../../api/reclamos';
import { normativaVigente, listarNormativas } from '../../api/catalogos';
import { Alerta, Badge, Cargando, Modal } from '../../components/UI';
import { icono } from '../../components/Iconos';

const AsignarPlazo = () => {
  const { id } = useParams();
  const navegar = useNavigate();

  const [reclamo, setReclamo] = useState(null);
  const [normativas, setNormativas] = useState([]);
  const [formulario, setFormulario] = useState({ id_normativa: '', fecha_tope: '' });
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [cargando, setCargando] = useState(true);
  // El plazo asignado se confirma en ventana emergente: es el dato que el
  // ciudadano ve y por eso conviene que quede a la vista.
  const [asignado, setAsignado] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      try {
        const rec = await obtenerReclamo(id);
        setReclamo(rec);

        // /normativa/vigente exige la tupla exacta; si no hay, se listan todas como alternativa.
        let lista = [];
        try {
          const vigente = await normativaVigente({
            servicio: rec.servicio,
            categoria: rec.categoria,
            urgencia: rec.urgencia,
          });
          if (vigente) lista = [vigente];
        } catch {
          lista = [];
        }
        if (lista.length === 0) {
          const todas = await listarNormativas();
          lista = todas.filter(
            (n) => n.servicio === rec.servicio && n.categoria === rec.categoria
          );
          if (lista.length === 0) lista = todas;
        }
        setNormativas(lista);

        const sugerida = new Date();
        sugerida.setDate(sugerida.getDate() + (lista[0]?.plazo_maximo_dias ?? 15));
        setFormulario({
          id_normativa: lista[0]?.id_normativa ?? '',
          fecha_tope: sugerida.toISOString().slice(0, 10),
        });
      } catch (err) {
        setError(err.mensaje || 'No se pudo cargar la informacion del reclamo');
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
      await asignarPlazo(id, {
        id_normativa: parseInt(formulario.id_normativa),
        fecha_tope: formulario.fecha_tope,
      });
      setAsignado(true);
    } catch (err) {
      setError(err.mensaje || 'No se pudo asignar el plazo');
    } finally {
      setEnviando(false);
    }
  };

  // El detalle del reclamo se abre recien al cerrar la confirmacion del plazo.
  const cerrarAsignacion = () => {
    setAsignado(false);
    navegar(`/panel/reclamos/${id}`, { replace: true });
  };

  if (cargando) return <Cargando />;
  if (error && !reclamo) return <Alerta tipo="error" titulo="Error">{error}</Alerta>;
  if (!reclamo) return null;

  const normSel = normativas.find(
    (n) => n.id_normativa === parseInt(formulario.id_normativa)
  );
  const hoy = new Date().toISOString().slice(0, 10);

  return (
    <div className="form-pagina">
      <header className="pagina__encabezado">
        <button type="button" className="btn btn--ghost" onClick={() => navegar(-1)}>
          {icono('volver')}
          Volver
        </button>
        <div>
          <h1>Asignar plazo</h1>
          <p>
            Reclamo #{reclamo.id_reclamo} · {reclamo.servicio} / {reclamo.categoria} ·{' '}
            <Badge valor={reclamo.estado} />
          </p>
        </div>
      </header>

      {normativas.length === 0 && (
        <Alerta tipo="aviso" titulo="Sin normativa">
          No hay normas de plazo configuradas. Un supervisor o administrador debe crearlas en
          Administración → Normativa.
        </Alerta>
      )}

      {asignado && (
        <Modal titulo="Plazo asignado" onCerrar={cerrarAsignacion}>
          El reclamo #{reclamo.id_reclamo} tiene como fecha límite{' '}
          <strong>{formulario.fecha_tope}</strong>
          {normSel && ` según la norma de ${normSel.plazo_maximo_dias} día(s)`}. Desde
          ahora corre el cómputo del plazo regulatorio.
        </Modal>
      )}

      <form className="card form-grid" onSubmit={enviar}>
        {error && <Alerta tipo="error">{error}</Alerta>}

        <div className="campo campo--ancho">
          <label htmlFor="normativa">Normativa aplicable</label>
          <select
            id="normativa"
            name="id_normativa"
            value={formulario.id_normativa}
            onChange={(e) => setFormulario({ ...formulario, id_normativa: e.target.value })}
            required
          >
            <option value="" disabled>
              Selecciona una norma
            </option>
            {normativas.map((n) => (
              <option key={n.id_normativa} value={n.id_normativa}>
                {n.servicio} / {n.categoria} / {n.urgencia} — {n.plazo_maximo_dias} días
              </option>
            ))}
          </select>
          {normSel && (
            <small className="campo__ayuda">
              Plazo máximo {normSel.plazo_maximo_dias} días · vigente desde{' '}
              {normSel.vigencia_desde}
            </small>
          )}
        </div>

        <div className="campo">
          <label htmlFor="fecha_tope">Fecha límite</label>
          <input
            id="fecha_tope"
            type="date"
            name="fecha_tope"
            min={hoy}
            value={formulario.fecha_tope}
            onChange={(e) => setFormulario({ ...formulario, fecha_tope: e.target.value })}
            required
          />
          <small className="campo__ayuda">No puede ser anterior a hoy.</small>
        </div>

        <div className="form-grid__acciones">
          <button type="button" className="btn btn--outline" onClick={() => navegar(-1)}>
            Cancelar
          </button>
          <button type="submit" className="btn btn--primary" disabled={enviando || normativas.length === 0}>
            {enviando ? 'Guardando...' : 'Asignar plazo'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AsignarPlazo;
