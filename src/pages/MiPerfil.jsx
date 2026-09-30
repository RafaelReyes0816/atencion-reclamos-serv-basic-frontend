import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { obtenerUsuarioPorDocumento, actualizarUsuario, cambiarContrasena } from '../api/usuarios';
import { listarMedidores, actualizarMedidor } from '../api/medidores';
import { Alerta, Badge, Cargando } from '../components/UI';
import { icono } from '../components/Iconos';

const ETIQUETA_SERVICIO = { agua: 'Agua', luz: 'Luz eléctrica' };

const MiPerfil = () => {
  const { documento, rol, nombre, idUsuario } = useAuth();
  const [perfil, setPerfil] = useState(null);
  const [formulario, setFormulario] = useState({ nombre: '', telefono: '', email: '', direccion: '' });
  const [claves, setClaves] = useState({ contrasena_actual: '', contrasena_nueva: '' });
  const [medidores, setMedidores] = useState([]);
  const [numeros, setNumeros] = useState({});
  const [editando, setEditando] = useState(null);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      try {
        const [u, lista] = await Promise.all([
          obtenerUsuarioPorDocumento(documento),
          listarMedidores(),
        ]);
        setPerfil(u);
        setMedidores(lista);
        setNumeros(Object.fromEntries(lista.map((m) => [m.id_medidor, m.numero])));
        setFormulario({
          nombre: u.nombre || '',
          telefono: u.telefono || '',
          email: u.email || '',
          direccion: u.direccion || '',
        });
      } catch (err) {
        setError(err.mensaje || 'No se pudo cargar tu perfil');
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [documento]);

  const guardarMedidor = async (e, idMedidor) => {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    setExito(null);
    try {
      const actualizado = await actualizarMedidor(idMedidor, { numero: numeros[idMedidor] });
      setMedidores((lista) => lista.map((m) => (m.id_medidor === idMedidor ? actualizado : m)));
      setEditando(null);
      setExito('Medidor actualizado.');
    } catch (err) {
      setError(err.response?.data?.detail || err.mensaje || 'No se pudo actualizar el medidor');
    } finally {
      setGuardando(false);
    }
  };

  const guardarDatos = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    setExito(null);
    try {
      await actualizarUsuario(perfil.id_usuario, formulario);
      setExito('Datos actualizados.');
    } catch (err) {
      setError(err.mensaje || 'No se pudieron guardar los datos');
    } finally {
      setGuardando(false);
    }
  };

  const guardarClave = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    setExito(null);
    try {
      await cambiarContrasena(perfil.id_usuario, claves);
      setExito('Contraseña actualizada.');
      setClaves({ contrasena_actual: '', contrasena_nueva: '' });
    } catch (err) {
      setError(
        err.response?.status === 422
          ? 'La contraseña actual no coincide, o la nueva es igual a la actual.'
          : err.mensaje || 'No se pudo cambiar la contraseña'
      );
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) return <Cargando />;
  if (!perfil) return <Alerta tipo="error">{error || 'No se encontró el usuario'}</Alerta>;

  return (
    <div className="form-pagina">
      <header className="pagina__encabezado">
        <div>
          <h1>Mi perfil</h1>
          <p>Actualiza tus datos de contacto y tu contraseña.</p>
        </div>
      </header>

      {error && <Alerta tipo="error" onCerrar={() => setError(null)}>{error}</Alerta>}
      {exito && <Alerta tipo="exito" onCerrar={() => setExito(null)}>{exito}</Alerta>}

      <section className="card card--perfil">
        <span className="avatar avatar--grande">{nombre?.charAt(0) || '?'}</span>
        <div>
          <h2>{perfil.nombre}</h2>
          <p className="card__texto">
            Documento {perfil.documento} · ID {idUsuario}
          </p>
          <Badge valor={rol} tipo="rol" />
        </div>
      </section>

      <div className="perfil__grid">
        <section className="card">
          <h2 className="card__titulo">Mis medidores</h2>
          <p className="card__texto">
            El sistema asigna uno por servicio al crear tu cuenta. Si la empresa te
            entregó otro número, corrígelo aquí.
          </p>
          {medidores.length === 0 ? (
            <p className="card__texto">Aún no tienes medidores registrados.</p>
          ) : (
            medidores.map((m) => (
              <form
                key={m.id_medidor}
                className="form-grid form-grid--apilado"
                onSubmit={(e) => guardarMedidor(e, m.id_medidor)}
              >
                <Badge valor={m.servicio} tipo="servicio">
                  {ETIQUETA_SERVICIO[m.servicio] || m.servicio}
                </Badge>
                {editando === m.id_medidor ? (
                  <>
                    <div className="campo">
                      <label htmlFor={`m_${m.id_medidor}`}>Número de medidor</label>
                      <input
                        id={`m_${m.id_medidor}`}
                        value={numeros[m.id_medidor] ?? ''}
                        onChange={(e) =>
                          setNumeros({ ...numeros, [m.id_medidor]: e.target.value })
                        }
                        minLength="4"
                        maxLength="30"
                        pattern="[A-Za-z0-9\-]+"
                        required
                      />
                      <small className="campo__ayuda">
                        Entre 4 y 30 caracteres: letras, números y guiones.
                      </small>
                    </div>
                    <div className="form-grid__acciones">
                      <button
                        type="button"
                        className="btn btn--outline"
                        onClick={() => setEditando(null)}
                      >
                        Cancelar
                      </button>
                      <button type="submit" className="btn btn--primary" disabled={guardando}>
                        {icono('check')}
                        Guardar
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="form-grid__acciones">
                    <span className="card__texto">{m.numero}</span>
                    <button
                      type="button"
                      className="btn btn--outline"
                      onClick={() => setEditando(m.id_medidor)}
                    >
                      Editar
                    </button>
                  </div>
                )}
              </form>
            ))
          )}
        </section>

        <section className="card">
          <h2 className="card__titulo">Datos de contacto</h2>
          <form className="form-grid form-grid--apilado" onSubmit={guardarDatos}>
            <div className="campo">
              <label htmlFor="p_nombre">Nombre completo</label>
              <input
                id="p_nombre"
                value={formulario.nombre}
                onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })}
                required
              />
            </div>
            <div className="campo">
              <label htmlFor="p_telefono">Teléfono</label>
              <input
                id="p_telefono"
                value={formulario.telefono}
                onChange={(e) => setFormulario({ ...formulario, telefono: e.target.value })}
              />
            </div>
            <div className="campo">
              <label htmlFor="p_email">Correo</label>
              <input
                id="p_email"
                type="email"
                value={formulario.email}
                onChange={(e) => setFormulario({ ...formulario, email: e.target.value })}
              />
            </div>
            <div className="campo">
              <label htmlFor="p_direccion">Dirección</label>
              <input
                id="p_direccion"
                value={formulario.direccion}
                onChange={(e) => setFormulario({ ...formulario, direccion: e.target.value })}
              />
            </div>
            <button type="submit" className="btn btn--primary" disabled={guardando}>
              {icono('check')}
              Guardar cambios
            </button>
          </form>
        </section>

        <section className="card">
          <h2 className="card__titulo">Cambiar contraseña</h2>
          <p className="card__texto">
            Necesitas tu contraseña actual para confirmar el cambio.
          </p>
          <form className="form-grid form-grid--apilado" onSubmit={guardarClave}>
            <div className="campo">
              <label htmlFor="c_actual">Contraseña actual</label>
              <input
                id="c_actual"
                type="password"
                autoComplete="current-password"
                value={claves.contrasena_actual}
                onChange={(e) => setClaves({ ...claves, contrasena_actual: e.target.value })}
                required
              />
            </div>
            <div className="campo">
              <label htmlFor="c_nueva">Contraseña nueva</label>
              <input
                id="c_nueva"
                type="password"
                autoComplete="new-password"
                value={claves.contrasena_nueva}
                onChange={(e) => setClaves({ ...claves, contrasena_nueva: e.target.value })}
                minLength="6"
                required
              />
            </div>
            <button type="submit" className="btn btn--primary" disabled={guardando}>
              {icono('candado')}
              Actualizar contraseña
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default MiPerfil;
