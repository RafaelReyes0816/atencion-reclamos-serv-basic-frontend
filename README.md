# Sistema de Atención de Reclamos — Frontend

Interfaz web del sistema de atención de reclamos de servicios básicos. Los ciudadanos
registran y consultan sus reclamos; el personal interno los clasifica, asigna, resuelve
y cierra.

- **Stack:** React 19, Vite 8, React Router 7, Axios
- **Lenguaje:** JavaScript (`.js` / `.jsx`, sin TypeScript)
- **Gestor de paquetes:** pnpm
- **Linter:** oxlint
- **Despliegue:** solo local, sin Docker ni plataforma externa

El detalle de los cambios aplicados está en [`CAMBIOS.md`](./CAMBIOS.md).

---

## Requisitos

| Herramienta | Versión |
|---|---|
| Node.js | 20 o superior |
| pnpm | 9 o superior |
| Python (backend) | 3.11 o superior |
| PostgreSQL | 14 o superior |

> **El frontend no funciona solo.** Necesita el backend corriendo en el puerto `8000`.
> Consulta el README del repositorio backend para instalarlo.

---

## Instalación

```bash
pnpm install
```

## Puesta en marcha

Hay dos terminales abiertas a la vez.

```bash
# Terminal 1 — backend (en ../backend; las dependencias viven en backend/venv)
cd ../backend && ./venv/bin/python -m uvicorn app.main:app --reload --port 8000

# Terminal 2 — frontend (en este directorio)
pnpm dev
```

| Servicio | URL |
|---|---|
| Frontend | http://127.0.0.1:5173 |
| Backend | http://127.0.0.1:8000 |
| Documentación API (Swagger) | http://127.0.0.1:8000/docs |

> Usa siempre `127.0.0.1` y no `localhost`. Vite 8 sin `host: '127.0.0.1'` escucha solo en
> IPv6 y `127.0.0.1:5173` no responde. El backend solo permite `http://localhost:5173` en
> CORS, pero eso no molesta en el flujo normal: el proxy reenvía desde el servidor y el
> navegador nunca ve un origen distinto.

## Otros comandos

```bash
pnpm build     # build de producción en dist/
pnpm preview   # sirve el build en http://127.0.0.1:4173, con proxy al backend
pnpm lint      # oxlint
```

`pnpm preview` usa la misma configuración de proxy que el servidor de desarrollo, así
que el build de producción se puede probar sin tocar nada más.

---

## Cuentas de prueba

Las crea el script de seed del backend (`backend/scripts/seed.py`). **Todas usan la
contraseña `clave123`.**

| Rol | Documento | Contraseña | Puede hacer |
|---|---|---|---|
| `admin` | `10000001` | `clave123` | Todo, incluida la eliminación de reclamos y el CRUD de usuarios |
| `supervisor` | `10000002` | `clave123` | Escribir catálogos, asignar plazos, cerrar reclamos, reportes y dashboard |
| `tecnico` | `10000003` | `clave123` | Operar reclamos: clasificar, resolver, registrar avances |
| `ciudadano` | `10000004` | `clave123` | Registrar y consultar sus propios reclamos |

Para cargar los datos de nuevo:

```bash
cd ../backend
./venv/bin/python -m scripts.seed            # crea solo lo que falte
./venv/bin/python -m scripts.seed --reset    # recarga los datos de prueba
```

Usa `./venv/bin/python` y no el `python` del sistema: las dependencias viven en
`backend/venv`, y con el intérprete equivocado los imports fallan.

> Estas cuentas son de desarrollo. Antes de cualquier despliegue hay que cambiar las
> contraseñas y rotar `SECRET_KEY`.

---

## Roles y permisos

El frontend **oculta** los enlaces que el usuario no puede usar, pero eso es solo
experiencia de usuario: la seguridad real la aplica el backend, que revalida el rol en
cada request leyendo la base de datos. Cambiar el rol de alguien surte efecto de
inmediato, sin necesidad de invalidar su token.

| Permiso | ciudadano | técnico | supervisor | admin |
|---|:---:|:---:|:---:|:---:|
| Registrar y consultar reclamos propios | Sí | Sí | Sí | Sí |
| Ver todos los reclamos | No | Sí | Sí | Sí |
| Clasificar, resolver, registrar avances | No | Sí | Sí | Sí |
| Asignar plazo normativo | No | Sí | Sí | Sí |
| Cerrar y verificar reclamos | No | No | Sí | Sí |
| Escribir catálogos (cuadrillas, áreas, normativa) | No | No | Sí | Sí |
| Reportes y dashboard de gestión | No | No | Sí | Sí |
| CRUD de usuarios | No | No | Sí | Sí |
| Eliminar reclamos | No | No | No | Sí |

> **Discrepancia conocida en "Asignar plazo normativo".** La tabla refleja lo que hace el
> código hoy: `PUT /reclamos/{id}/asignar-plazo` está gateado con `require_roles(*INTERNO)`,
> que incluye al técnico. Pero la matriz de permisos de `docs/API.md` y la del propio
> `test_matriz_de_permisos` dicen que ese endpoint debería ser de `GESTION`
> (supervisor y admin). El técnico atraviesa el gate y recibe 404 en vez de 403, que es lo
> que hace fallar
> `tests/test_permisos.py::test_matriz_de_permisos[asignar_plazo-tecnico]`. Está pendiente
> decidir si se sube el endpoint a `GESTION` o se corrige la matriz.

`POST /auth/register` es público pero **siempre** crea un `ciudadano`; ignora el `rol` del
body. Solo `POST /usuarios/` (admin) permite crear usuarios con otro rol.

---

## Estructura

```
frontend/
├── public/
│   └── favicon.svg            Icono del proyecto
├── src/
│   ├── api/                   Comunicación con el backend (Axios)
│   │   ├── client.js          Instancia + interceptores de token y errores
│   │   ├── auth.js            Login, registro, perfil
│   │   ├── reclamos.js        Reclamos, estados, seguimiento público
│   │   ├── catalogos.js       Normativa, cuadrillas, áreas comerciales
│   │   ├── usuarios.js        CRUD de usuarios y cambio de contraseña
│   │   ├── seguimiento.js     Órdenes, avances, derivaciones
│   │   └── reportes.js        Dashboard, reportes y .xlsx
│   ├── components/
│   │   ├── Layout.jsx         Sidebar, barra superior y drawer móvil
│   │   ├── UI.jsx             Botón, Campo, Tarjeta, Alerta, Tabla, Badge…
│   │   ├── Iconos.jsx         Iconos SVG en línea
│   │   ├── FlujoReclamo.jsx   Stepper del recorrido de un reclamo
│   │   └── Toast.jsx          Aviso efímero de resultado de una acción
│   ├── context/
│   │   └── AuthContext.jsx    Sesión, login/logout y helpers de rol
│   ├── pages/
│   │   ├── Login.jsx          Ingreso
│   │   ├── ConsultaEstado.jsx Consulta pública por id o documento
│   │   ├── Dashboard.jsx      Vista según el rol
│   │   ├── MiPerfil.jsx       Datos y cambio de contraseña
│   │   ├── NoAutorizado.jsx   Pantalla de 403
│   │   ├── NoEncontrado.jsx   Pantalla de 404
│   │   ├── Reclamos/          Lista, detalle y registro
│   │   ├── Clasificacion/     Clasificar y asignar plazo
│   │   ├── Seguimiento/       Resolver, avances y cierre
│   │   ├── Administracion/    Cuadrillas, áreas, normativa y usuarios
│   │   └── Reportes/          Reportes y descargas
│   ├── App.jsx                Rutas y guards de acceso
│   ├── main.jsx               Punto de entrada
│   └── index.css              Sistema de diseño completo
├── .oxlintrc.json             Configuración de oxlint
├── vite.config.js             Proxy al backend
└── package.json
```

---

## Comunicación con la API

### Todo pasa por el proxy de Vite

El frontend **nunca** llama al backend directamente. Todas las peticiones usan URLs
relativas (`/reclamos/`, `/dashboard/`) y el proxy de Vite las reenvía a
`http://127.0.0.1:8000`. Dos motivos:

1. **CORS.** El navegador trata `http://localhost:5173` y `http://127.0.0.1:8000` como
   orígenes distintos. Ir directo al puerto `8000` dispara preflight y falla.
2. **Redirecciones.** FastAPI define las rutas de colección con barra final
   (`/dashboard/`). Si se pide `/dashboard`, responde `307` con un `Location` absoluto
   apuntando al backend, y el navegador lo sigue cross-origin: el panel se rompe con
   "No se pudo cargar el panel". Por eso el proxy **reescribe el header `Location`** a una
   ruta relativa, y los módulos de API usan siempre el slash final.

### Interceptores

`src/api/client.js` centraliza dos comportamientos:

- **Request:** agrega `Authorization: Bearer <token>` automáticamente.
- **Response:** traduce los errores a mensajes en español y distingue dos casos que no
  pueden tratarse igual:

| Código | Significado | Qué hace el frontend |
|---|---|---|
| `401` | Token ausente o vencido | Borra la sesión y redirige a `/ingresar` |
| `403` | Rol insuficiente | **Mantiene** la sesión y muestra un aviso |

Confundirlos expulsaba de la aplicación a usuarios que solo necesitaban más permisos.

### Sesión

Tras el login se guardan dos claves en `localStorage`: `token` (para Axios) y `sesion`
(JSON con `token`, `rol`, `idUsuario`, `nombre` y `documento`).

---

## Notas de implementación

- **El panel de control es clicable.** Cada tarjeta de métrica (Total reclamos,
  Pendientes, En atención, Resueltos, Cerrados, Vencidos, Críticos, Por vencer) es un
  enlace que abre la lista de reclamos con ese filtro ya aplicado. Los criterios son
  los mismos que usa el backend, así que el número de la tarjeta y el número de filas
  de la lista siempre coinciden.
- **Los filtros viven en la URL.** La lista de reclamos lee y escribe su estado en los
  parámetros de la query, de modo que una vista filtrada se puede compartir o marcar en
  favoritos. Parámetros disponibles: `estado`, `estados` (varios, separados por comas),
  `servicio`, `categoria`, `urgencia`, `vencidos=1`, `por_vencer=1` y `criticos=1`.
- **Un solo botón activo en el menú.** Cada enlace define su propio criterio de "página
  actual", así que en `/panel/reclamos/nuevo` solo se ilumina "Nuevo reclamo", mientras
  que en el detalle de un reclamo sigue iluminado "Reclamos".
- **Los enlaces no llevan subrayado.** La interactividad se marca con el cambio de
  color, una flecha en las métricas y el borde, para que las tarjetas no parezcan texto.
- **Todo el texto de la interfaz está en español**, incluidos nombres de variables,
  etiquetas y mensajes de error.
- **Accesibilidad:** foco visible, atributos `aria-*` en elementos interactivos y respeto
  a `prefers-reduced-motion`.
- **Responsive:** cuatro cortes (1100, 1024, 720 y 480 px) con drawer móvil.
- **Impresión:** al imprimir se ocultan navegación y botones, y se evitan cortes dentro
  de las tarjetas.
- **Sin `App.css`:** todo el diseño vive en `src/index.css` como un sistema de tokens en
  `:root` más componentes. Si agregas una pantalla, reutiliza `UI.jsx` antes de escribir
  CSS nuevo.
- **Rutas en `RUTAS_API`:** si agregas un endpoint nuevo al backend, agrégalo también a
  `vite.config.js`, o el proxy no lo reenviará. El mismo array se usa en `server` y en
  `preview`.
- **`nombre_cuenta` y `direccion` identifican la cuenta, no al ciudadano.** Son obligatorios
  en el formulario de nuevo reclamo y se dejan vacíos a propósito, sin prellenar con el
  nombre ni la dirección del usuario: el titular de la cuenta del servicio puede ser un
  tercero. Viven en el reclamo, mientras que teléfono y correo se escriben en el usuario,
  así que `PUT /reclamos/{id}/contacto` toca las dos tablas.
- **No se puede resolver un reclamo con avances sin registrar.** El botón "Resolver
  reclamo" se deshabilita cuando la orden no tiene avances. La garantía real está en el
  backend, que responde 409; el frontend solo evita el viaje innecesario.
- **Reportes tiene un solo botón.** Un selector de tipo (operativo diario o regulatorio
  mensual) y una acción. Los dos endpoints del backend y la generación automática del
  scheduler se mantienen: la unificación es de la interfaz, no del API.

## Problemas frecuentes

**El panel dice "No se pudo cargar el panel".**
Falta el slash final en la llamada, o el backend no está corriendo. Revisa la pestaña
Network: se espera un `307` seguido de un `200` en la misma ruta.

**`http://127.0.0.1:5173` no responde.**
Vite 8 escucha solo en IPv6. El `host: '127.0.0.1'` de `vite.config.js` ya lo corrige;
si quitaste esa línea, vuelve a ponerla.

**Todos los endpoints dan error de CORS.**
Casi nunca pasa por el flujo normal, porque el proxy de Vite reenvía al backend desde el
servidor y el navegador nunca ve un origen distinto: no hay solicitud cross-origin. Solo
aparece si el frontend llama al backend directamente, y entonces hay que mirar el origen
real: el backend solo permite `http://localhost:5173` (`allow_origins` en
`app/Presentation/api/__init__.py`), mientras que Vite escucha en `http://127.0.0.1:5173`.
Si cambias el puerto o el host de uno de los dos lados, actualiza los dos.

**El login responde 422.**
El backend espera `application/x-www-form-urlencoded`, no JSON. `src/api/auth.js` ya lo
envía así; si cambias el cliente, no lo mandes como JSON.
