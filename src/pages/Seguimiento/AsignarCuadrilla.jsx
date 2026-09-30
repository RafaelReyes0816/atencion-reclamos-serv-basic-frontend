import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { crearOrden, obtenerOrdenPorReclamo } from '../../api/seguimiento';
import { cuadrillasDisponibles } from '../../api/catalogos';
import { obtenerReclamo } from '../../api/reclamos';
import { Alerta, Badge, Cargando, Modal } from '../../components/UI';
import { icono } from '../../components/Iconos';

// Etiqueta de una opcion: el nombre manda, la carga explica por que la cuadrilla
// esta o no elegida. La saturada se muestra en vez del contacto, porque ahi lo
// relevante es que no entra.
const etiquetar = (c) =>
  c.disponible
    ? `${c.nombre} — ${c.ordenes_activas} de ${c.capacidad} órdenes · ${c.contacto || 'sin contacto'}`
    : `${c.nombre} — sin cupo (${c.ordenes_activas}/${c.capacidad})`;

const AsignarCuadrilla = () => {
  const { id } = useParams();
  const navegar = useNavigate();

  const [reclamo, setReclamo] = useState(null);
  const [cuadrillas, setCuadrillas] = useState([]);
  const [formulario, setFormulario] = useState({
    id_cuadrilla: '',
    fecha_asignacion: new Date().toISOString().slice(0, 10),
  });
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [cargando, setCargando] = useState(true);
  // La orden de trabajo creada se confirma antes de pasar a registrar avances.
  const [asignada, setAsignada] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      try {
        const rec = await obtenerReclamo(id);
        setReclamo(rec);

        const yaTieneOrden = await obtenerOrdenPorReclamo(id).catch(() => null);
        if (yaTieneOrden) {
          navegar(`/panel/reclamos/${id}/avances`, { replace: true });
          return;
        }

        // El backend ya las ordena de menos a mas cargadas, asi que la primera
        // con cupo es la mejor reparto y no la primera de la lista a secas.
        const lista = await cuadrillasDisponibles(rec.servicio);
        setCuadrillas(lista);
        const conCupo = lista.find((c) => c.disponible);
        if (conCupo) {
          setFormulario((f) => ({ ...f, id_cuadrilla: String(conCupo.id_cuadrilla) }));
        }
      } catch (err) {
        setError(err.mensaje || 'No se pudo cargar la información');
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [id, navegar]);

  const elegida = cuadrillas.find((c) => String(c.id_cuadrilla) === formulario.id_cuadrilla);
  const hayCuadrillas = cuadrillas.length > 0;
  const conCupo = cuadrillas.some((c) => c.disponible);

  const enviar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await crearOrden({
        id_reclamo: parseInt(id),
        id_cuadrilla: parseInt(formulario.id_cuadrilla),
        fecha_asignacion: formulario.fecha_asignacion,
      });
      setAsignada(true);
    } catch (err) {
      setError(err.mensaje || 'No se pudo asignar la cuadrilla');
    } finally {
      setEnviando(false);
    }
  };

  const cerrarAsignacion = () => {
    setAsignada(false);
    navegar(`/panel/reclamos/${id}/avances`, { replace: true });
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
          <h1>Asignar cuadrilla</h1>
          <p>
            Reclamo #{reclamo.id_reclamo} · {reclamo.servicio} · <Badge valor={reclamo.estado} />
          </p>
        </div>
      </header>

      {error && <Alerta tipo="error" titulo="Error">{error}</Alerta>}

      {asignada && (
        <Modal titulo="Orden de trabajo creada" onCerrar={cerrarAsignacion}>
          La cuadrilla <strong>{elegida?.nombre}</strong> quedó asignada al reclamo #
          {reclamo.id_reclamo} con fecha de asignación{' '}
          <strong>{formulario.fecha_asignacion}</strong>. Al continuar podés registrar
          los avances del trabajo.
        </Modal>
      )}

      {hayCuadrillas && !conCupo && (
        <Alerta tipo="aviso" titulo="Sin cuadrillas con cupo">
          Todas las cuadrillas de <strong>{reclamo.servicio}</strong> están en su
          capacidad máxima. Un supervisor debe resolver trabajo en curso o ampliar
          la capacidad en Administración → Cuadrillas.
        </Alerta>
      )}

      {!hayCuadrillas && !error && (
        <Alerta tipo="aviso" titulo="Sin cuadrillas disponibles">
          No hay cuadrillas de especialidad <strong>{reclamo.servicio}</strong> registradas.
          Un supervisor debe crearlas en Administración → Cuadrillas.
        </Alerta>
      )}

      <section className="card">
        <h2 className="card__titulo">Descripción del reclamo</h2>
        <p className="card__texto">{reclamo.descripcion}</p>
        <dl className="lista-datos lista-datos--horizontal">
          <div className="lista-datos__item">
            <dt>Cuenta</dt>
            <dd>{reclamo.servicio === 'agua' ? 'Agua' : 'Luz eléctrica'}</dd>
          </div>
          {reclamo.numero_medidor && (
            <div className="lista-datos__item">
              <dt>Medidor</dt>
              <dd>{reclamo.numero_medidor}</dd>
            </div>
          )}
        </dl>
      </section>

      <form className="card form-grid" onSubmit={enviar}>
        <h2 className="card__titulo campo--ancho">Datos de la orden</h2>

        <div className="campo campo--ancho">
          <label htmlFor="cuadrilla">Cuadrilla</label>
          <select
            id="cuadrilla"
            value={formulario.id_cuadrilla}
            onChange={(e) => setFormulario({ ...formulario, id_cuadrilla: e.target.value })}
            required
            disabled={!conCupo}
          >
            {/* Sin cupo: placeholder, porque elegir de la lista no seria posible. */}
            {!conCupo && <option value="">Ninguna con cupo disponible</option>}
            {cuadrillas.map((c) => (
              <option key={c.id_cuadrilla} value={c.id_cuadrilla} disabled={!c.disponible}>
                {etiquetar(c)}
              </option>
            ))}
          </select>
          <small className="campo__ayuda">
            Se muestran las cuadrillas de especialidad <strong>{reclamo.servicio}</strong>,
            de menos a más cargadas. Cada una admite hasta{' '}
            <strong>{elegida?.capacidad ?? '—'}</strong> órdenes activas a la vez.
          </small>
        </div>

        <div className="campo">
          <label htmlFor="fecha_asignacion">Fecha de asignación</label>
          <input
            id="fecha_asignacion"
            type="date"
            value={formulario.fecha_asignacion}
            onChange={(e) => setFormulario({ ...formulario, fecha_asignacion: e.target.value })}
            required
          />
        </div>

        <div className="form-grid__acciones">
          <button type="button" className="btn btn--outline" onClick={() => navegar(-1)}>
            Cancelar
          </button>
          <button type="submit" className="btn btn--primary" disabled={enviando || !conCupo}>
            {enviando ? 'Asignando...' : 'Asignar cuadrilla'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AsignarCuadrilla;
