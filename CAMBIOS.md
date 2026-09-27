# CAMBIOS.md — Frontend

Registro técnico de los cambios aplicados al frontend (React 19 + Vite 8 + React Router 7 + Axios).

- **Alcance:** 22 archivos modificados, 5 eliminados y 15 creados (42 en total).
- **Balance del diff:** +8067 / −2908 líneas.
- **Estado:** `pnpm build` correcto (109 módulos), `pnpm lint` con 0 errores, menú con un
  solo botón activo en las 10 rutas.
- **Ubicación:** `atencion-reclamos-serv-basic-frontend/`

> Documento complementario de `../atencion-reclamos-serv-basic-backend/CAMBIOS.md`, que
> documenta los cambios del lado de la API.

---

## 1. Autenticación

### `src/context/AuthContext.jsx` (modificado, +118 líneas)

Contexto de sesión completo con `AuthProvider` y el hook `useAuth()`:

- **Persistencia** en `localStorage` bajo dos claves: `token` (para Axios) y `sesion`
  (objeto JSON con `token`, `rol`, `idUsuario`, `nombre` y `documento`).
- **Funciones**: `login`, `registrar`, `logout` y `limpiarError`.
- **Estado** derivado expuesto a los componentes: `token`, `rol`, `idUsuario`, `nombre`,
  `documento`, `error` y `cargando`.
- **Helpers de rol exportados**: `esInterno(rol)` y `esGestion(rol)`, que replican los
  grupos `INTERNO` y `GESTION` del backend, más `ETIQUETA_ROL` para las etiquetas.

`login` devuelve `{ ok: true, rol }` o `{ ok: false, error }` en lugar de lanzar, para que
cada página decida cómo mostrar el error.

### `src/api/auth.js` (nuevo)

```js
const formData = new URLSearchParams();
formData.append('username', documento);
formData.append('password', password);
await api.post('/auth/login', formData, {
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
});
```

> El login **no** va en JSON. FastAPI usa `OAuth2PasswordRequestForm`, que espera
> `application/x-www-form-urlencoded`; el campo `username` es el número de documento.

### `src/api/client.js` (modificado, +56 líneas)

Instancia de Axios con dos interceptores:

- **Request:** inyecta `Authorization: Bearer <token>` si existe en `localStorage`.
- **Response:** traduce los errores a mensajes en español y **distingue `401` de
  `403`**, que es el punto más delicado de todo el flujo:

| Código | Significado | Acción en el frontend |
|---|---|---|
| `401` | Token ausente, vencido o credenciales inválidas | Borra la sesión y redirige a `/ingresar` |
| `403` | Token válido pero rol insuficiente | **No** cierra sesión; muestra aviso |

Confundirlos producía el efecto contrario al buscado: en lugar de avisar que faltaban
permisos, expulsaba de la aplicación al usuario.

---

## 2. Rutas y control de acceso

### `src/App.jsx` (modificado, +205 líneas)

Reescrito con el enrutado completo y dos guards:

```jsx
const Protegida = ({ children, roles }) => { ... }   // exige sesión y, opcionalmente, un rol
const SoloVisitante = ({ children }) => { ... }     // solo usuarios sin sesión
```

Matriz de rutas por rol:

| Ruta | Roles |
|---|---|
| `/`, `/ingresar` | públicas (redirigen a `/panel` si hay sesión) |
| `/consulta` | pública |
| `/panel/dashboard` | cualquier autenticado |
| `/panel/reclamos`, `/panel/reclamos/nuevo` | cualquier autenticado |
| `/panel/reclamos/:id` | cualquier autenticado |
| `/panel/reclamos/:id/avances` | técnico, supervisor, admin |
| `/panel/reclamos/:id/clasificar` | técnico, supervisor, admin |
| `/panel/reclamos/:id/resolver` | técnico, supervisor, admin |
| `/panel/reclamos/:id/asignar-plazo` | supervisor, admin |
| `/panel/reclamos/:id/cerrar` | supervisor, admin |
| `/panel/administracion/cuadrillas` | técnico, supervisor, admin |
| `/panel/administracion/areas-comerciales` | técnico, supervisor, admin |
| `/panel/administracion/normativa` | técnico, supervisor, admin |
| `/panel/administracion/usuarios` | supervisor, admin |
| `/panel/reportes` | supervisor, admin |
| `/panel/perfil` | cualquier autenticado |
| `*` | `NoEncontrado` |

Las 18 rutas hijas cuelgan de `/panel`, que renderiza el `Layout`. Se añadió
`/panel/reportes` (faltaba) y la ruta comodín `*`.

> El guard del frontend es solo de experiencia de usuario. La seguridad real la aplica
> `require_roles` en el backend.

---

## 3. Layout y componentes

### `src/components/Layout.jsx` (nuevo)
Sidebar fijo con el menú filtrado por rol, barra superior con el nombre del usuario y
botón de cerrar sesión, área de contenido y drawer móvil con overlay. El menú oculta
enlaces que el usuario no puede usar, en vez de dejarlos visibles y fallar al hacer clic.

### `src/components/UI.jsx` (nuevo)
Kit de componentes reutilizables: `Boton`, `Campo`, `Tarjeta`, `Alerta`, `Tabla`,
`Vacio`, `Spinner`, `Badge` y `Barras`.

### `src/components/Iconos.jsx` (nuevo)
Set de iconos SVG en línea (gota, rayo, documento, bombilla, check, flecha, buscar...).
Se agregaron `documento` y `bombillo` durante el trabajo. Al ser SVG inline se heredan el
`color` y el `tamaño` por CSS, sin archivos extra.

---

## 4. Páginas nuevas

| Archivo | Propósito |
|---|---|
| `src/pages/Administracion/Usuarios.jsx` | CRUD completo, solo supervisor y admin |
| `src/pages/Clasificacion/AsignarPlazo.jsx` | Asigna plazo normativo a un reclamo escalado |
| `src/pages/Seguimiento/CerrarReclamo.jsx` | Cierre con verificación, solo supervisor y admin |
| `src/pages/MiPerfil.jsx` | Datos personales y cambio de contraseña |
| `src/pages/NoAutorizado.jsx` | Pantalla de `403` con el rol actual y los requeridos |
| `src/pages/NoEncontrado.jsx` | Pantalla de `404` |

---

## 5. Páginas reescritas

| Archivo | Cambios principales |
|---|---|
| `src/pages/Dashboard.jsx` | Dos vistas según el rol. Gestión muestra 8 métricas, barras por estado y alertas de vencimiento; ciudadano/técnico muestran sus propios reclamos |
| `src/pages/Login.jsx` | Panel dividido en dos, validaciones, estado de envío y mensaje de error |
| `src/pages/ConsultaEstado.jsx` | Consulta pública por id o documento, con estados de carga y error |
| `src/pages/Reclamos/DetalleReclamo.jsx` | Cabecera, línea de tiempo, resumen, datos de contacto y comprobante |
| `src/pages/Reclamos/ListaReclamos.jsx` | Filtros por estado, servicio, urgencia y búsqueda, con tabla o tarjetas |
| `src/pages/Reclamos/NuevoReclamo.jsx` | Formulario por pasos, selección de servicio y categoría, resumen |
| `src/pages/Clasificacion/ClasificarReclamo.jsx` | Selección de servicio, categoría, vía y urgencia con sus efectos |
| `src/pages/Seguimiento/ResolverReclamo.jsx` | Resumen, causa, solución y evidencia |
| `src/pages/Seguimiento/AvancesTrabajo.jsx` | Registro de avance con estado y barra de progreso |
| `src/pages/Reportes/Reportes.jsx` | Listado, generación diaria/mensual y descarga de `.xlsx` |
| `src/pages/Administracion/Cuadrillas.jsx` | CRUD con filtro por especialidad y disponibilidad |
| `src/pages/Administracion/AreasComerciales.jsx` | CRUD de áreas con tipo y contacto |
| `src/pages/Administracion/Normativa.jsx` | CRUD de normas por servicio, categoría y urgencia |

---

## 6. Módulos de API

### Nuevos

```
src/api/catalogos.js     normativa, cuadrillas y áreas comerciales
src/api/usuarios.js      CRUD, búsqueda por documento y cambio de contraseña
src/api/reportes.js      dashboard, reportes, .xlsx y verificación de plazos
src/api/seguimiento.js   órdenes, avances y derivaciones
```

### `src/api/reclamos.js` (modificado, +17 líneas)
Se le añadió `actualizarContacto` y se documentó que `consultarEstado` es el único
endpoint público.

**Todos los módulos usan URLs relativas** (`/reclamos/`, `/dashboard/`) para pasar por
el proxy de Vite. Nunca una URL absoluta al backend.

---

## 7. Bugs corregidos

| # | Síntoma | Causa | Solución |
|---|---|---|---|
| 1 | Login correcto pero **el panel no carga** ("No se pudo cargar el panel") | El backend define `/dashboard/` y el frontend pedía `/dashboard`. FastAPI respondía **307** con un `Location` absoluto al backend, el navegador lo seguía cross-origin y **CORS lo bloqueaba** | Se añadió el slash final en los 7 endpoints de colección **y** un `configure` en el proxy que reescribe `Location` absoluto a relativo |
| 2 | `http://127.0.0.1:5173` no respondía | Vite 8 escucha solo en `[::1]` (IPv6); `127.0.0.1` es IPv4 | `server.host: '127.0.0.1'` explícito en `vite.config.js` |
| 3 | Crear usuario devolvía `422` | Se enviaba `contrasena` sin tilde; el schema pide `contraseña` | Corregido en `Usuarios.jsx` |
| 4 | `MiPerfil` crasheaba al renderizar | Faltaba importar `useAuth` | Import agregado |
| 5 | El ciudadano podía crear reclamos a nombre de otros | `id_usuario` se enviaba vacío o equivocado | Ahora toma el `idUsuario` de la sesión |
| 6 | `AsignarPlazo` no encontraba la norma | `normativaVigente()` se llamaba sin sus 3 parámetros obligatorios | Se envían `servicio`, `categoria` y `urgencia`, con respaldo |
| 7 | El panel de reportes mostraba datos vacíos | Se leía un campo inexistente | `ReporteGeneradoResponse` expone `message` e `id_reporte` |
| 8 | El comprobante no renderizaba | Esquema desalineado con el backend | Ajustado a `ComprobanteResponse` |
| 9 | Los estados de la orden de trabajo se confundían con los del avance | Un único mapa para `EstadoOrden` y `EstadoParcial` | Dos mapas separados |
| 10 | Se podían guardar cuadrillas y áreas sin teléfono | `contacto` no estaba marcado como requerido | Ahora es obligatorio en formulario y schema |
| 11 | El import de estilos fallaba al borrar `App.css` | `App.jsx` lo seguía importando | Import eliminado con el archivo |
| 12 | En "Nuevo reclamo" se iluminaban los botones "Reclamos" **y** "Nuevo reclamo" | `NavLink` marca por prefijo, y `/panel/reclamos/nuevo` empieza por `/panel/reclamos`. Además ponía `aria-current="page"` en los dos sin dejar sobrescribirlo | Cambiado a `Link` con un patrón por enlace; sección 12 |

---

## 8. Diseño

### `src/index.css` (modificado, +2464 líneas)
Sistema de diseño completo que reemplaza estilos dispersos:

- **Tokens** en `:root`: escala neutra, colores de marca, agua y luz, radios, sombras y
  tiempos de transición.
- **Componentes**: botones, cards, badges por estado y por rol, alertas, tablas, campos
  de formulario, buscador, filtros, estados vacíos y de carga.
- **Layout**: sidebar, topbar con `backdrop-filter`, contenido, overlay y drawer móvil.
- **Específico**: login, consulta pública, dashboard, detalle, línea de tiempo, barras y
  cards.
- **Responsive** en 4 cortes (1100, 1024, 720 y 480 px).
- **Impresión**: oculta navegación y botones, evita cortes de card.
- **Accesibilidad**: foco visible, `aria-*` en elementos interactivos y respeto a
  `prefers-reduced-motion`.

### `src/App.css` (eliminado)
Huérfano: ninguna clase suya se usaba tras el rediseño de `index.css`. Se eliminó el
archivo y su import en `App.jsx`.

### `index.html` (modificado)
`lang="es"`, título del proyecto, meta `description` y `theme-color`.

### `public/favicon.svg` (modificado)
Icono propio del proyecto, en lugar del logo de Vite.

---

## 9. Tooling

### Migración a pnpm
- `package-lock.json` **eliminado**, `pnpm-lock.yaml` **creado**.
- Se estandariza en un solo gestor de paquetes para evitar la deriva de dos lockfiles.

### Linter
El proyecto usa **`oxlint`** (vía `pnpm lint`), configurado en `.oxlintrc.json` con los
plugins `react` y `oxc`.

> `AGENTS.md` en el backend menciona ESLint flat config; está desactualizado. El comando
> real es `pnpm lint` → `oxlint`.

### `vite.config.js` (modificado, +55 líneas)
- 10 rutas de API en el proxy hacia `http://127.0.0.1:8000`, generadas desde un array
  para no repetirlas.
- `configure` compartido que **reescribe el header `Location`** de las redirecciones del
  backend a una URL relativa, evitando el fallo de CORS descrito en el bug 1.
- `host: '127.0.0.1'` y `port: 5173` explícitos (bug 2).
- Lista de rutas explícita en vez de un proxy global: un comodín en `/` se habría
  comido también los módulos internos de Vite (`/src/...`, `/@vite/client`).

### `src/assets/` (eliminado)
Contenía `hero.png`, `react.svg` y `vite.svg`, restos de la plantilla de Vite. Se
verificó que ningún archivo los referenciaba antes de borrarlos.

---

## 10. Limpieza de la interfaz

- **Cuentas de prueba eliminadas del login.** Se retiró el bloque "Cuentas de prueba" con
  los cuatro botones de autocompletado, la constante `CUENTAS_DEMO`, la función
  `usarDemo` y las reglas CSS `.login__demo*`.
- **Placeholders neutros.** `10000001` → `Ej. 12345678` en el login, y
  `Ej. 9 o 10000004` → `Ej. 9 o 12345678` en la consulta pública.

Las credenciales de las 4 cuentas del seed se documentan en `README.md`, no en la
interfaz.

- **Caracteres chinos eliminados.** En la tarjeta de cada cuadrilla, la capacidad se
  mostraba con dos ideogramas después del número, en lugar de la palabra "personas".
  Ahora dice `{c.capacidad} personas`. Se auditó todo el proyecto con un rango Unicode
  CJK y no queda ninguno.

---

## 11. Panel de control interactivo

Las tarjetas de métricas eran `<div>` decorativos: se veían como botones pero no
hacían nada al pulsarlas. Ahora **cada métrica es un enlace** que lleva a la lista de
reclamos con el filtro ya aplicado.

### `src/pages/Dashboard.jsx`

`Metrica` acepta una prop `to`. Con ella se renderiza como `<Link>` en lugar de `<div>`,
y muestra una flecha que aparece al pasar el cursor:

```jsx
const Metrica = ({ titulo, valor, clase = '', ico, to, detalle }) => {
  // sin `to` sigue siendo informativa; con `to` es un enlace
};
```

Las 8 métricas de gestión apuntan a:

| Métrica | Destino |
|---|---|
| Total reclamos | `/panel/reclamos` |
| Pendientes | `/panel/reclamos?estados=registrado,clasificado` |
| En atención | `/panel/reclamos?estados=en_atencion_tecnica,en_atencion_comercial` |
| Resueltos | `/panel/reclamos?estado=resuelto` |
| Cerrados | `/panel/reclamos?estado=cerrado` |
| Vencidos | `/panel/reclamos?vencidos=1` |
| Críticos | `/panel/reclamos?criticos=1` |
| Por vencer | `/panel/reclamos?por_vencer=1` |

Los criterios no son inventados: replican exactamente los del backend en
`ObtenerDashboardUseCase` y `ReclamoRepository`, para que el número de la tarjeta y el
número de filas de la lista coincidan siempre.

| Métrica | Criterio en el backend |
|---|---|
| Pendientes | `por_estado["registrado"] + por_estado["clasificado"]` |
| En atención | `en_atencion_tecnica + en_atencion_comercial` |
| Vencidos | `fecha_tope < hoy AND estado != "cerrado"` |
| Por vencer | `fecha_tope >= hoy AND estado NOT IN ("cerrado", "registrado")` |
| Críticos | `urgencia == "critica" AND estado NOT IN ("cerrado", "resuelto")` |

En la vista del ciudadano hay 4 métricas: Total reclamos, En trámite, Resueltos y
Cerrados.

> **Corrección de coherencia:** la métrica "Resueltos" del ciudadano contaba los
> reclamos en estado `cerrado` y además filtraba por `cerrado`, así que el nombre no
> correspondía a lo que mostraba. Ahora "Resueltos" cuenta `resuelto` y "Cerrados" cuenta
> `cerrado`, cada una con su filtro.

Además:

- **Filas de las tablas de alertas enlazadas** al reclamo (`TablaAlertas`).
- **Barras de "Distribución por servicio" enlazadas** a `/panel/reclamos?servicio=…`.

### `src/pages/Reclamos/ListaReclamos.jsx`

Los filtros pasaron de estado local a **query string** con `useSearchParams`. Esto es lo
que hace posible que una métrica del panel enrute a la lista ya filtrada, y además
permite compartir y marcar en favoritos una vista filtrada.

Se añadieron los parámetros que el panel necesita:

| Parámetro | Significado |
|---|---|
| `estado` | Un estado concreto |
| `estados` | Varios estados separados por comas |
| `servicio`, `categoria`, `urgencia` | Filtros simples |
| `vencidos=1` | `fecha_tope` superada y sin cerrar |
| `por_vencer=1` | Límite vigente, excluye `cerrado` y `registrado` |
| `criticos=1` | Urgencia crítica sin resolver ni cerrar |

Otros cambios en el mismo archivo:

- **Selector de urgencia**, que faltaba.
- **Resumen de filtros activos** (`.filtros-activos` con chips) para que se vea qué se
  está filtrando al llegar desde el panel.
- El encabezado ahora dice "X de Y reclamos" en vez del total sin filtrar.
- Al cambiar el selector de estado se limpia `estados`, para que no se acumulen filtros
  contradictorios.

### `src/index.css`

| Clase | Propósito |
|---|---|
| `.metrica--enlazable` | Cursor de enlace, borde de marca al hover y estado `active` |
| `.metrica__ir` | Flecha que aparece al hover, con transición |
| `.barras__item` | Convierte cada barra en zona clicable con foco visible |
| `.filtros-activos` | Fila de chips con los filtros aplicados |
| `.chip--filtro` | Chip de filtro activo |

### Sin subrayado en los enlaces

`a:hover` tenía `text-decoration: underline`, que pintaba una raya bajo los números de
las tarjetas de métricas, las barras y los `#id` de las tablas. Se eliminó: ahora la
interactividad se comunica con el cambio de color, la flecha y el borde. Se añadió
`a:focus-visible` para que la navegación por teclado siga siendo visible.

---

## 12. Menú lateral: un solo botón activo

### `src/components/Layout.jsx`

Al entrar a **Nuevo reclamo** se iluminaban los dos botones, "Reclamos" y "Nuevo
reclamo". La causa es que el menú usaba `NavLink`, que considera activo un enlace
**por prefijo**: como `/panel/reclamos/nuevo` empieza por `/panel/reclamos`, los dos
enlaces daban por buena la ruta actual.

Había dos síntomas, y por eso no bastaba con ajustar la clase:

| Síntoma | Causa |
|---|---|
| Dos botones iluminados a la vez | `NavLink` resuelve por prefijo |
| `aria-current="page"` duplicado | `NavLink` lo escribe internamente y no permite sobrescribirlo |

El segundo importaba de verdad: un lector de pantalla anunciaba "página actual" en los
dos enlaces, no solo en el botón marcado. Por eso el arreglo fue cambiar `NavLink` por
`Link` y calcular el estado a mano:

```js
const estaActivo = (enlace) =>
  enlace.patron ? enlace.patron.test(pathname) : pathname === enlace.a;
```

Los enlaces que son hojas de sección ahora exigen coincidencia exacta, y "Reclamos"
lleva un patrón que acepta la lista y el detalle, pero no el formulario de registro:

```js
{ a: '/panel/reclamos', texto: 'Reclamos', patron: /^\/panel\/reclamos(\/\d+)?$/ }
```

| Ruta | Botón iluminado | `aria-current` |
|---|---|---|
| `/panel/dashboard` | Panel | 1 |
| `/panel/reclamos` | Reclamos | 1 |
| `/panel/reclamos?estado=cerrado` | Reclamos | 1 |
| `/panel/reclamos/9` (detalle) | Reclamos | 1 |
| `/panel/reclamos/nuevo` | **Nuevo reclamo** | 1 |
| `/panel/administracion/cuadrillas` | Cuadrillas | 1 |
| `/panel/administracion/areas-comerciales` | Áreas comerciales | 1 |
| `/panel/administracion/normativa` | Normativa | 1 |
| `/panel/reportes` | Reportes | 1 |
| `/panel/administracion/usuarios` | Usuarios | 1 |

Las 10 rutas se recorrieron en Chrome real: en todas queda exactamente un botón
iluminado y un solo `aria-current="page"`, sin errores de consola.

---

## 13. `pnpm preview` corregido

### `vite.config.js`

El bloque `preview` no existía, así que `pnpm preview` servía el build estático **sin
proxy**: la app cargaba y fallaba en el primer login con un error de red. Se añadió
`preview` reutilizando el mismo objeto `proxy` de `server`:

```js
preview: {
  host: '127.0.0.1',
  port: 4173,
  proxy,
},
```

Verificado: `GET /` responde `200` y `POST /auth/login` a través del puerto `4173`
responde `200`.

---

## 14. Verificación

Las pruebas se hicieron en **Chrome real vía Chrome DevTools Protocol**, no solo con
`curl`, porque los bugs de CORS y de renderizado solo se manifiestan en el navegador.

### Build y lint
```
✓ 109 modules transformed
dist/assets/index-*.js    398.32 kB │ gzip: 118.60 kB
dist/assets/index-*.css    35.45 kB │ gzip:   7.52 kB
✓ built in 165ms
pnpm lint → 0 errores, 21 warnings
```

Los 21 warnings son de dos tipos, ambos preexistentes y no bloqueantes:
`react/only-export-components` (11, sobre Fast Refresh al mixar componentes y
constantes en el mismo archivo) y `react/set-state-in-effect` (10, en las páginas que
piden datos al montar y usan el `setCargando(true)` del patrón de carga). Ninguno es un
error y ninguno impide compilar.

### Matriz end-to-end por rol

| Rol | Login | Destino | API llamada | Errores |
|---|---|---|---|---|
| admin | 200 | `/panel/dashboard` | `/auth/login` + `/dashboard/` | ninguno |
| supervisor | 200 | `/panel/dashboard` | `/auth/login` + `/dashboard/` | ninguno |
| técnico | 200 | `/panel/dashboard` | `/auth/login` + `/reclamos/` | ninguno |
| ciudadano | 200 | `/panel/dashboard` | `/auth/login` + `/reclamos/` | ninguno |

Los cuatro roles obtienen su vista correcta: admin y supervisor ven las 8 métricas de
gestión; técnico y ciudadano ven solo sus propios reclamos y un menú restringido.

### Verificación de las métricas del panel

Cada métrica se pulsó en Chrome real y se comprobó que la lista llega con el filtro
correcto y que el número de filas coincide con el valor de la tarjeta:

| Rol | Métrica | Valor | Filtro en la URL | Filas |
|---|---|---:|---|---:|
| admin | Total reclamos | 5 | (sin filtro) | 5 |
| admin | Pendientes | 2 | `estados=registrado,clasificado` | 2 |
| admin | En atención | 1 | `estados=en_atencion_tecnica,en_atencion_comercial` | 1 |
| admin | Cerrados | 1 | `estado=cerrado` | 1 |
| admin | Vencidos | 1 | `vencidos=1` | 1 |
| admin | Críticos | 1 | `criticos=1` | 1 |
| ciudadano | Total reclamos | 5 | (sin filtro) | 5 |
| ciudadano | En trámite | 4 | `estados=registrado,clasificado,…` | 4 |

En todos los casos los chips de "Filtrando por:" muestran el criterio aplicado y no hubo
errores de consola ni respuestas `4xx`/`5xx`.

### Build de producción servido con `vite preview`

| Comprobación | Resultado |
|---|---|
| `GET http://127.0.0.1:4173/` | `200` |
| `POST http://127.0.0.1:4173/auth/login` (vía proxy) | `200` |
| 10 rutas del menú, un solo botón activo por ruta | `10/10` |

### Verificación adicional por API

- Matriz de permisos: ciudadano y técnico reciben `403` en escritura de catálogos; solo
  admin puede eliminar.
- Ciclo de vida completo del reclamo: `registrado → clasificado → resuelto → cerrado`.
- Reportes diario y mensual, con descarga de `.xlsx` correcta.
- Barrido de caracteres CJK en `src/`: ninguno restante.
- `pytest` del backend: **191 passed**, código de salida `0`.

---

## 15. Maquina de estados y flujo de atencion

### `src/components/FlujoReclamo.jsx` (nuevo)

Stepper visual de 5 pasos: Registro, Clasificacion, Plazos, Atencion, Resolucion.
Calcula el paso actual a partir del estado del reclamo. Integrado en DetalleReclamo.

### `src/components/Toast.jsx` (nuevo)

Componente de notificacion temporal (exito/error/info) con animacion de entrada.

### `src/pages/Seguimiento/EleccionAtencion.jsx` (nuevo)

Pantalla de decision con dos cards: "Atencion Tecnica" (cuadrilla) vs "Derivacion Comercial" (area).
Reemplaza los dos botones separados que aparecian en DetalleReclamo.

### `src/pages/Reclamos/DetalleReclamo.jsx` (modificado)

- Integracion del stepper `FlujoReclamo`.
- Acciones corregidas: "Asignar plazo" solo si `clasificado` sin `fecha_tope`.
- "Elegir atencion" solo si `clasificado` con `fecha_tope`.
- "Resolver" solo si `en_atencion_tecnica` o `en_atencion_comercial` (ya no desde `clasificado`).
- "Resolver" tambien disponible para `escalado`.

### `src/pages/Seguimiento/AvancesTrabajo.jsx` (modificado)

- Alerta de exito al iniciar atencion y al resolver.
- Boton "Cerrar reclamo" como siguiente paso despues de resolver.
- Form de "Registrar avance" oculto cuando la orden esta resuelta.

### `src/pages/Seguimiento/DerivarComercial.jsx` (modificado)

- Select envia `a.tipo` (enum) en vez de `a.nombre` (display name) - fix de bug.
- Redirect a `/derivacion` si ya tiene derivacion (en vez de mostrar error).

### `src/pages/Seguimiento/AsignarCuadrilla.jsx` (modificado)

- Redirect a `/avances` si ya tiene orden (en vez de mostrar error).

### `src/pages/Seguimiento/CerrarReclamo.jsx` (modificado)

- Form oculto si el reclamo no esta en `resuelto`.

### `src/pages/Seguimiento/ResolverReclamo.jsx` (modificado)

- Form oculto si el reclamo esta `cerrado`.
- Textarea de `detalle` eliminado (backend no lo almacenaba).

### `src/pages/Reclamos/ListaReclamos.jsx` (modificado)

- Filtros `estado`, `servicio`, `categoria`, `urgencia` ahora se envian al backend (server-side).
- Urgency options corregidos: `programada`/`normal` en vez de `baja`/`media`.
- Busqueda por cuadrilla removida (dead code).

### `src/pages/Clasificacion/ClasificarReclamo.jsx` (modificado)

- Dead code removido: `reclamo.direccion` y `reclamo.barrio` (campos inexistentes en la API).

### `src/pages/Reclamos/NuevoReclamo.jsx` (modificado)

- `minLength="5"` agregado al textarea de descripcion (backend lo requiere).

### `src/pages/ConsultaEstado.jsx` (modificado)

- Login link cambiado de `/` a `/ingresar`.

### `src/pages/Dashboard.jsx` (modificado)

- Filtro corregido: `descartado` (Resultado) cambiado a `resuelto` (EstadoReclamo).

### `src/App.jsx` (modificado)

- Nueva ruta `/reclamos/:id/elegir-atencion`.
- Ruta `asignar-plazo` abierta a `tecnico` (antes solo `supervisor`/`admin`).

### `src/index.css` (modificado)

- CSS del stepper (`.flujopasos`).
- CSS del toast (`.toast`).
- CSS de las cards de decision (`.eleccion-grid`, `.eleccion-card`).
