import { useCallback, useEffect, useState } from 'react';
import { useAuth, esGestion } from '../../context/AuthContext';
import { listarCuadrillas, crearCuadrilla, actualizarCuadrilla, eliminarCuadrilla } from '../../api/catalogos';
import { Alerta, Cargando, Modal, Vacio } from '../../components/UI';
import { icono } from '../../components/Iconos';

const VACIO = { nombre: '', especialidad: 'agua', contacto: '', capacidad: 3 };

const Cuadrillas = () => {
  const { rol } = useAuth();
  const puedeEditar = esGestion(rol);

  const [cuadrillas, setCuadrillas] = useState([]);
  const [formulario, setFormulario] = useState(VACIO);
  const [editando, setEditando] = useState(null);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);
  // El alta se confirma en ventana emergente; editar y eliminar siguen con alerta
  // en linea porque son cambios de menor consecuencia.
  const [creada, setCreada] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      setCuadrillas(await listarCuadrillas());
      setError(null);
    } catch (err) {
      setError(err.mensaje || 'No se pudieron cargar las cuadrillas');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const limpiar = () => {
    setFormulario(VACIO);
    setEditando(null);
  };

  const guardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    setExito(null);
    try {
      const cuerpo = { ...formulario, capacidad: parseInt(formulario.capacidad) };
      if (editando) {
        await actualizarCuadrilla(editando, cuerpo);
        setExito('Cuadrilla actualizada.');
      } else {
        const creada = await crearCuadrilla(cuerpo);
        setCreada(creada);
      }
      limpiar();
      await cargar();
    } catch (err) {
      setError(err.response?.data?.detail || err.mensaje || 'No se pudo guardar');
    } finally {
      setGuardando(false);
    }
  };

  const editar = (c) => {
    setFormulario({
      nombre: c.nombre,
      especialidad: c.especialidad,
      contacto: c.contacto || '',
      capacidad: c.capacidad,
    });
    setEditando(c.id_cuadrilla);
  };

  const borrar = async (c) => {
    if (!window.confirm(`¿Eliminar la cuadrilla "${c.nombre}"?`)) return;
    setError(null);
    try {
      await eliminarCuadrilla(c.id_cuadrilla);
      setExito('Cuadrilla eliminada.');
      if (editando === c.id_cuadrilla) limpiar();
      await cargar();
    } catch (err) {
      setError(
        err.response?.status === 409
          ? 'No se puede eliminar: tiene órdenes de trabajo asignadas.'
          : err.mensaje || 'No se pudo eliminar'
      );
    }
  };

  return (
    <div className="form-pagina">
      <header className="pagina__encabezado">
        <div>
          <h1>Cuadrillas técnicas</h1>
          <p>Equipos de campo disponibles para atender reclamos en campo.</p>
        </div>
      </header>

      {error && <Alerta tipo="error" titulo="Error" onCerrar={() => setError(null)}>{error}</Alerta>}
      {exito && <Alerta tipo="exito" onCerrar={() => setExito(null)}>{exito}</Alerta>}

      {creada && (
        <Modal titulo="Cuadrilla registrada" onCerrar={() => setCreada(null)}>
          La cuadrilla <strong>{creada.nombre}</strong> quedó creada con una capacidad
          de <strong>{creada.capacidad}</strong> trabajo(s) simultáneo(s) y ya está
          disponible para asignar.
        </Modal>
      )}

      {puedeEditar && (
        <form className="card form-grid" onSubmit={guardar}>
          <h2 className="card__titulo campo--ancho">
            {editando ? `Editando #${editando}` : 'Nueva cuadrilla'}
          </h2>

          <div className="campo">
            <label htmlFor="nombre">Nombre</label>
            <input
              id="nombre"
              value={formulario.nombre}
              onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })}
              placeholder="Cuadrilla Norte"
              required
            />
          </div>

          <div className="campo">
            <label htmlFor="especialidad">Especialidad</label>
            <select
              id="especialidad"
              value={formulario.especialidad}
              onChange={(e) => setFormulario({ ...formulario, especialidad: e.target.value })}
            >
              <option value="agua">Agua</option>
              <option value="luz">Luz</option>
            </select>
          </div>

          <div className="campo">
            <label htmlFor="contacto">Contacto</label>
            <input
              id="contacto"
              value={formulario.contacto}
              onChange={(e) => setFormulario({ ...formulario, contacto: e.target.value })}
              placeholder="3105550100"
              minLength="6"
              required
            />
          </div>

          <div className="campo">
            <label htmlFor="capacidad">Capacidad de atención</label>
            <input
              id="capacidad"
              type="number"
              min="1"
              value={formulario.capacidad}
              onChange={(e) => setFormulario({ ...formulario, capacidad: e.target.value })}
              required
            />
          </div>

          <div className="form-grid__acciones">
            {editando && (
              <button type="button" className="btn btn--ghost" onClick={limpiar}>
                Cancelar
              </button>
            )}
            <button type="submit" className="btn btn--primary" disabled={guardando}>
              {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear cuadrilla'}
            </button>
          </div>
        </form>
      )}

      <section className="card">
        <div className="card__cabecera">
          <h2 className="card__titulo">Cuadrillas</h2>
          <span className="contador-mini">{cuadrillas.length}</span>
        </div>

        {cargando ? (
          <Cargando />
        ) : cuadrillas.length === 0 ? (
          <Vacio titulo="Sin cuadrillas" />
        ) : (
          <div className="tarjetas">
            {cuadrillas.map((c) => (
              <article key={c.id_cuadrilla} className="tarjeta">
                <div className={`tarjeta__cinta tarjeta__cinta--${c.especialidad}`} />
                <div className="tarjeta__cuerpo">
                  <div className="tarjeta__cabecera">
                    <h3>{c.nombre}</h3>
                    <span className={`servicio servicio--${c.especialidad}`}>
                      {c.especialidad === 'agua' ? 'Agua' : 'Luz'}
                    </span>
                  </div>
                  <dl className="tarjeta__datos">
                    <div>
                      <dt>Capacidad</dt>
                      <dd>{c.capacidad} personas</dd>
                    </div>
                    <div>
                      <dt>Contacto</dt>
                      <dd>{c.contacto || '—'}</dd>
                    </div>
                  </dl>
                  {puedeEditar && (
                    <div className="acciones-iconos">
                      <button type="button" className="btn-icono" onClick={() => editar(c)} title="Editar">
                        {icono('editar')}
                      </button>
                      <button
                        type="button"
                        className="btn-icono btn-icono--peligro"
                        onClick={() => borrar(c)}
                        title="Eliminar"
                      >
                        {icono('borrar')}
                      </button>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Cuadrillas;
