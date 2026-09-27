import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as loginApi, register as registerApi } from '../api/auth';

const AuthContext = createContext(null);

const CLAVE_TOKEN = 'token';
const CLAVE_SESION = 'sesion';

const leerSesion = () => {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_SESION)) || null;
  } catch {
    return null;
  }
};

const guardarSesion = (sesion) => {
  if (sesion) {
    localStorage.setItem(CLAVE_TOKEN, sesion.token);
    localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
  } else {
    localStorage.removeItem(CLAVE_TOKEN);
    localStorage.removeItem(CLAVE_SESION);
  }
};

export const ROLES = {
  CIUDADANO: 'ciudadano',
  TECNICO: 'tecnico',
  SUPERVISOR: 'supervisor',
  ADMIN: 'admin',
};

/** Mismo criterio que INTERNO en el backend (app/Presentation/dependencies). */
export const esInterno = (rol) =>
  [ROLES.TECNICO, ROLES.SUPERVISOR, ROLES.ADMIN].includes(rol);

/** Mismo criterio que GESTION en el backend. */
export const esGestion = (rol) => [ROLES.SUPERVISOR, ROLES.ADMIN].includes(rol);

export const ETIQUETA_ROL = {
  ciudadano: 'Ciudadano',
  tecnico: 'Técnico',
  supervisor: 'Supervisor',
  admin: 'Administrador',
};

export const AuthProvider = ({ children }) => {
  const [sesion, setSesion] = useState(leerSesion);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setCargando(false);
  }, []);

  const login = useCallback(async (documento, contrasena) => {
    try {
      setError(null);
      const data = await loginApi(documento, contrasena);
      const nueva = {
        token: data.access_token,
        rol: data.rol,
        idUsuario: data.id_usuario,
        nombre: data.nombre,
        documento,
      };
      guardarSesion(nueva);
      setSesion(nueva);
      return { ok: true, rol: data.rol };
    } catch (err) {
      const detalle =
        err.response?.status === 401
          ? 'Documento o contraseña incorrectos'
          : err.response?.data?.detail || 'No se pudo conectar con el servidor';
      setError(detalle);
      return { ok: false, error: detalle };
    }
  }, []);

  const registrar = useCallback(async (userData) => {
    try {
      setError(null);
      await registerApi(userData);
      return { ok: true };
    } catch (err) {
      const detalle = err.response?.data?.detail || 'Error al registrar usuario';
      setError(detalle);
      return { ok: false, error: detalle };
    }
  }, []);

  const logout = useCallback(() => {
    guardarSesion(null);
    setSesion(null);
    setError(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        sesion,
        token: sesion?.token ?? null,
        rol: sesion?.rol ?? null,
        idUsuario: sesion?.idUsuario ?? null,
        nombre: sesion?.nombre ?? null,
        documento: sesion?.documento ?? null,
        error,
        cargando,
        login,
        logout,
        registrar,
        limpiarError: () => setError(null),
      }}
    >
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
