import { useCallback, useEffect, useState } from 'react';
import { useAuth, esGestion } from '../../context/AuthContext';
import { listarAreas, crearArea, actualizarArea, eliminarArea } from '../../api/catalogos';
import { Alerta, Cargando, Vacio } from '../../components/UI';
import { icono } from '../../components/Iconos';

const VACIO = { nombre: '', tipo: 'facturacion', contacto: '' };

const TIPOS = {
  facturacion: 'Facturación',
  cobranza: 'Cobranza',
};

const AreasComerciales = () => {
  const { rol } = useAuth();
  const puedeEditar = esGestion(rol);

  const [areas, setAreas] = useState([]);
  const [formulario, setFormulario] = useState(VACIO);
  const [editando, setEditando] = useState(null);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      setAreas(await listarAreas());
      setError(null);
    } catch (err) {
      setError(err.mensaje || 'No se pudieron cargar las áreas');
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
      if (editando) {
        await actualizarArea(editando, formulario);
        setExito('Área actualizada.');
      } else {
        await crearArea(formulario);
        setExito('Área creada.');
      }
      limpiar();
      await cargar();
    } catch (err) {
      setError(err.response?.data?.detail || err.mensaje || 'No se pudo guardar el área');
    } finally {
      setGuardando(false);
    }
  };

  const editar = (a) => {
    setFormulario({ nombre: a.nombre, tipo: a.tipo, contacto: a.contacto || '' });
    setEditando(a.id_area);
  };

  const borrar = async (a) => {
    if (!window.confirm(`¿Eliminar el área "${a.nombre}"?`)) return;
    setError(null);
    try {
      await eliminarArea(a.id_area);
      setExito('Área eliminada.');
      if (editando === a.id_area) limpiar();
      await cargar();
    } catch (err) {
      setError(
        err.response?.status === 409
          ? 'No se puede eliminar: hay derivaciones que usan esta área.'
          : err.mensaje || 'No se pudo eliminar'
      );
    }
  };

  return (
    <div className="form-pagina">
      <header className="pagina__encabezado">
        <div>
          <h1>Áreas comerciales</h1>
          <p>Destinos de los reclamos que se derivan a cobro o facturación.</p>
        </div>
      </header>

      {error && <Alerta tipo="error" titulo="Error" onCerrar={() => setError(null)}>{error}</Alerta>}
      {exito && <Alerta tipo="exito" onCerrar={() => setExito(null)}>{exito}</Alerta>}

      {puedeEditar && (
        <form className="card form-grid" onSubmit={guardar}>
          <h2 className="card__titulo campo--ancho">
            {editando ? `Editando #${editando}` : 'Nueva área'}
          </h2>

          <div className="campo">
            <label htmlFor="nombre">Nombre</label>
            <input
              id="nombre"
              value={formulario.nombre}
              onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })}
              placeholder="Facturación BMC"
              required
            />
          </div>

          <div className="campo">
            <label htmlFor="tipo">Tipo</label>
            <select
              id="tipo"
              value={formulario.tipo}
              onChange={(e) => setFormulario({ ...formulario, tipo: e.target.value })}
            >
              <option value="facturacion">Facturación</option>
              <option value="cobranza">Cobranza</option>
            </select>
          </div>

          <div className="campo">
            <label htmlFor="contacto">Contacto</label>
            <input
              id="contacto"
              value={formulario.contacto}
              onChange={(e) => setFormulario({ ...formulario, contacto: e.target.value })}
              placeholder="correo@empresa.com"
              minLength="6"
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
              {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear área'}
            </button>
          </div>
        </form>
      )}

      <section className="card">
        <div className="card__cabecera">
          <h2 className="card__titulo">Áreas registradas</h2>
          <span className="contador-mini">{areas.length}</span>
        </div>

        {cargando ? (
          <Cargando />
        ) : areas.length === 0 ? (
          <Vacio titulo="Sin áreas comerciales">
            {puedeEditar ? 'Crea un área para poder derivar reclamos.' : 'No hay áreas cargadas.'}
          </Vacio>
        ) : (
          <div className="tabla-scroll">
            <table className="tabla">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Tipo</th>
                  <th>Contacto</th>
                  {puedeEditar && <th>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {areas.map((a) => (
                  <tr key={a.id_area} className={editando === a.id_area ? 'fila--activa' : ''}>
                    <td className="celda-fuerte">#{a.id_area}</td>
                    <td>{a.nombre}</td>
                    <td>{TIPOS[a.tipo] || a.tipo}</td>
                    <td className="celda-menor">{a.contacto || '—'}</td>
                    {puedeEditar && (
                      <td>
                        <div className="acciones-iconos">
                          <button type="button" className="btn-icono" onClick={() => editar(a)} title="Editar">
                            {icono('editar')}
                          </button>
                          <button
                            type="button"
                            className="btn-icono btn-icono--peligro"
                            onClick={() => borrar(a)}
                            title="Eliminar"
                          >
                            {icono('borrar')}
                          </button>
                        </div>
                      </td>
                    )}
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

export default AreasComerciales;
