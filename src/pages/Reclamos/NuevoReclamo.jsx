import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { crearReclamo } from '../../api/reclamos';

const NuevoReclamo = () => {
  const navigate = useNavigate();
  const [formulario, setFormulario] = useState({
    id_usuario: '',
    canal: 'web',
    servicio: 'agua',
    categoria: 'corte',
    urgencia: 'normal',
    descripcion: '',
  });
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormulario({ ...formulario, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await crearReclamo({
        ...formulario,
        id_usuario: parseInt(formulario.id_usuario),
      });
      navigate('/reclamos');
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al crear reclamo');
    }
  };

  return (
    <div className="nuevo-reclamo">
      <h1>Nuevo Reclamo</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>ID Usuario:</label>
          <input
            type="number"
            name="id_usuario"
            value={formulario.id_usuario}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Canal:</label>
          <select name="canal" value={formulario.canal} onChange={handleChange}>
            <option value="presencial">Presencial</option>
            <option value="telefonico">Telefónico</option>
            <option value="web">Web</option>
          </select>
        </div>
        <div>
          <label>Servicio:</label>
          <select name="servicio" value={formulario.servicio} onChange={handleChange}>
            <option value="agua">Agua</option>
            <option value="luz">Luz</option>
          </select>
        </div>
        <div>
          <label>Categoría:</label>
          <select name="categoria" value={formulario.categoria} onChange={handleChange}>
            <option value="corte">Corte</option>
            <option value="facturacion">Facturación</option>
            <option value="fuga">Fuga</option>
            <option value="falla_tecnica">Falla Técnica</option>
          </select>
        </div>
        <div>
          <label>Urgencia:</label>
          <select name="urgencia" value={formulario.urgencia} onChange={handleChange}>
            <option value="programada">Programada</option>
            <option value="normal">Normal</option>
            <option value="alta">Alta</option>
            <option value="critica">Crítica</option>
          </select>
        </div>
        <div>
          <label>Descripción:</label>
          <textarea
            name="descripcion"
            value={formulario.descripcion}
            onChange={handleChange}
            required
          />
        </div>
        {error && <p className="error">{error}</p>}
        <button type="submit">Crear Reclamo</button>
      </form>
    </div>
  );
};

export default NuevoReclamo;
