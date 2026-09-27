import { icono } from './Iconos';

const PASOS = [
  { clave: 'registro', etiqueta: 'Registro', icono: 'hoja' },
  { clave: 'clasificacion', etiqueta: 'Clasificación', icono: 'editar' },
  { clave: 'plazos', etiqueta: 'Plazos', icono: 'reloj' },
  { clave: 'atencion', etiqueta: 'Atención', icono: 'seguimiento' },
  { clave: 'resolucion', etiqueta: 'Resolución', icono: 'check' },
];

const calcularPasoActual = (reclamo) => {
  if (!reclamo) return -1;
  const { estado, fecha_tope } = reclamo;

  if (estado === 'cerrado') return 5;
  if (estado === 'resuelto') return 5;
  if (estado === 'en_atencion_tecnica' || estado === 'en_atencion_comercial') return 3;
  if (estado === 'clasificado' && fecha_tope) return 3;
  if (estado === 'clasificado') return 2;
  return 1;
};

const FlujoReclamo = ({ reclamo }) => {
  const pasoActual = calcularPasoActual(reclamo);

  return (
    <nav className="flujopasos" aria-label="Flujo del reclamo">
      {PASOS.map((paso, idx) => {
        let estado = 'pendiente';
        if (idx < pasoActual) estado = 'completado';
        else if (idx === pasoActual) estado = 'actual';

        return (
          <div key={paso.clave} className={`flujopasos__paso flujopasos__paso--${estado}`}>
            <span className="flujopasos__numero">
              {estado === 'completado' ? icono('check') : idx + 1}
            </span>
            <span className="flujopasos__etiqueta">{paso.etiqueta}</span>
          </div>
        );
      })}
    </nav>
  );
};

export default FlujoReclamo;
