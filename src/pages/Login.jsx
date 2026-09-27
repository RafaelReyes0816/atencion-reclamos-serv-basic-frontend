import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Alerta } from '../components/UI';
import { icono } from '../components/Iconos';

const Login = () => {
  const { login, error } = useAuth();
  const navegar = useNavigate();

  const [documento, setDocumento] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    const resultado = await login(documento, contrasena);
    setEnviando(false);
    if (resultado.ok) {
      navegar('/panel/dashboard', { replace: true });
    }
  };

  return (
    <div className="login">
      <section className="login__arte">
        <div className="login__arte-contenido">
          <span className="login__logo">{icono('gota')}</span>
          <h1>Atención de Reclamos</h1>
          <p className="login__lema">
            Sistema de gestión de reclamos de servicios básicos de agua y energía eléctrica.
          </p>
          <ul className="login__lista">
            <li>{icono('check')} Registra y sigue tu reclamo en línea</li>
            <li>{icono('check')} Consulta el estado sin crear cuenta</li>
            <li>{icono('check')} Plazos regulatorios y alertas automáticas</li>
          </ul>
        </div>
      </section>

      <section className="login__panel">
        <div className="login__form">
          <h2>Iniciar sesión</h2>
          <p className="login__sub">Ingresa con tu número de documento.</p>

          {error && <Alerta tipo="error">{error}</Alerta>}

          <form onSubmit={enviar}>
            <div className="campo">
              <label htmlFor="documento">Documento</label>
              <input
                id="documento"
                value={documento}
                onChange={(e) => setDocumento(e.target.value)}
                autoComplete="username"
                placeholder="Ej. 12345678"
                required
                autoFocus
              />
            </div>

            <div className="campo">
              <label htmlFor="contrasena">Contraseña</label>
              <input
                id="contrasena"
                type="password"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            <button type="submit" className="btn btn--primary btn--bloque" disabled={enviando}>
              {enviando ? 'Verificando...' : 'Ingresar'}
              {!enviando && icono('flecha')}
            </button>
          </form>

          <p className="login__pie">
            ¿Solo quieres consultar un reclamo?{' '}
            <Link to="/consulta">Consulta el estado sin iniciar sesión</Link>
          </p>
        </div>
      </section>
    </div>
  );
};

export default Login;
