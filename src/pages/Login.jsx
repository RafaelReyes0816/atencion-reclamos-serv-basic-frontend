import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [documento, setDocumento] = useState('');
  const [password, setPassword] = useState('');
  const { login, error } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(documento, password);
  };

  return (
    <div className="login-container">
      <h1>Sistema de Atención de Reclamos</h1>
      <h2>Iniciar Sesión</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Documento:</label>
          <input
            type="text"
            value={documento}
            onChange={(e) => setDocumento(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Contraseña:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="error">{error}</p>}
        <button type="submit">Ingresar</button>
      </form>
    </div>
  );
};

export default Login;
