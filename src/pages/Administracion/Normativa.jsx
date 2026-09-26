import { useState, useEffect } from 'react';
import api from '../../api/client';

const Normativa = () => {
  const [normativas, setNormativas] = useState([]);
  const [formulario, setFormulario] = useState({
    servicio: 'agua',
    categoria: 'corte',
    urgencia: 'normal',
    plazo_maximo_dias: 30,
    vigencia_desde: new Date().toISOString().split('T')[0],
  });
  const [editando, setEditando] = useState(null);

  useEffect(() => {
    cargarNormativas();
  }, []);

  const cargarNormativas = async () => {
    try {
      const response = await api.get('/normativa');
      setNormativas(response.data);
    } catch (error) {
      console.error('Error al cargar normativa:', error);
    }
  };

  const handleChange = (e) => {
    setFormulario({ ...formulario, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editando) {
        await api.put(`/normativa/${editando}`, formulario);
      } else {
        await api.post('/normativa', formulario);
      }
      cargarNormativas();
      setFormulario({
        servicio: 'agua',
        categoria: 'corte',
        urgencia: 'normal',
        plazo_maximo_dias: 30,
        vigencia_desde: new Date().toISOString().split('T')[0],
      });
      setEditando(null);
    } catch (error) {
      console.error('Error al guardar normativa:', error);
    }
  };

  const handleEditar = (normativa) => {
    setFormulario(normativa);
    setEditando(normativa.id_normativa);
  };

  return (
    <div className="normativa">
      <h1>Gestión de Normativa de Plazos</h1>
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
        <div>
          <label>Plazo Máximo (días):</label>
          <input
            type="number"
            name="plazo_maximo_dias"
            value={formulario.plazo_maximo_dias}
            onChange={handleChange}
            min="1"
            required
          />
        </div>
        <div>
          <label>Vigencia Desde:</label>
          <input
            type="date"
            name="vigencia_desde"
            value={formulario.vigencia_desde}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit">{editando ? 'Actualizar' : 'Crear'}</button>
        {editando && <button type="button" onClick={() => { setEditando(null); setFormulario({ servicio: 'agua', categoria: 'corte', urgencia: 'normal', plazo_maximo_dias: 30, vigencia_desde: new Date().toISOString().split('T')[0] }); }}>Cancelar</button>}
      </form>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Servicio</th>
            <th>Categoría</th>
            <th>Urgencia</th>
            <th>Plazo (días)</th>
            <th>Vigencia Desde</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {normativas.map((normativa) => (
            <tr key={normativa.id_normativa}>
              <td>{normativa.id_normativa}</td>
              <td>{normativa.servicio}</td>
              <td>{normativa.categoria}</td>
              <td>{normativa.urgencia}</td>
              <td>{normativa.plazo_maximo_dias}</td>
              <td>{normativa.vigencia_desde}</td>
              <td>
                <button onClick={() => handleEditar(normativa)}>Editar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Normativa;
