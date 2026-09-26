import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { resolverReclamo } from '../../api/reclamos';

const ResolverReclamo = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formulario, setFormulario] = useState({
    resultado: 'resuelto',
    detalle: '',
  });

  const handleChange = (e) => {
    setFormulario({ ...formulario, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await resolverReclamo(id, formulario);
      navigate(`/reclamos/${id}`);
    } catch (err) {
      console.error('Error al resolver:', err);
    }
  };

  return (
    <div className="resolver-reclamo">
      <h1>Resolver Reclamo #{id}</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Resultado:</label>
          <select name="resultado" value={formulario.resultado} onChange={handleChange}>
            <option value="resuelto">Resuelto</option>
            <option value="descartado">Descartado</option>
            <option value="derivado">Derivado</option>
          </select>
        </div>
        <div>
          <label>Detalle:</label>
          <textarea
            name="detalle"
            value={formulario.detalle}
            onChange={handleChange}
          />
        </div>
        <button type="submit">Resolver</button>
      </form>
    </div>
  );
};

export default ResolverReclamo;
