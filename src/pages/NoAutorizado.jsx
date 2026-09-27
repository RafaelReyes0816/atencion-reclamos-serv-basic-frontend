import { Link } from 'react-router-dom';
import { ETIQUETA_ROL } from '../context/AuthContext';
import { icono } from '../components/Iconos';

const NoAutorizado = ({ rol, requerido }) => (
  <div className="estado-pagina">
    <div className="estado-pagina__icono estado-pagina__icono--alerta">{icono('alerta')}</div>
    <h1>Sin permisos</h1>
    <p>
      Tu rol <strong>{ETIQUETA_ROL[rol] || rol || 'desconocido'}</strong> no tiene acceso a
      esta seccion.
    </p>
    {requerido?.length > 0 && (
      <p className="estado-pagina__nota">
        Se requiere uno de estos roles:{' '}
        {requerido.map((r) => ETIQUETA_ROL[r] || r).join(', ')}.
      </p>
    )}
    <Link to="/panel/dashboard" className="btn btn--primary">
      {icono('volver')}
      Volver al panel
    </Link>
  </div>
);

export default NoAutorizado;
