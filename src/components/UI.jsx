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
