import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, esInterno as esInternoRol } from '../../context/AuthContext';
import { crearReclamo } from '../../api/reclamos';
import { listarMedidores, listarMedidoresDeCiudadanos } from '../../api/medidores';
import { Alerta, Modal } from '../../components/UI';
import { icono } from '../../components/Iconos';

const SERVICIOS = ['agua', 'luz'];

const CATEGORIAS_POR_SERVICIO = {
  agua: ['corte', 'fuga', 'facturacion', 'falla_tecnica'],
  luz: ['corte', 'falla_tecnica', 'facturacion'],
};

const ETIQUETA_SERVICIO = { agua: 'Agua', luz: 'Luz eléctrica' };

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
  });
  const [ciudadano, setCiudadano] = useState('');
  const [ciudadanos, setCiudadanos] = useState([]);
  const [medidores, setMedidores] = useState([]);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [cargandoMedidores, setCargandoMedidores] = useState(false);

  const interno = esInternoRol(rol);

  // El backend entrega los medidores listos para elegir, con su numero. El
  // ciudadano nunca escribe el numero: selecciona el suyo.
  useEffect(() => {
    if (!interno) return undefined;
    let vigente = true;
    listarMedidoresDeCiudadanos()
      .then((datos) => {
        if (vigente) setCiudadanos(datos);
      })
      .catch((err) => {
        if (vigente) setError(detalleDe(err, 'No se pudo cargar la lista de ciudadanos'));
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

  const seleccionado = useMemo(
    () => ciudadanos.find((c) => String(c.id_usuario) === String(ciudadano)) || null,
    [ciudadanos, ciudadano]
  );

  // Al cambiar de ciudadano se recargan sus medidores, que ya vinieron en el
  // listado: no hace falta otra peticion.
  useEffect(() => {
    if (!interno) return;
    setMedidores(Array.isArray(seleccionado?.medidores) ? seleccionado.medidores : []);
  }, [interno, seleccionado]);

  // El medidor pertenece al cliente y a un solo servicio, asi que se recalcula
  // cada vez que cambia cualquiera de los dos.
  const medidorElegido = useMemo(
    () => medidores.find((m) => String(m.id_medidor) === String(formulario.id_medidor)) || null,
    [medidores, formulario.id_medidor]
  );

  const elegirCiudadano = (e) => {
    const { value } = e.target;
    setCiudadano(value);
    setFormulario((f) => ({ ...f, id_medidor: '' }));
  };

  const cambiar = (e) => {
    const { name, value } = e.target;
    setFormulario((f) => {
      if (name === 'servicio') {
        const categorias = CATEGORIAS_POR_SERVICIO[value] || [];
        return {
          ...f,
          servicio: value,
          id_medidor: '',
          categoria: categorias.includes(f.categoria) ? f.categoria : categorias[0],
        };
      }
      return { ...f, [name]: value };
    });
  };

  const medidoresDisponibles = medidores.filter((m) => m.servicio === formulario.servicio);

  const enviar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    setExito(null);
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
          <div className="campo campo--ancho">
            <label htmlFor="ciudadano">Ciudadano que presenta el reclamo</label>
            <select id="ciudadano" value={ciudadano} onChange={elegirCiudadano} required>
              <option value="">Selecciona un ciudadano...</option>
              {ciudadanos.map((c) => (
                <option key={c.id_usuario} value={c.id_usuario}>
                  {c.nombre} — {c.documento}
                </option>
              ))}
            </select>
            <small className="campo__ayuda">
              Como usuario interno puedes registrar el reclamo a nombre de cualquier ciudadano.
            </small>
          </div>
        )}

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
                ? `Medidor de ${ETIQUETA_SERVICIO[formulario.servicio].toLowerCase()} de la cuenta.`
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
            placeholder="Describe qué ocurre, desde cuándo y en qué dirección."
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
