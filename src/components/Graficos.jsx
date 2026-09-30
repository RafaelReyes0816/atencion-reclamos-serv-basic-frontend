/**
 * Gráficos sin librería: barras horizontales y torta (donut) en SVG.
 * Ambas piezas son presentacionales — el caller pasa los datos ya etiquetados
 * y decide el color con `tono` (info | exito | aviso | peligro | azul).
 */

/**
 * Barras horizontales proporcionales al mayor valor de la serie.
 * `datos`: [{ etiqueta, valor, tono }]. Todos en cero -> pistas vacías, no NaN.
 */
export const Barras = ({ datos }) => {
  const max = datos.reduce((mayor, d) => (d.valor > mayor ? d.valor : mayor), 0);

  return (
    <ul className="barras">
      {datos.map((d) => {
        const pct = max > 0 ? Math.round((d.valor / max) * 100) : 0;
        return (
          <li key={d.etiqueta}>
            <div className="barras__item">
              <div className="barras__cabecera">
                <span>{d.etiqueta}</span>
                <strong>{d.valor}</strong>
              </div>
              <div
                className="barras__pista"
                title={`${d.valor} de ${max} (${pct}%)`}
              >
                <div
                  className={`barras__relleno barras__relleno--${d.tono}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
};

/**
 * Torta (donut). Solo usar cuando las partes sumen un total real: no
 * representa magnitudes que se solapen, porque las sumaría dos veces.
 * `datos`: [{ etiqueta, valor, tono }]. `centro` va en el hueco del anillo.
 */
export const Torta = ({ datos, centro, centroTitulo }) => {
  // viewBox 100x100: radio 42 deja sitio al grosor del trazo y al centro.
  const RADIO = 42;
  const CIRCUNFERENCIA = 2 * Math.PI * RADIO;
  const total = datos.reduce((suma, d) => suma + d.valor, 0);

  // Cada tramo lleva su largo (para el dasharray) y su desplazamiento (para el
  // dashoffset). Se calcula acumulado con reduce en vez de reasignar una
  // variable del render dentro del map.
  const tramos = datos.reduce(
    (acc, d) => {
      const largo = (d.valor / total) * CIRCUNFERENCIA;
      const previo = acc.at(-1);
      const inicio = previo ? previo.inicio + previo.largo : 0;
      return [...acc, { ...d, largo, inicio }];
    },
    []
  );

  return (
    <div className="torta">
      <div className="torta__anillo">
        <svg
          className="torta__svg"
          viewBox="0 0 100 100"
          role="img"
          aria-label={`${centro} ${centroTitulo}. ${datos
            .map((d) => `${d.etiqueta}: ${d.valor}`)
            .join(', ')}`}
        >
          <circle className="torta__pista" cx="50" cy="50" r={RADIO} />
          {total > 0 && (
            // -90° para que la primera porción empiece arriba y no a las 3 en punto.
            <g transform="rotate(-90 50 50)">
              {tramos.map((t) => (
                <circle
                  key={t.etiqueta}
                  className={`torta__slice torta__slice--${t.tono}`}
                  cx="50"
                  cy="50"
                  r={RADIO}
                  strokeDasharray={`${t.largo} ${CIRCUNFERENCIA - t.largo}`}
                  strokeDashoffset={-t.inicio}
                >
                  <title>{`${t.etiqueta}: ${t.valor}`}</title>
                </circle>
              ))}
            </g>
          )}
        </svg>

        <div className="torta__centro">
          <strong>{centro}</strong>
          <span>{centroTitulo}</span>
        </div>
      </div>

      <ul className="torta__leyenda">
        {datos.map((d) => (
          <li key={d.etiqueta}>
            <span className={`torta__punto torta__punto--${d.tono}`} />
            <span className="torta__leyenda-etiqueta">{d.etiqueta}</span>
            <strong>{d.valor}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
};
