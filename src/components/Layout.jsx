import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, ETIQUETA_ROL } from '../context/AuthContext';
import { icono } from './Iconos';

/**
 * El menú usa `Link` y no `NavLink` a propósito. `NavLink` decide por prefijo, así que
 * en `/panel/reclamos/nuevo` dejaría marcados los dos botones, "Reclamos" y
 * "Nuevo reclamo", y además pone `aria-current="page"` por su cuenta sin dejar
 * controlarlo. Aquí el estado lo define `patron` de cada enlace.
 * El de "Reclamos" cubre la lista y el detalle, pero no el formulario de registro.
 */
const ENLACES = [
  { a: '/panel/dashboard', texto: 'Panel', icono: 'panel', roles: 'todos' },
  {
    a: '/panel/reclamos',
    texto: 'Reclamos',
    icono: 'reclamos',
    roles: 'todos',
    patron: /^\/panel\/reclamos(\/\d+)?$/,
  },
  { a: '/panel/reclamos/nuevo', texto: 'Nuevo reclamo', icono: 'nuevo', roles: 'todos' },
  { a: '/panel/administracion/normativa', texto: 'Normativa', icono: 'normativa', roles: ['tecnico', 'supervisor', 'admin'] },
  { a: '/panel/administracion/cuadrillas', texto: 'Cuadrillas', icono: 'cuadrillas', roles: ['tecnico', 'supervisor', 'admin'] },
  { a: '/panel/administracion/areas-comerciales', texto: 'Áreas comerciales', icono: 'areas', roles: ['tecnico', 'supervisor', 'admin'] },
  { a: '/panel/reportes', texto: 'Reportes', icono: 'reportes', roles: ['supervisor', 'admin'] },
  { a: '/panel/administracion/usuarios', texto: 'Usuarios', icono: 'usuarios', roles: ['supervisor', 'admin'] },
];

const visible = (enlace, rol) =>
  enlace.roles === 'todos' || enlace.roles.includes(rol);

const Layout = () => {
  const { rol, nombre, documento, logout } = useAuth();
  const [abierto, setAbierto] = useState(false);
  const navegar = useNavigate();
  const { pathname } = useLocation();

  const cerrarSesion = () => {
    logout();
    navegar('/ingresar', { replace: true });
  };

  const enlaces = ENLACES.filter((e) => visible(e, rol));
  const estaActivo = (enlace) => (enlace.patron ? enlace.patron.test(pathname) : pathname === enlace.a);

  return (
    <div className="layout">
      <aside className={`sidebar ${abierto ? 'sidebar--abierto' : ''}`}>
        <div className="sidebar__marca">
          <span className="sidebar__logo">{icono('gota')}</span>
          <div>
            <strong>Reclamos</strong>
            <small>Servicios Básicos</small>
          </div>
        </div>

        <nav className="sidebar__nav">
          {enlaces.map((e) => (
            <Link
              key={e.a}
              to={e.a}
              onClick={() => setAbierto(false)}
              aria-current={estaActivo(e) ? 'page' : undefined}
              className={`nav-item ${estaActivo(e) ? 'nav-item--activo' : ''}`}
            >
              {icono(e.icono)}
              <span>{e.texto}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar__pie">
          <div className="usuario-mini">
            <span className="avatar">{nombre?.charAt(0) || '?'}</span>
            <div className="usuario-mini__datos">
              <strong>{nombre}</strong>
              <small>{ETIQUETA_ROL[rol] || rol}</small>
            </div>
          </div>
          <button type="button" className="btn btn--ghost btn--bloque" onClick={cerrarSesion}>
            {icono('salir')}
            Cerrar sesión
          </button>
        </div>
      </aside>

      {abierto && <div className="overlay" onClick={() => setAbierto(false)} />}

      <div className="principal">
        <header className="topbar">
          <button
            type="button"
            className="btn-icono topbar__menu"
            onClick={() => setAbierto((v) => !v)}
            aria-label="Abrir menu"
          >
            {icono('menu')}
          </button>

          <div className="topbar__titulo">
            <span className={`chip chip--${rol}`}>{ETIQUETA_ROL[rol] || rol}</span>
            <span className="topbar__doc">Doc. {documento}</span>
          </div>

          <NavLink to="/panel/perfil" className="btn btn--outline btn--sm">
            {icono('usuario')}
            Mi perfil
          </NavLink>
        </header>

        <main className="contenido">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
