import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { consultarEstado } from '../../api/reclamos';

const ConsultaEstado = () => {
  const [busqueda, setBusqueda] = useState('');
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);

  const handleBuscar = async (e) => {
    e.preventDefault();
    try {
      const data = await consultarEstado(busqueda);
      setResultado(data);
      setError(null);
    } catch (err) {
      setError('No se encontró el reclamo');
      setResultado(null);
    }
  };

  return (
    <div className="consulta-estado">
      <h1>Consulta de Estado</h1>
      <form onSubmit={handleBuscar}>
        <div>
          <label>ID Reclamo o Documento:</label>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Ingrese ID o documento"
            required
          />
        </div>
        <button type="submit">Buscar</button>
      </form>
      {error && <p className="error">{error}</p>}
      {resultado && (
        <div className="resultado">
          <h2>Resultado</h2>
          <p><strong>ID Reclamo:</strong> {resultado.id_reclamo}</p>
          <p><strong>Estado:</strong> {resultado.estado}</p>
          {resultado.fecha_tope && <p><strong>Fecha Tope:</strong> {resultado.fecha_tope}</p>}
        </div>
      )}
    </div>
  );
};

export default ConsultaEstado;
