import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/client';

const AvancesTrabajo = () => {
  const { id } = useParams();
  const [avances, setAvances] = useState([]);
  const [formulario, setFormulario] = useState({
    fecha_avance: new Date().toISOString().split('T')[0],
    descripcion: '',
    estado_parcial: 'iniciado',
  });

  useEffect(() => {
    const cargarAvances = async () => {
      try {
        const response = await api.get(`/seguimiento/avances/${id}`);
        setAvances(response.data);
      } catch (error) {
        console.error('Error al cargar avances:', error);
      }
    };
    cargarAvances();
  }, [id]);

  const handleChange = (e) => {
    setFormulario({ ...formulario, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/seguimiento/avances', {
        id_orden: parseInt(id),
        ...formulario,
      });
      setAvances([...avances, { id: Date.now(), ...formulario }]);
      setFormulario({ ...formulario, descripcion: '' });
    } catch (error) {
      console.error('Error al crear avance:', error);
    }
  };

  return (
    <div className="avances-trabajo">
      <h1>Avances de la Orden #{id}</h1>
      <div className="lista-avances">
        <h2>Avances Registrados</h2>
        {avances.length === 0 ? (
          <p>No hay avances registrados</p>
        ) : (
          <ul>
            {avances.map((avance, index) => (
              <li key={avance.id_avance || index}>
                <strong>{avance.fecha_avance}</strong> - {avance.estado_parcial}
                <p>{avance.descripcion}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="nuevo-avance">
        <h2>Registrar Avance</h2>
        <form onSubmit={handleSubmit}>
          <div>
            <label>Fecha:</label>
            <input
              type="date"
              name="fecha_avance"
              value={formulario.fecha_avance}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label>Estado Parcial:</label>
            <select name="estado_parcial" value={formulario.estado_parcial} onChange={handleChange}>
              <option value="iniciado">Iniciado</option>
              <option value="en_proceso">En Proceso</option>
              <option value="verificado">Verificado</option>
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
          <button type="submit">Registrar Avance</button>
        </form>
      </div>
    </div>
  );
};

export default AvancesTrabajo;
