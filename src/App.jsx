import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NuevoReclamo from './pages/Reclamos/NuevoReclamo';
import ListaReclamos from './pages/Reclamos/ListaReclamos';
import DetalleReclamo from './pages/Reclamos/DetalleReclamo';
import ConsultaEstado from './pages/ConsultaEstado';
import ClasificarReclamo from './pages/Clasificacion/ClasificarReclamo';
import AvancesTrabajo from './pages/Seguimiento/AvancesTrabajo';
import ResolverReclamo from './pages/Seguimiento/ResolverReclamo';
import Cuadrillas from './pages/Administracion/Cuadrillas';
import AreasComerciales from './pages/Administracion/AreasComerciales';
import Normativa from './pages/Administracion/Normativa';
import Reportes from './pages/Reportes/Reportes';

const ProtectedRoute = ({ children }) => {
  const { token, cargando } = useAuth();
  if (cargando) return <div>Cargando...</div>;
  if (!token) return <Navigate to="/" />;
  return children;
};

const Navbar = () => {
  const { token, logout } = useAuth();
  if (!token) return null;
  return (
    <nav className="navbar">
      <Link to="/dashboard">Dashboard</Link>
      <Link to="/reclamos">Reclamos</Link>
      <Link to="/reclamos/nuevo">Nuevo Reclamo</Link>
      <Link to="/consulta">Consultar Estado</Link>
      <Link to="/administracion/cuadrillas">Cuadrillas</Link>
      <Link to="/administracion/areas-comerciales">Áreas Comerciales</Link>
      <Link to="/administracion/normativa">Normativa</Link>
      <Link to="/reportes">Reportes</Link>
      <button onClick={logout}>Cerrar Sesión</button>
    </nav>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/reclamos" element={<ProtectedRoute><ListaReclamos /></ProtectedRoute>} />
              <Route path="/reclamos/nuevo" element={<ProtectedRoute><NuevoReclamo /></ProtectedRoute>} />
              <Route path="/reclamos/:id" element={<ProtectedRoute><DetalleReclamo /></ProtectedRoute>} />
              <Route path="/reclamos/:id/clasificar" element={<ProtectedRoute><ClasificarReclamo /></ProtectedRoute>} />
              <Route path="/reclamos/:id/resolver" element={<ProtectedRoute><ResolverReclamo /></ProtectedRoute>} />
              <Route path="/reclamos/:id/avances" element={<ProtectedRoute><AvancesTrabajo /></ProtectedRoute>} />
              <Route path="/consulta" element={<ProtectedRoute><ConsultaEstado /></ProtectedRoute>} />
              <Route path="/administracion/cuadrillas" element={<ProtectedRoute><Cuadrillas /></ProtectedRoute>} />
              <Route path="/administracion/areas-comerciales" element={<ProtectedRoute><AreasComerciales /></ProtectedRoute>} />
              <Route path="/administracion/normativa" element={<ProtectedRoute><Normativa /></ProtectedRoute>} />
              <Route path="/reportes" element={<ProtectedRoute><Reportes /></ProtectedRoute>} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
