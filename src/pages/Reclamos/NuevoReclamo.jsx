import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, esInterno as esInternoRol } from '../../context/AuthContext';
import { crearReclamo } from '../../api/reclamos';
import { Alerta } from '../../components/UI';
import { icono } from '../../components/Iconos';

const SERVICIOS = ['agua', 'luz'];

const CATEGORIAS_POR_SERVICIO = {
  agua: ['corte', 'fuga', 'facturacion', 'falla_tecnica'],
  luz: ['corte', 'falla_tecnica', 'facturacion'],
};

const NuevoReclamo = () => {
  const navegar = useNavigate();
  const { rol, idUsuario: miId } = useAuth();

  const [formulario, setFormulario] = useState({
    canal: 'web',
    servicio: 'agua',
    categoria: 'corte',
    urgencia: 'normal',
    descripcion: '',
  });
  const [idUsuario, setIdUsuario] = useState('');
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);
  const [enviando, setEnviando] = useState(false);

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

  const interno = esInternoRol(rol);

  const enviar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    setExito(null);
    try {
      // El schema exige id_usuario siempre; el backend valida que un ciudadano
      // solo registre a su propio nombre.
      const cuerpo = { ...formulario };
      if (interno) {
        if (!idUsuario) {
          setError('Indica el ID del usuario que presenta el reclamo.');
          return;
        }
        cuerpo.id_usuario = parseInt(idUsuario, 10);
      } else {
        cuerpo.id_usuario = miId;
      }

      const creado = await crearReclamo(cuerpo);
      navegar(`/panel/reclamos/${creado.id_reclamo}`, { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.detail || err.message || err.mensaje || 'No se pudo crear el reclamo'
      );
    } finally {
      setEnviando(false);
    }
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
      {exito && <Alerta tipo="exito" titulo="Listo">{exito}</Alerta>}

      <form className="card form-grid" onSubmit={enviar}>
        {interno && (
          <div className="campo campo--ancho">
            <label htmlFor="id_usuario">ID del usuario</label>
            <input
              id="id_usuario"
              type="number"
              min="1"
              value={idUsuario}
              onChange={(e) => setIdUsuario(e.target.value)}
              placeholder="Ej. 17"
              required
            />
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
          <label htmlFor="servicio">Servicio</label>
          <select id="servicio" name="servicio" value={formulario.servicio} onChange={cambiar}>
            {SERVICIOS.map((s) => (
              <option key={s} value={s}>
                {s === 'agua' ? 'Agua' : 'Energía eléctrica'}
              </option>
            ))}
          </select>
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

export default NuevoReclamo;
