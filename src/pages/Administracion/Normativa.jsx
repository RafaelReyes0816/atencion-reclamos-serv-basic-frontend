import { useCallback, useEffect, useState } from 'react';
import { useAuth, esGestion } from '../../context/AuthContext';
import { listarNormativas, crearNormativa, actualizarNormativa, eliminarNormativa } from '../../api/catalogos';
import { Alerta, Badge, Cargando, Vacio } from '../../components/UI';
import { icono } from '../../components/Iconos';

const VACIO = {
  servicio: 'agua',
  categoria: 'corte',
  urgencia: 'normal',
  plazo_maximo_dias: 15,
  vigencia_desde: new Date().toISOString().slice(0, 10),
};

const Normativa = () => {
  const { rol } = useAuth();
  const puedeEditar = esGestion(rol);

  const [normativas, setNormativas] = useState([]);
  const [formulario, setFormulario] = useState(VACIO);
  const [editando, setEditando] = useState(null);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      setNormativas(await listarNormativas());
      setError(null);
    } catch (err) {
      setError(err.mensaje || 'No se pudo cargar la normativa');
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
      const cuerpo = {
        ...formulario,
        plazo_maximo_dias: parseInt(formulario.plazo_maximo_dias),
      };
      if (editando) {
        await actualizarNormativa(editando, cuerpo);
        setExito('Normativa actualizada.');
      } else {
        await crearNormativa(cuerpo);
        setExito('Normativa creada.');
      }
      limpiar();
      await cargar();
    } catch (err) {
      setError(
        err.response?.data?.detail || err.mensaje || 'No se pudo guardar la normativa'
      );
    } finally {
      setGuardando(false);
    }
  };

  const editar = (n) => {
    setFormulario({
      servicio: n.servicio,
      categoria: n.categoria,
      urgencia: n.urgencia,
      plazo_maximo_dias: n.plazo_maximo_dias,
      vigencia_desde: n.vigencia_desde,
    });
    setEditando(n.id_normativa);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const borrar = async (n) => {
    if (
      !window.confirm(
        `¿Eliminar la norma ${n.servicio}/${n.categoria}/${n.urgencia}? Los reclamos que la usen quedarán sin norma.`
      )
    )
      return;
    setError(null);
    try {
      await eliminarNormativa(n.id_normativa);
      setExito('Normativa eliminada.');
      if (editando === n.id_normativa) limpiar();
      await cargar();
    } catch (err) {
      setError(
        err.response?.status === 409
          ? 'No se puede eliminar: hay reclamos que usan esta norma.'
          : err.mensaje || 'No se pudo eliminar'
      );
    }
  };

  return (
    <div className="form-pagina">
      <header className="pagina__encabezado">
        <div>
          <h1>Normativa de plazos</h1>
          <p>Define cuántos días tiene la empresa para responder cada tipo de reclamo.</p>
        </div>
      </header>

      {error && <Alerta tipo="error" titulo="Error" onCerrar={() => setError(null)}>{error}</Alerta>}
      {exito && <Alerta tipo="exito" onCerrar={() => setExito(null)}>{exito}</Alerta>}

      {puedeEditar && (
        <form className="card form-grid" onSubmit={guardar}>
          <h2 className="card__titulo campo--ancho">
            {editando ? `Editando norma #${editando}` : 'Nueva norma'}
          </h2>

          <div className="campo">
            <label htmlFor="servicio">Servicio</label>
            <select
              id="servicio"
              value={formulario.servicio}
              onChange={(e) => setFormulario({ ...formulario, servicio: e.target.value })}
            >
              <option value="agua">Agua</option>
              <option value="luz">Luz</option>
            </select>
          </div>

          <div className="campo">
            <label htmlFor="categoria">Categoría</label>
            <select
              id="categoria"
              value={formulario.categoria}
              onChange={(e) => setFormulario({ ...formulario, categoria: e.target.value })}
            >
              <option value="corte">Corte</option>
              <option value="fuga">Fuga</option>
              <option value="facturacion">Facturación</option>
              <option value="falla_tecnica">Falla técnica</option>
            </select>
          </div>

          <div className="campo">
            <label htmlFor="urgencia">Urgencia</label>
            <select
              id="urgencia"
              value={formulario.urgencia}
              onChange={(e) => setFormulario({ ...formulario, urgencia: e.target.value })}
            >
              <option value="programada">Programada</option>
              <option value="normal">Normal</option>
              <option value="alta">Alta</option>
              <option value="critica">Crítica</option>
            </select>
          </div>

          <div className="campo">
            <label htmlFor="plazo">Plazo máximo (días)</label>
            <input
              id="plazo"
              type="number"
              min="1"
              max="365"
              value={formulario.plazo_maximo_dias}
              onChange={(e) => setFormulario({ ...formulario, plazo_maximo_dias: e.target.value })}
              required
            />
          </div>

          <div className="campo">
            <label htmlFor="vigencia">Vigente desde</label>
            <input
              id="vigencia"
              type="date"
              value={formulario.vigencia_desde}
              onChange={(e) => setFormulario({ ...formulario, vigencia_desde: e.target.value })}
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
              {icono(editando ? 'check' : 'nuevo')}
              {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear norma'}
            </button>
          </div>
        </form>
      )}

      <section className="card">
        <div className="card__cabecera">
          <h2 className="card__titulo">Normas registradas</h2>
          <span className="contador-mini">{normativas.length}</span>
        </div>

        {cargando ? (
          <Cargando />
        ) : normativas.length === 0 ? (
          <Vacio titulo="Sin normativa">
            {puedeEditar
              ? 'Crea la primera norma para poder asignar plazos.'
              : 'No hay normas cargadas todavía.'}
          </Vacio>
        ) : (
          <div className="tabla-scroll">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Servicio</th>
                  <th>Categoría</th>
                  <th>Urgencia</th>
                  <th>Plazo</th>
                  <th>Vigente desde</th>
                  {puedeEditar && <th>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {normativas.map((n) => (
                  <tr key={n.id_normativa} className={editando === n.id_normativa ? 'fila--activa' : ''}>
                    <td>
                      <span className={`servicio servicio--${n.servicio}`}>
                        {n.servicio === 'agua' ? 'Agua' : 'Luz'}
                      </span>
                    </td>
                    <td>{n.categoria.replaceAll('_', ' ')}</td>
                    <td>
                      <Badge valor={n.urgencia} tipo="urgencia" />
                    </td>
                    <td className="celda-fuerte">{n.plazo_maximo_dias} d</td>
                    <td className="celda-menor">{n.vigencia_desde}</td>
                    {puedeEditar && (
                      <td>
                        <div className="acciones-iconos">
                          <button
                            type="button"
                            className="btn-icono"
                            onClick={() => editar(n)}
                            title="Editar"
                          >
                            {icono('editar')}
                          </button>
                          <button
                            type="button"
                            className="btn-icono btn-icono--peligro"
                            onClick={() => borrar(n)}
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

export default Normativa;
