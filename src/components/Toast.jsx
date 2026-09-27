import { useEffect, useState } from 'react';

const Toast = ({ mensaje, tipo = 'exito', duracion = 3000, onCerrar }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onCerrar?.();
    }, duracion);
    return () => clearTimeout(timer);
  }, [duracion, onCerrar]);

  if (!visible) return null;

  return (
    <div className={`toast toast--${tipo}`} role="status">
      <span className="toast__mensaje">{mensaje}</span>
      <button
        type="button"
        className="toast__cerrar"
        onClick={() => { setVisible(false); onCerrar?.(); }}
        aria-label="Cerrar"
      >
        &times;
      </button>
    </div>
  );
};

export default Toast;
