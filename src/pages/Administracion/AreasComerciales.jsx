import { useState, useEffect } from 'react';
import api from '../../api/client';

const AreasComerciales = () => {
  const [areas, setAreas] = useState([]);
  const [formulario, setFormulario] = useState({
    nombre: '',
    tipo: 'facturacion',
    contacto: '',
  });
  const [editando, setEditando] = useState(null);

  useEffect(() => {
    cargarAreas();
  }, []);

  const cargarAreas = async () => {
    try {
      const response = await api.get('/areas-comerciales');
      setAreas(response.data);
    } catch (error) {
      console.error('Error al cargar áreas:', error);
    }
  };

  const handleChange = (e) => {
    setFormulario({ ...formulario, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editando) {
        await api.put(`/areas-comerciales/${editando}`, formulario);
      } else {
        await api.post('/areas-comerciales', formulario);
      }
      cargarAreas();
      setFormulario({ nombre: '', tipo: 'facturacion', contacto: '' });
      setEditando(null);
    } catch (error) {
      console.error('Error al guardar área:', error);
    }
  };

  const handleEditar = (area) => {
    setFormulario(area);
    setEditando(area.id_area);
  };

  const handleEliminar = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta área?')) {
      try {
        await api.delete(`/areas-comerciales/${id}`);
        cargarAreas();
      } catch (error) {
        console.error('Error al eliminar área:', error);
      }
    }
  };

  return (
    <div className="areas-comerciales">
      <h1>Gestión de Áreas Comerciales</h1>
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
          <label>Tipo:</label>
          <select name="tipo" value={formulario.tipo} onChange={handleChange}>
            <option value="facturacion">Facturación</option>
            <option value="cobranza">Cobranza</option>
          </select>
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
        {editando && <button type="button" onClick={() => { setEditando(null); setFormulario({ nombre: '', tipo: 'facturacion', contacto: '' }); }}>Cancelar</button>}
      </form>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Tipo</th>
            <th>Contacto</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {areas.map((area) => (
            <tr key={area.id_area}>
              <td>{area.id_area}</td>
              <td>{area.nombre}</td>
              <td>{area.tipo}</td>
              <td>{area.contacto}</td>
              <td>
                <button onClick={() => handleEditar(area)}>Editar</button>
                <button onClick={() => handleEliminar(area.id_area)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AreasComerciales;
