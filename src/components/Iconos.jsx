const TRAZOS = {
  panel: 'M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z',
  reclamos: 'M9 2h6a2 2 0 0 1 2 2v18l-5-3-5 3V4a2 2 0 0 1 2-2z',
  nuevo: 'M12 5v14M5 12h14',
  normativa: 'M4 3h11l5 5v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM15 3v5h5',
  cuadrillas: 'M3 17h18M5 17V9l4-4h6l4 4v8M9 5v4',
  areas: 'M3 21V9l6-5 6 5v12M15 21V11h6v10M3 21h18',
  reportes: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  usuarios: 'M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 20v-2a4 4 0 0 0-3-3.87',
  gota: 'M12 2.7l4.9 7.4a6.2 6.2 0 1 1-9.8 0z',
  menu: 'M3 6h18M3 12h18M3 18h18',
  salir: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  usuario: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
  buscar: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3',
  alerta: 'M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
  check: 'M20 6 9 17l-5-5',
  reloj: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  flecha: 'M5 12h14M13 6l6 6-6 6',
  volver: 'M19 12H5M11 18l-6-6 6-6',
  descargar: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
  editar: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z',
  borrar: 'M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1L5 6',
  candado: 'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4',
  filtro: 'M3 5h18l-7 8v6l-4 2v-8z',
  refrescar: 'M21 12a9 9 0 1 1-3-6.7M21 3v6h-6',
  seguimiento: 'M4 19V5M4 19h16M8 15l3-4 3 2 4-6',
  hoja: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M9 13h6M9 17h6',
  documento: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M9 13h6M9 17h4',
  bombillo: 'M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z',
};

const RELLENO = {
  gota: true,
};

/**
 * Iconos en SVG inline para no depender de una libreria externa.
 * @param {keyof typeof TRAZOS} nombre
 */
export const icono = (nombre, className = '') => {
  const d = TRAZOS[nombre];
  if (!d) return null;

  return (
    <svg
      className={`icono ${className}`}
      viewBox="0 0 24 24"
      fill={RELLENO[nombre] ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={d} />
    </svg>
  );
};

export default icono;
