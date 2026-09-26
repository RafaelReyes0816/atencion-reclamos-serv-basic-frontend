import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { clasificarReclamo } from '../../api/reclamos';

const ClasificarReclamo = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formulario, setFormulario] = useState({
    servicio: 'agua',
    categoria: 'corte',
    urgencia: 'normal',
  });

  const handleChange = (e) => {
    setFormulario({ ...formulario, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await clasificarReclamo(id, formulario);
      navigate(`/reclamos/${id}`);
    } catch (err) {
      console.error('Error al clasificar:', err);
    }
  };

  return (
    <div className="clasificar-reclamo">
      <h1>Clasificar Reclamo #{id}</h1>
      <form onSubmit={handleSubmit}>
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
        <button type="submit">Clasificar</button>
      </form>
    </div>
  );
};

export default ClasificarReclamo;
