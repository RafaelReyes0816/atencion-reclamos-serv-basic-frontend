import { useState, useEffect } from 'react';
import api from '../../api/client';

const Cuadrillas = () => {
  const [cuadrillas, setCuadrillas] = useState([]);
  const [formulario, setFormulario] = useState({
    nombre: '',
    especialidad: 'agua',
    capacidad: 1,
    contacto: '',
  });
  const [editando, setEditando] = useState(null);

  useEffect(() => {
    cargarCuadrillas();
  }, []);

  const cargarCuadrillas = async () => {
    try {
      const response = await api.get('/cuadrillas');
      setCuadrillas(response.data);
    } catch (error) {
      console.error('Error al cargar cuadrillas:', error);
    }
  };

  const handleChange = (e) => {
    setFormulario({ ...formulario, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editando) {
        await api.put(`/cuadrillas/${editando}`, formulario);
      } else {
        await api.post('/cuadrillas', formulario);
      }
      cargarCuadrillas();
      setFormulario({ nombre: '', especialidad: 'agua', capacidad: 1, contacto: '' });
      setEditando(null);
    } catch (error) {
      console.error('Error al guardar cuadrilla:', error);
    }
  };

  const handleEditar = (cuadrilla) => {
    setFormulario(cuadrilla);
    setEditando(cuadrilla.id_cuadrilla);
  };

  const handleEliminar = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta cuadrilla?')) {
      try {
        await api.delete(`/cuadrillas/${id}`);
        cargarCuadrillas();
      } catch (error) {
        console.error('Error al eliminar cuadrilla:', error);
      }
    }
  };

  return (
    <div className="cuadrillas">
      <h1>Gestión de Cuadrillas</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Nombre:</label>
          <input
            type="text"
            name="nombre"
            value={formulario.nombre}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Especialidad:</label>
          <select name="especialidad" value={formulario.especialidad} onChange={handleChange}>
            <option value="agua">Agua</option>
            <option value="luz">Luz</option>
          </select>
        </div>
        <div>
          <label>Capacidad:</label>
          <input
            type="number"
            name="capacidad"
            value={formulario.capacidad}
            onChange={handleChange}
            min="1"
            required
          />
        </div>
        <div>
          <label>Contacto:</label>
          <input
            type="text"
            name="contacto"
            value={formulario.contacto}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit">{editando ? 'Actualizar' : 'Crear'}</button>
        {editando && <button type="button" onClick={() => { setEditando(null); setFormulario({ nombre: '', especialidad: 'agua', capacidad: 1, contacto: '' }); }}>Cancelar</button>}
      </form>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Especialidad</th>
            <th>Capacidad</th>
            <th>Contacto</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {cuadrillas.map((cuadrilla) => (
            <tr key={cuadrilla.id_cuadrilla}>
              <td>{cuadrilla.id_cuadrilla}</td>
              <td>{cuadrilla.nombre}</td>
              <td>{cuadrilla.especialidad}</td>
              <td>{cuadrilla.capacidad}</td>
              <td>{cuadrilla.contacto}</td>
              <td>
                <button onClick={() => handleEditar(cuadrilla)}>Editar</button>
                <button onClick={() => handleEliminar(cuadrilla.id_cuadrilla)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Cuadrillas;
