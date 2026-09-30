import { Link } from 'react-router-dom';
import { icono } from './Iconos';

/**
 * Métrica del panel. Si recibe `to`, se convierte en un enlace a la lista de
 * reclamos ya filtrada; si no, es solo informativa.
 */
const Metrica = ({ titulo, valor, clase = '', ico, to, detalle }) => {
  const cuerpo = (
    <>
      <span className="metrica__icono">{icono(ico)}</span>
      <div>
        <strong className="metrica__valor">{valor ?? 0}</strong>
        <span className="metrica__titulo">{titulo}</span>
      </div>
      {to && <span className="metrica__ir">{icono('flecha')}</span>}
    </>
  );

  if (!to) return <div className={`metrica ${clase}`}>{cuerpo}</div>;

  return (
    <Link
      to={to}
      className={`metrica metrica--enlazable ${clase}`}
      title={detalle || `Ver reclamos: ${titulo}`}
    >
      {cuerpo}
    </Link>
  );
};

export default Metrica;
