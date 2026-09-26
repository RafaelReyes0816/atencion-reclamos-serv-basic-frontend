import { createContext, useContext, useState, useEffect } from 'react';
import { login as loginApi, register as registerApi } from '../api/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [username, setUsername] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
    setCargando(false);
  }, [token]);

  const login = async (documento, password) => {
    try {
      setError(null);
      const data = await loginApi(documento, password);
      setToken(data.access_token);
      setUsername(documento);
      return true;
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al iniciar sesión');
      return false;
    }
  };

  const registrar = async (userData) => {
    try {
      setError(null);
      await registerApi(userData);
      return true;
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al registrar usuario');
      return false;
    }
  };

  const logout = () => {
    setToken(null);
    setUsername(null);
  };

  return (
    <AuthContext.Provider value={{ token, username, error, cargando, login, logout, registrar }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
