import { useEffect } from 'react';

export const ETIQUETA_ESTADO = {
  registrado: 'Registrado',
  clasificado: 'Clasificado',
  en_atencion_tecnica: 'En atención técnica',
  en_atencion_comercial: 'En atención comercial',
  resuelto: 'Resuelto',
  cerrado: 'Cerrado',
  escalado: 'Escalado',
};

export const ETIQUETA_URGENCIA = {
  programada: 'Programada',
  normal: 'Normal',
  alta: 'Alta',
  critica: 'Crítica',
};

export const ETIQUETA_SERVICIO = { agua: 'Agua', luz: 'Luz' };

export const ETIQUETA_CATEGORIA = {
  corte: 'Corte',
  facturacion: 'Facturación',
  fuga: 'Fuga',
  falla_tecnica: 'Falla técnica',
};

export const ETIQUETA_CANAL = {
  presencial: 'Presencial',
  telefonico: 'Telefónico',
  web: 'Web',
};

export const humanizar = (valor) =>
  valor ? valor.replaceAll('_', ' ') : valor;

export const Badge = ({ valor, tipo = 'estado', children }) => {
  const texto = children ?? humanizar(valor);
  return <span className={`badge badge--${tipo}-${valor ?? 'nulo'}`}>{texto}</span>;
};

export const Alerta = ({ tipo = 'info', titulo, children, onCerrar }) => (
  <div className={`alerta alerta--${tipo}`} role={tipo === 'error' ? 'alert' : 'status'}>
    <div className="alerta__cuerpo">
      {titulo && <strong className="alerta__titulo">{titulo}</strong>}
      <div>{children}</div>
    </div>
    {onCerrar && (
      <button type="button" className="alerta__cerrar" onClick={onCerrar} aria-label="Cerrar">
        &times;
      </button>
    )}
  </div>
);

export const Vacio = ({ titulo = 'Sin datos', children }) => (
  <div className="vacio">
    <div className="vacio__icono" />
    <strong>{titulo}</strong>
    {children && <p>{children}</p>}
  </div>
);

export const Cargando = ({ texto = 'Cargando...' }) => (
  <div className="pantalla-carga">
    <div className="spinner" />
    <p>{texto}</p>
  </div>
);

/**
 * Ventana emergente para confirmar que una operacion quedo registrada.
 *
 * Se usa en los casos en que el resultado importa y no conviene perderlo de vista:
 * el mensaje tapa la pantalla y la pagina siguiente no carga hasta que el usuario
 * lo cierra. Las alertas en linea se reservan para errores y para resultados
 * menores, que se pueden leer y seguir trabajando sin parar.
 */
export const Modal = ({ titulo = 'Listo', children, onCerrar, backdrop = true, tipo = 'exito' }) => {
  // Escape cierra y el fondo no se desplaza mientras la ventana esta abierta: sin
  // esto la pagina sigue scrolleando por detras y el mensaje se lee a medias.
  useEffect(() => {
    const alPulsar = (e) => {
      if (e.key === 'Escape') onCerrar();
    };
    document.addEventListener('keydown', alPulsar);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', alPulsar);
      document.body.style.overflow = overflow;
    };
  }, [onCerrar]);

  return (
    <div
      className="modal-overlay"
      onClick={backdrop ? onCerrar : undefined}
      role="presentation"
    >
      <div
        className={`modal modal--${tipo}`}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`modal__icono modal__icono--${tipo}`} aria-hidden="true" />
        <div className="modal__cuerpo">
          <strong className="modal__titulo">{titulo}</strong>
          <div className="modal__texto">{children}</div>
        </div>
        <div className="modal__pie">
          <button type="button" className="btn btn--primary" onClick={onCerrar} autoFocus>
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
