import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NuevoReclamo from './pages/Reclamos/NuevoReclamo';
import ListaReclamos from './pages/Reclamos/ListaReclamos';
import DetalleReclamo from './pages/Reclamos/DetalleReclamo';
import ConsultaEstado from './pages/ConsultaEstado';
import ClasificarReclamo from './pages/Clasificacion/ClasificarReclamo';
import AsignarPlazo from './pages/Clasificacion/AsignarPlazo';
import ResolverReclamo from './pages/Seguimiento/ResolverReclamo';
import CerrarReclamo from './pages/Seguimiento/CerrarReclamo';
import AvancesTrabajo from './pages/Seguimiento/AvancesTrabajo';
import AsignarCuadrilla from './pages/Seguimiento/AsignarCuadrilla';
import DerivarComercial from './pages/Seguimiento/DerivarComercial';
import EleccionAtencion from './pages/Seguimiento/EleccionAtencion';
import ListaOrdenes from './pages/Seguimiento/ListaOrdenes';
import DetalleDerivacion from './pages/Seguimiento/DetalleDerivacion';
import Cuadrillas from './pages/Administracion/Cuadrillas';
import AreasComerciales from './pages/Administracion/AreasComerciales';
import Normativa from './pages/Administracion/Normativa';
import Usuarios from './pages/Administracion/Usuarios';
import Reportes from './pages/Reportes/Reportes';
import MiPerfil from './pages/MiPerfil';
import NoAutorizado from './pages/NoAutorizado';
import NoEncontrado from './pages/NoEncontrado';

const PantallaCarga = () => (
  <div className="pantalla-carga">
    <div className="spinner" />
    <p>Cargando...</p>
  </div>
);

/** Exige sesion activa. Opcionalmente tambien un conjunto de roles. */
const Protegida = ({ children, roles }) => {
  const { token, rol, cargando } = useAuth();

  if (cargando) return <PantallaCarga />;
  if (!token) return <Navigate to="/ingresar" replace />;
  if (roles && !roles.includes(rol)) return <NoAutorizado rol={rol} requerido={roles} />;

  return children;
};

/** Solo para usuarios sin sesion; si ya hay token, al panel. */
const SoloVisitante = ({ children }) => {
  const { token, cargando } = useAuth();
  if (cargando) return <PantallaCarga />;
  if (token) return <Navigate to="/panel" replace />;
  return children;
};

const App = () => (
  <AuthProvider>
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <SoloVisitante>
              <Login />
            </SoloVisitante>
          }
        />
        <Route
          path="/ingresar"
          element={
            <SoloVisitante>
              <Login />
            </SoloVisitante>
          }
        />

        {/* Consulta publica de estado: no requiere sesion */}
        <Route path="/consulta" element={<ConsultaEstado />} />

        <Route
          path="/panel"
          element={
            <Protegida>
              <Layout />
            </Protegida>
          }
        >
          <Route index element={<Navigate to="/panel/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="reclamos" element={<ListaReclamos />} />
          <Route path="reclamos/nuevo" element={<NuevoReclamo />} />
          <Route path="reclamos/:id" element={<DetalleReclamo />} />
          <Route
            path="reclamos/:id/avances"
            element={
              <Protegida roles={['tecnico', 'supervisor', 'admin']}>
                <AvancesTrabajo />
              </Protegida>
            }
          />
          <Route
            path="reclamos/:id/asignar-cuadrilla"
            element={
              <Protegida roles={['tecnico', 'supervisor', 'admin']}>
                <AsignarCuadrilla />
              </Protegida>
            }
          />
          <Route
            path="reclamos/:id/derivar-comercial"
            element={
              <Protegida roles={['tecnico', 'supervisor', 'admin']}>
                <DerivarComercial />
              </Protegida>
            }
          />
          <Route
            path="reclamos/:id/elegir-atencion"
            element={
              <Protegida roles={['tecnico', 'supervisor', 'admin']}>
                <EleccionAtencion />
              </Protegida>
            }
          />
          <Route
            path="reclamos/:id/derivacion"
            element={
              <Protegida roles={['tecnico', 'supervisor', 'admin']}>
                <DetalleDerivacion />
              </Protegida>
            }
          />
          <Route
            path="ordenes"
            element={
              <Protegida roles={['tecnico', 'supervisor', 'admin']}>
                <ListaOrdenes />
              </Protegida>
            }
          />
          <Route
            path="reclamos/:id/clasificar"
            element={
              <Protegida roles={['tecnico', 'supervisor', 'admin']}>
                <ClasificarReclamo />
              </Protegida>
            }
          />
          <Route
            path="reclamos/:id/asignar-plazo"
            element={
              <Protegida roles={['tecnico', 'supervisor', 'admin']}>
                <AsignarPlazo />
              </Protegida>
            }
          />
          <Route
            path="reclamos/:id/resolver"
            element={
              <Protegida roles={['tecnico', 'supervisor', 'admin']}>
                <ResolverReclamo />
              </Protegida>
            }
          />
          <Route
            path="reclamos/:id/cerrar"
            element={
              <Protegida roles={['supervisor', 'admin']}>
                <CerrarReclamo />
              </Protegida>
            }
          />
          <Route
            path="administracion/cuadrillas"
            element={
              <Protegida roles={['tecnico', 'supervisor', 'admin']}>
                <Cuadrillas />
              </Protegida>
            }
          />
          <Route
            path="administracion/areas-comerciales"
            element={
              <Protegida roles={['tecnico', 'supervisor', 'admin']}>
                <AreasComerciales />
              </Protegida>
            }
          />
          <Route
            path="administracion/normativa"
            element={
              <Protegida roles={['tecnico', 'supervisor', 'admin']}>
                <Normativa />
              </Protegida>
            }
          />
          <Route
            path="administracion/usuarios"
            element={
              <Protegida roles={['supervisor', 'admin']}>
                <Usuarios />
              </Protegida>
            }
          />
          <Route
            path="reportes"
            element={
              <Protegida roles={['supervisor', 'admin']}>
                <Reportes />
              </Protegida>
            }
          />
          <Route path="perfil" element={<MiPerfil />} />
        </Route>

        <Route path="*" element={<NoEncontrado />} />
      </Routes>
    </Router>
  </AuthProvider>
);

export default App;
