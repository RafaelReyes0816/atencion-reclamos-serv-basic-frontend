import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { listarUsuarios, crearUsuario, eliminarUsuario } from '../../api/usuarios';
import { Alerta, Badge, Cargando, Modal, humanizar } from '../../components/UI';
import { icono } from '../../components/Iconos';

const ROLES = ['ciudadano', 'tecnico', 'supervisor', 'admin'];

const VACIO = {
  nombre: '',
  documento: '',
  telefono: '',
  email: '',
  direccion: '',
  contrasena: '',
  rol: 'ciudadano',
};

const Usuarios = () => {
  const { rol: miRol, idUsuario: miId } = useAuth();

  const [usuarios, setUsuarios] = useState([]);
  const [formulario, setFormulario] = useState(VACIO);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);
  // El alta de un usuario se confirma en ventana emergente: es el resultado que
  // hay que leer con calma (documento y rol asignados), no una nota al pie.
  const [creado, setCreado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [filtro, setFiltro] = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      setUsuarios(await listarUsuarios());
      setError(null);
    } catch (err) {
      setError(err.mensaje || 'No se pudo cargar la lista de usuarios');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const esAdmin = miRol === 'admin';

  const crear = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    setExito(null);
    try {
      const { contrasena, ...datos } = formulario;
      // El schema del backend exige el campo con tilde: "contraseña".
      const nuevo = await crearUsuario({ ...datos, contraseña: contrasena });
      setCreado(nuevo);
      setFormulario(VACIO);
      await cargar();
    } catch (err) {
      setError(
        err.response?.data?.detail || err.mensaje || 'No se pudo crear el usuario'
      );
    } finally {
      setEnviando(false);
    }
  };

  const borrar = async (u) => {
    if (!window.confirm(`¿Eliminar a ${u.nombre} (${u.documento})?`)) return;
    setError(null);
    try {
      await eliminarUsuario(u.id_usuario);
      setExito(`Usuario ${u.documento} eliminado.`);
      await cargar();
    } catch (err) {
      setError(
        err.response?.status === 409
          ? `${u.nombre} tiene reclamos asociados y no se puede eliminar.`
          : err.mensaje || 'No se pudo eliminar'
      );
    }
  };

  const cambiar = (e) => {
    const { name, value } = e.target;
    setFormulario((f) => ({ ...f, [name]: value }));
  };

  const visibles = usuarios.filter(
    (u) =>
      !filtro ||
      u.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
      u.documento.includes(filtro)
  );

  return (
    <div className="form-pagina">
      <header className="pagina__encabezado">
        <div>
          <h1>Usuarios</h1>
          <p>{usuarios.length} registro(s) en el sistema.</p>
        </div>
      </header>

      {error && <Alerta tipo="error" titulo="Error" onCerrar={() => setError(null)}>{error}</Alerta>}
      {exito && <Alerta tipo="exito" onCerrar={() => setExito(null)}>{exito}</Alerta>}

      {creado && (
        <Modal titulo="Usuario creado" onCerrar={() => setCreado(null)}>
          El usuario <strong>{creado.documento}</strong> quedó registrado con el rol{' '}
          <strong>{humanizar(creado.rol)}</strong>. Ya puede iniciar sesión con ese
          documento y la contraseña que le asignaste.
        </Modal>
      )}

      {esAdmin && (
        <details className="card collapsible">
          <summary>Crear usuario</summary>
          <form className="form-grid" onSubmit={crear}>
            <div className="campo">
              <label htmlFor="nombre">Nombre</label>
              <input id="nombre" name="nombre" value={formulario.nombre} onChange={cambiar} required />
            </div>
            <div className="campo">
              <label htmlFor="documento">Documento</label>
              <input
                id="documento"
                name="documento"
                value={formulario.documento}
                onChange={cambiar}
                required
              />
            </div>
            <div className="campo">
              <label htmlFor="rol">Rol</label>
              <select id="rol" name="rol" value={formulario.rol} onChange={cambiar}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {humanizar(r)}
                  </option>
                ))}
              </select>
            </div>
            <div className="campo">
              <label htmlFor="contrasena">Contraseña</label>
              <input
                id="contrasena"
                name="contrasena"
                type="text"
                minLength="6"
                value={formulario.contrasena}
                onChange={cambiar}
                required
              />
            </div>
            <div className="campo">
              <label htmlFor="telefono">Teléfono</label>
              <input
                id="telefono"
                name="telefono"
                value={formulario.telefono}
                onChange={cambiar}
                required
              />
            </div>
            <div className="campo">
              <label htmlFor="email">Correo</label>
              <input id="email" name="email" type="email" value={formulario.email} onChange={cambiar} />
            </div>
            <div className="campo campo--ancho">
              <label htmlFor="direccion">Dirección</label>
              <input id="direccion" name="direccion" value={formulario.direccion} onChange={cambiar} />
            </div>
            <div className="form-grid__acciones">
              <button type="submit" className="btn btn--primary" disabled={enviando}>
                {enviando ? 'Creando...' : 'Crear usuario'}
              </button>
            </div>
          </form>
        </details>
      )}

      <section className="card">
        <div className="card__cabecera">
          <h2 className="card__titulo">Listado</h2>
          <div className="buscador">
            {icono('buscar')}
            <input
              type="search"
              placeholder="Buscar por nombre o documento"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
            />
          </div>
        </div>

        {cargando ? (
          <Cargando />
        ) : (
          <div className="tabla-scroll">
            <table className="tabla">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Documento</th>
                  <th>Rol</th>
                  <th>Contacto</th>
                  {esAdmin && <th>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {visibles.map((u) => (
                  <tr key={u.id_usuario}>
                    <td>{u.id_usuario}</td>
                    <td>
                      {u.nombre}
                      {u.id_usuario === miId && <span className="marca-propio">tú</span>}
                    </td>
                    <td>{u.documento}</td>
                    <td>
                      <Badge valor={u.rol} tipo="rol" />
                    </td>
                    <td className="celda-menor">{u.telefono || '—'}</td>
                    {esAdmin && (
                      <td>
                        <button
                          type="button"
                          className="btn-icono btn-icono--peligro"
                          onClick={() => borrar(u)}
                          title="Eliminar"
                          disabled={u.id_usuario === miId}
                        >
                          {icono('borrar')}
                        </button>
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

export default Usuarios;
