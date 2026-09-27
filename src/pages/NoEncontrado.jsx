import { Link } from 'react-router-dom';
import { icono } from '../components/Iconos';

const NoEncontrado = () => (
  <div className="estado-pagina">
    <div className="estado-pagina__codigo">404</div>
    <h1>Pagina no encontrada</h1>
    <p>La ruta que buscas no existe en el sistema.</p>
    <div className="estado-pagina__acciones">
      <Link to="/panel/dashboard" className="btn btn--primary">
        {icono('panel')}
        Ir al panel
      </Link>
      <Link to="/consulta" className="btn btn--outline">
        Consultar un reclamo
      </Link>
    </div>
  </div>
);

export default NoEncontrado;
