import { useEffect, useMemo, useRef, useState } from 'react';
import { icono } from './Iconos';

/**
 * Sin acentos ni mayusculas, para que "jose" encuentre a "José" y "CALLE 45" a
 * "calle 45". El backend guarda los nombres como los escribio el titular.
 */
const normalizar = (texto) =>
  (texto ?? '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

/**
 * Campo de texto con sugerencias: se escribe y el componente propone de una lista
 * que ya esta en memoria. Se usa cuando el backend no tiene un endpoint de busqueda
 * por texto, y el filtro se hace aqui para no hacer un viaje por cada tecla.
 *
 * A diferencia de un `<select>`, el texto se puede escribir, asi que el formulario
 * no obliga a recorrer una lista de cientos de ciudadanos para llegar al ultimo.
 *
 * @param {object} props
 * @param {string} props.id Identificador del input, para el `<label>`.
 * @param {string} props.etiqueta Texto del label.
 * @param {Array<{id: any, etiqueta: string, detalle?: string}>} props.opciones
 *   Candidatos. `etiqueta` es lo que se muestra y `detalle` el dato secundario
 *   (documento, codigo) que tambien sirve para buscar.
 * @param {string} props.valor Texto visible en el campo.
 * @param {(texto: string) => void} props.onCambiar Se llama en cada tecla.
 * @param {(opcion: object) => void} props.onElegir Se llama al confirmar uno.
 * @param {number} [props.maximo] Cuantas sugerencias se listan a la vez.
 */
const Autocompletado = ({
  id,
  etiqueta,
  opciones = [],
  valor = '',
  onCambiar,
  onElegir,
  ayuda,
  marcador = 'Escribe para buscar',
  sinCoincidencias = 'No se encontraron coincidencias',
  requerido = false,
  deshabilitado = false,
  maximo = 8,
  className = '',
}) => {
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(0);
  const caja = useRef(null);

  const consulta = normalizar(valor);

  const sugerencias = useMemo(() => {
    const filtradas = opciones.filter(
      (o) =>
        !consulta ||
        normalizar(o.etiqueta).includes(consulta) ||
        normalizar(o.detalle).includes(consulta)
    );
    return filtradas.slice(0, maximo);
  }, [opciones, consulta, maximo]);

  // El resaltado siempre arranca en la primera sugerencia: si no, al teclear se
  // highlight una posicion que ya no corresponde a la lista filtrada.
  useEffect(() => {
    setActivo(0);
  }, [consulta]);

  // Un clic fuera cierra la lista. Se escucha `mousedown` y no `click` para que la
  // lista se cierre antes de que el otro campo reciba el foco.
  useEffect(() => {
    if (!abierto) return undefined;
    const alPulsar = (e) => {
      if (caja.current && !caja.current.contains(e.target)) setAbierto(false);
    };
    document.addEventListener('mousedown', alPulsar);
    return () => document.removeEventListener('mousedown', alPulsar);
  }, [abierto]);

  const elegir = (opcion) => {
    setAbierto(false);
    onElegir(opcion);
  };

  const alTeclado = (e) => {
    if (e.key === 'Escape') {
      setAbierto(false);
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!abierto) {
        setAbierto(true);
        return;
      }
      const paso = e.key === 'ArrowDown' ? 1 : -1;
      setActivo((i) => (i + paso + sugerencias.length) % Math.max(sugerencias.length, 1));
      return;
    }
    if (e.key === 'Enter' && abierto && sugerencias[activo]) {
      // Sin preventDefault el formulario se enviaria antes de elegir la sugerencia.
      e.preventDefault();
      elegir(sugerencias[activo]);
    }
  };

  const visibles = abierto && (sugerencias.length > 0 || consulta);

  return (
    <div className={`campo autocompletado ${className}`.trim()}>
      <label htmlFor={id}>{etiqueta}</label>
      <div className="autocompletado__caja" ref={caja}>
        {icono('buscar')}
        <input
          id={id}
          type="text"
          value={valor}
          placeholder={marcador}
          disabled={deshabilitado}
          required={requerido}
          autoComplete="off"
          role="combobox"
          aria-expanded={visibles ? 'true' : 'false'}
          aria-controls={`${id}-lista`}
          aria-autocomplete="list"
          aria-activedescendant={visibles && sugerencias[activo] ? `${id}-op-${activo}` : undefined}
          onChange={(e) => {
            onCambiar(e.target.value);
            setAbierto(true);
          }}
          onFocus={() => setAbierto(true)}
          onKeyDown={alTeclado}
        />
        {valor && !deshabilitado && (
          <button
            type="button"
            className="autocompletado__limpiar"
            onClick={() => {
              onCambiar('');
              setAbierto(true);
            }}
            aria-label="Limpiar la búsqueda"
          >
            &times;
          </button>
        )}

        {/* La lista va dentro de la caja a proposito: asi el `contains` del clic
            fuera la cubre y el `position: absolute` se ancla al borde del campo. */}
        {visibles && (
          <ul className="autocompletado__lista" id={`${id}-lista`} role="listbox">
            {sugerencias.length === 0 && (
              <li className="autocompletado__vacio">{sinCoincidencias}</li>
            )}
            {sugerencias.map((o, i) => (
              <li
                key={o.id}
                id={`${id}-op-${i}`}
                role="option"
                aria-selected={i === activo}
                className={`autocompletado__opcion ${i === activo ? 'autocompletado__opcion--activa' : ''}`.trim()}
                onMouseEnter={() => setActivo(i)}
                // `preventDefault` para que el input no pierda el foco al elegir con
                // el mouse: si lo pierde, el blur cerraria la lista antes del clic.
                onMouseDown={(e) => {
                  e.preventDefault();
                  elegir(o);
                }}
              >
                <span className="autocompletado__nombre">{o.etiqueta}</span>
                {o.detalle && <span className="autocompletado__detalle">{o.detalle}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>

      {ayuda && <small className="campo__ayuda">{ayuda}</small>}
    </div>
  );
};

export default Autocompletado;
