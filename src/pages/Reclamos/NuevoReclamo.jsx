import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, esInterno as esInternoRol } from '../../context/AuthContext';
import { crearReclamo } from '../../api/reclamos';
import { listarMedidores, listarMedidoresDeCiudadanos } from '../../api/medidores';
import { obtenerUsuario } from '../../api/usuarios';
import { Alerta, Modal } from '../../components/UI';
import Autocompletado from '../../components/Autocompletado';
import { icono } from '../../components/Iconos';

const SERVICIOS = ['agua', 'luz'];

const CATEGORIAS_POR_SERVICIO = {
  agua: ['corte', 'fuga', 'facturacion', 'falla_tecnica'],
  luz: ['corte', 'falla_tecnica', 'facturacion'],
};

const ETIQUETA_SERVICIO = { agua: 'Agua', luz: 'Luz eléctrica' };

/**
 * Cada cliente tiene un medidor por servicio, asi que cuando hay un solo
 * candidato no hay nada que decidir y se elige solo. Con mas de uno se deja en
 * blanco: son suministro distintos y adivinar seria peor que preguntar.
 */
const medidorPorDefecto = (medidores, servicio) => {
  const delServicio = medidores.filter((m) => m.servicio === servicio);
  return delServicio.length === 1 ? String(delServicio[0].id_medidor) : '';
};

const NuevoReclamo = () => {
  const navegar = useNavigate();
  const { rol, idUsuario: miId } = useAuth();

  const [formulario, setFormulario] = useState({
    canal: 'web',
    servicio: 'agua',
    id_medidor: '',
    categoria: 'corte',
    urgencia: 'normal',
    descripcion: '',
    nombre_cuenta: '',
    direccion: '',
  });
  const [ciudadano, setCiudadano] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [ciudadanos, setCiudadanos] = useState([]);
  const [medidores, setMedidores] = useState([]);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [cargandoCiudadanos, setCargandoCiudadanos] = useState(false);
  const [cargandoMedidores, setCargandoMedidores] = useState(false);

  const interno = esInternoRol(rol);

  // El backend entrega los ciudadanos con sus medidores y su direccion, que es lo
  // que el formulario necesita para no escribir nada a mano por ventanilla.
  useEffect(() => {
    if (!interno) return undefined;
    let vigente = true;
    setCargandoCiudadanos(true);
    listarMedidoresDeCiudadanos()
      .then((datos) => {
        if (vigente) setCiudadanos(datos);
      })
      .catch((err) => {
        if (vigente) setError(detalleDe(err, 'No se pudo cargar la lista de ciudadanos'));
      })
      .finally(() => {
        if (vigente) setCargandoCiudadanos(false);
      });
    return () => {
      vigente = false;
    };
  }, [interno]);

  useEffect(() => {
    if (interno) return undefined;
    let vigente = true;
    setCargandoMedidores(true);
    listarMedidores()
      .then((datos) => {
        if (vigente) setMedidores(datos);
      })
      .catch((err) => {
        if (vigente) setError(detalleDe(err, 'No se pudieron cargar tus medidores'));
      })
      .finally(() => {
        if (vigente) setCargandoMedidores(false);
      });
    return () => {
      vigente = false;
    };
  }, [interno]);

  // El ciudadano escribe una sola vez sus datos: el perfil los tiene y no hay que
  // copiarlos a mano. Si la lectura falla, el formulario sigue vacio y el
  // ciudadano los escribe, que es lo que se hacia antes.
  useEffect(() => {
    if (interno || !miId) return undefined;
    let vigente = true;
    obtenerUsuario(miId)
      .then((perfil) => {
        if (!vigente) return;
        setFormulario((f) => ({
          ...f,
          nombre_cuenta: f.nombre_cuenta || perfil.nombre || '',
          direccion: f.direccion || perfil.direccion || '',
        }));
      })
      .catch(() => {
        /* Solo servia para prellenar: el reclamo se registra igual. */
      });
    return () => {
      vigente = false;
    };
  }, [interno, miId]);

  const seleccionado = useMemo(
    () => ciudadanos.find((c) => String(c.id_usuario) === String(ciudadano)) || null,
    [ciudadanos, ciudadano]
  );

  const opcionesCiudadanos = useMemo(
    () =>
      ciudadanos.map((c) => ({
        id: c.id_usuario,
        etiqueta: c.nombre,
        detalle: c.documento,
      })),
    [ciudadanos]
  );

  // Al cambiar de ciudadano se recargan sus medidores, que ya vinieron en el
  // listado: no hace falta otra peticion. Nombre y direccion tambien se prellenan
  // con los del titular, pero siguen editables porque la cuenta del servicio puede
  // estar a nombre de un tercero.
  useEffect(() => {
    if (!interno) return;
    setMedidores(Array.isArray(seleccionado?.medidores) ? seleccionado.medidores : []);
    setFormulario((f) => ({
      ...f,
      nombre_cuenta: seleccionado?.nombre || f.nombre_cuenta,
      direccion: seleccionado?.direccion || f.direccion,
    }));
  }, [interno, seleccionado]);

  // El medidor pertenece al cliente y a un solo servicio, asi que se recalcula
  // cada vez que cambia cualquiera de los dos.
  useEffect(() => {
    setFormulario((f) => {
      const vigente = medidores.some(
        (m) => String(m.id_medidor) === String(f.id_medidor) && m.servicio === f.servicio
      );
      if (vigente) return f;
      return { ...f, id_medidor: medidorPorDefecto(medidores, f.servicio) };
    });
  }, [medidores, formulario.servicio]);

  // El medidor elegido solo alimenta el texto de ayuda del campo.
  const medidorElegido = useMemo(
    () => medidores.find((m) => String(m.id_medidor) === String(formulario.id_medidor)) || null,
    [medidores, formulario.id_medidor]
  );

  const buscarCiudadano = (texto) => {
    setBusqueda(texto);
    // Teclear sobre un ciudadano ya elegido lo descarta: el nombre en pantalla ya
    // no es el que se eligio. Nombre de cuenta y direccion se dejan como estan,
    // porque son editables y puede que el operador ya los haya corregido a mano.
    if (seleccionado && texto !== seleccionado.nombre) {
      setCiudadano('');
      setMedidores([]);
    }
  };

  const elegirCiudadano = (opcion) => {
    setBusqueda(opcion.etiqueta);
    setCiudadano(String(opcion.id));
  };

  const cambiar = (e) => {
    const { name, value } = e.target;
    setFormulario((f) => {
      if (name === 'servicio') {
        const categorias = CATEGORIAS_POR_SERVICIO[value] || [];
        return {
          ...f,
          servicio: value,
          categoria: categorias.includes(f.categoria) ? f.categoria : categorias[0],
        };
      }
      return { ...f, [name]: value };
    });
  };

  const medidoresDisponibles = medidores.filter((m) => m.servicio === formulario.servicio);

  const enviar = async (e) => {
    e.preventDefault();
    setError(null);
    setExito(null);
    // El buscador acepta texto libre, asi que llegar aqui con el campo lleno no
    // garantiza que haya un ciudadano elegido de verdad.
    if (interno && !seleccionado) {
      setError('Elige un ciudadano de la lista para continuar');
      return;
    }
    setEnviando(true);
    try {
      // El schema exige id_usuario siempre; el backend valida que un ciudadano
      // solo registre a su propio nombre.
      const cuerpo = { ...formulario, id_medidor: parseInt(formulario.id_medidor, 10) };
      cuerpo.id_usuario = interno ? parseInt(ciudadano, 10) : miId;

      const creado = await crearReclamo(cuerpo);
      // El modal queda puesto y recien al cerrarlo se abre el detalle: asi el
      // numero del reclamo se lee antes de salir de la pantalla de registro.
      setExito(creado);
    } catch (err) {
      setError(detalleDe(err, 'No se pudo crear el reclamo'));
    } finally {
      setEnviando(false);
    }
  };

  const cerrarExito = () => {
    const creado = exito;
    setExito(null);
    if (creado) navegar(`/panel/reclamos/${creado.id_reclamo}`, { replace: true });
  };

  return (
    <div className="form-pagina">
      <header className="pagina__encabezado">
        <div>
          <h1>Nuevo reclamo</h1>
          <p>Registra una solicitud de un servicio básico.</p>
        </div>
      </header>

      {error && <Alerta tipo="error" titulo="No se pudo registrar">{error}</Alerta>}

      {exito && (
        <Modal titulo="Reclamo registrado" onCerrar={cerrarExito}>
          El reclamo quedó registrado con el número{' '}
          <strong>#{exito.id_reclamo}</strong> y está en estado{' '}
          <strong>{exito.estado.replaceAll('_', ' ')}</strong>. Ya podés seguirlo desde
          tus reclamos.
        </Modal>
      )}

      <form className="card form-grid" onSubmit={enviar}>
        {interno && (
          <Autocompletado
            id="ciudadano"
            className="campo--ancho"
            etiqueta="Ciudadano que presenta el reclamo"
            opciones={opcionesCiudadanos}
            valor={busqueda}
            onCambiar={buscarCiudadano}
            onElegir={elegirCiudadano}
            marcador="Busca por nombre o documento"
            requerido
            deshabilitado={cargandoCiudadanos}
            ayuda={
              seleccionado
                ? `Documento ${seleccionado.documento}. Al elegirlo se llenan la cuenta, la dirección y el medidor.`
                : 'Como usuario interno puedes registrar el reclamo a nombre de cualquier ciudadano.'
            }
          />
        )}

        <div className="campo">
          <label htmlFor="nombre_cuenta">Nombre de la cuenta</label>
          <input
            id="nombre_cuenta"
            type="text"
            name="nombre_cuenta"
            minLength="3"
            maxLength="120"
            value={formulario.nombre_cuenta}
            onChange={cambiar}
            placeholder="A nombre de quién está la cuenta"
            required
          />
          <small className="campo__ayuda">
            {seleccionado
              ? `Cargado con el nombre de ${seleccionado.nombre}. Edítalo si la cuenta está a nombre de otra persona.`
              : 'Titular de la cuenta donde ocurre el problema. Puede ser distinto a tu nombre.'}
          </small>
        </div>

        <div className="campo">
          <label htmlFor="direccion">Dirección</label>
          <input
            id="direccion"
            type="text"
            name="direccion"
            minLength="5"
            maxLength="255"
            value={formulario.direccion}
            onChange={cambiar}
            placeholder="Calle 45 # 12-30"
            required
          />
          <small className="campo__ayuda">
            Dirección donde se presenta la falla.
            {interno && seleccionado?.direccion
              ? ' Cargada con la dirección que tiene registrada el ciudadano.'
              : ''}
          </small>
        </div>

        <div className="campo">
          <label htmlFor="canal">Canal de atención</label>
          <select id="canal" name="canal" value={formulario.canal} onChange={cambiar}>
            <option value="web">Web</option>
            <option value="telefonico">Telefónico</option>
            <option value="presencial">Presencial</option>
          </select>
        </div>

        <div className="campo">
          <label htmlFor="servicio">Cuenta</label>
          <select id="servicio" name="servicio" value={formulario.servicio} onChange={cambiar}>
            {SERVICIOS.map((s) => (
              <option key={s} value={s}>
                {ETIQUETA_SERVICIO[s]}
              </option>
            ))}
          </select>
        </div>

        <div className="campo">
          <label htmlFor="id_medidor">Medidor</label>
          <select
            id="id_medidor"
            name="id_medidor"
            value={formulario.id_medidor}
            onChange={cambiar}
            disabled={interno ? !seleccionado : cargandoMedidores}
            required
          >
            <option value="">
              {interno
                ? seleccionado
                  ? 'Selecciona el medidor...'
                  : 'Primero elige el ciudadano'
                : cargandoMedidores
                  ? 'Cargando...'
                  : 'Selecciona el medidor...'}
            </option>
            {medidoresDisponibles.map((m) => (
              <option key={m.id_medidor} value={m.id_medidor}>
                {m.numero}
              </option>
            ))}
          </select>
          <small className="campo__ayuda">
            {interno && !seleccionado
              ? 'Los medidores son los que tiene dados de alta ese ciudadano.'
              : medidorElegido
                ? `Medidor ${medidorElegido.numero} de ${ETIQUETA_SERVICIO[formulario.servicio].toLowerCase()}, seleccionado.`
                : `Solo se muestran los medidores de ${ETIQUETA_SERVICIO[formulario.servicio].toLowerCase()}.`}
          </small>
        </div>

        <div className="campo">
          <label htmlFor="categoria">Categoría</label>
          <select id="categoria" name="categoria" value={formulario.categoria} onChange={cambiar}>
            {CATEGORIAS_POR_SERVICIO[formulario.servicio].map((c) => (
              <option key={c} value={c}>
                {{ corte: 'Corte', fuga: 'Fuga', facturacion: 'Facturación', falla_tecnica: 'Falla técnica' }[c]}
              </option>
            ))}
          </select>
        </div>

        <div className="campo">
          <label htmlFor="urgencia">Urgencia</label>
          <select id="urgencia" name="urgencia" value={formulario.urgencia} onChange={cambiar}>
            <option value="programada">Programada</option>
            <option value="normal">Normal</option>
            <option value="alta">Alta</option>
            <option value="critica">Crítica</option>
          </select>
        </div>

        <div className="campo campo--ancho">
          <label htmlFor="descripcion">Descripción del problema</label>
          <textarea
            id="descripcion"
            name="descripcion"
            rows="5"
            minLength="5"
            maxLength="1000"
            value={formulario.descripcion}
            onChange={cambiar}
            placeholder="Describe qué ocurre y desde cuándo."
            required
          />
          <small className="campo__ayuda">{formulario.descripcion.length}/1000 caracteres</small>
        </div>

        <div className="form-grid__acciones">
          <button
            type="button"
            className="btn btn--outline"
            onClick={() => navegar('/panel/reclamos')}
          >
            Cancelar
          </button>
          <button type="submit" className="btn btn--primary" disabled={enviando}>
            {icono('nuevo')}
            {enviando ? 'Registrando...' : 'Registrar reclamo'}
          </button>
        </div>
      </form>
    </div>
  );
};

const detalleDe = (err, porDefecto) =>
  err.response?.data?.detail || err.message || err.mensaje || porDefecto;

export default NuevoReclamo;
