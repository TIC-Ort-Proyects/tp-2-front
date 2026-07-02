# CALIDAD.md

## Estrategia general

LinkHub es una app chica con dos superficies de riesgo reales: (1) lógica de
negocio con reglas no triviales (generación de slugs, saneamiento de input de
usuario, parseo de URLs externas) y (2) un flujo end-to-end crítico para el
producto (auth → gestión de links → visualización pública) que depende de
varias piezas (Better Auth, Postgres, Server Actions, Next.js routing)
funcionando juntas.

Elegimos separar la estrategia en dos capas en lugar de apilar tests de un solo
tipo:

- **Tests unitarios** sobre funciones puras extraídas de la lógica de negocio.
  Antes de este TP, la generación de slugs y el saneamiento de inputs vivían
  duplicados inline en tres archivos distintos (`app/actions/links.ts`,
  `app/dashboard/page.tsx`, `app/[slug]/page.tsx`), lo cual las hacía
  imposibles de testear de forma aislada y propensas a divergir (de hecho ya
  habían divergido levemente). Las extrajimos a `lib/profile.ts` como
  funciones puras — esto no es un cambio cosmético: es lo que hace que sean
  testeables sin mockear Next.js, Drizzle o la sesión de auth.
- **Un test E2E** que ejercita el flujo real contra un browser y una base de
  datos real, porque los tests unitarios no dicen nada sobre si el usuario
  puede efectivamente registrarse, agregar un link y verlo publicado — eso
  depende de la integración entre Better Auth, las Server Actions, y el
  renderizado del perfil público.

No perseguimos cobertura total: priorizamos las funciones con reglas
implícitas (regex, casos borde de URLs inválidas) sobre las que son
pass-through directo a la base de datos, porque ahí es donde un cambio
descuidado rompe algo silenciosamente.

## Herramientas seleccionadas

- **Vitest** para unit tests, en vez de Jest: el proyecto ya usa Vite-like
  tooling (Next 16 + Turbopack) y Vitest comparte configuración con eso,
  arranca más rápido y es lo que la propia documentación de Next.js
  recomienda para el App Router (`next/dist/docs/01-app/02-guides/testing/vitest.md`
  en este mismo `node_modules`, dado que esta versión de Next.js difiere de
  la que indexan la mayoría de las guías online).
- **@testing-library/react** para el único test de componente
  (`FaviconImg`): permite testear el comportamiento observable (qué URL arma,
  qué hace al fallar la carga) sin acoplarse a detalles de implementación.
- **Playwright** para E2E, sobre Cypress: corre headless en CI sin necesitar
  un servidor de video/dashboard externo, tiene soporte oficial documentado
  para Next.js App Router, y el mismo test corre igual en local y en CI vía
  `webServer` en `playwright.config.ts`.
- **ESLint** (`eslint-config-next`) ya viene configurado en el proyecto desde
  el TP2; lo integramos al pipeline en vez de reemplazarlo por otra cosa —no
  tenía sentido introducir una segunda herramienta de lint para el mismo
  lenguaje.
- **GitHub Actions** para CI/CD: es gratuito para repos del equipo, corre
  nativo sobre el mismo repositorio sin credenciales extra, y tiene
  `services:` para levantar Postgres efímero en el job de E2E sin depender de
  una base de datos externa compartida.
- **Vercel** para deploy: es donde ya corre el proyecto desde el TP2; usamos
  el Vercel CLI (`vercel build` + `vercel deploy --prebuilt`) en vez de la
  integración automática de GitHub-Vercel porque así el deploy queda
  explícitamente condicionado a que el job de `build` (que depende de lint y
  tests) haya terminado con éxito, en vez de dispararse en paralelo.

## Tests desarrollados

**Unit — `lib/profile.test.ts`:**
1. `generateProfileSlug` produce un slug en minúsculas, con espacios y
   símbolos colapsados a un solo guion.
2. `generateProfileSlug` no deja guiones sueltos al principio/final cuando el
   nombre empieza o termina con puntuación (caso real: nombres con
   acentos/símbolos raros, común en un producto usado por hispanohablantes).
3. `generateProfileSlug` genera un sufijo distinto en cada llamada, para que
   dos perfiles con el mismo nombre no colisionen de slug.
4. `sanitizeSlug` limpia caracteres inválidos del input que el usuario escribe
   a mano en "URL slug" del dashboard.
5. `sanitizeSlug` preserva guiones ya presentes (no los trata como inválidos).
6. `sanitizeSlug` con un input sin caracteres válidos devuelve string vacío en
   vez de tirar una excepción (evita un 500 si alguien manda solo emojis).
7. `getHostname` extrae el hostname de una URL válida (usado para mostrar
   el dominio y el favicon de cada link).
8. `getHostname` con una URL malformada devuelve `""` en vez de tirar,
   protegiendo el render del perfil público si un usuario guardó una URL
   rota.
9. `getHostname("")` no rompe.

**Unit (componente) — `components/favicon-img.test.tsx`:**
10. `FaviconImg` arma correctamente la URL del servicio de favicons de Google
    a partir del hostname recibido.
11. `FaviconImg` oculta el `<img>` (`display: none`) cuando la carga del
    favicon falla, en vez de mostrar el ícono roto del navegador.

**E2E — `e2e/auth-and-links.spec.ts`:**
1. *"visiting /dashboard without a session redirects to the login page"*:
   un usuario no autenticado que entra directo a `/dashboard` es redirigido a
   `/`. Cubre el guard de auth en `app/dashboard/page.tsx`.
2. *"a new user can sign up, add a link, and see it published"*: flujo
   principal completo — registro con email/password → llega al dashboard →
   agrega un link vía el form de Server Action → el link aparece en el
   dashboard → se visita la URL de perfil público (tomada del botón "compartir"
   del propio dashboard) → el link aparece ahí también. Es el flujo de valor
   real del producto: si esto falla, el producto no sirve, sin importar qué
   tan verde esté todo lo demás.

## Casos de uso críticos

Priorizamos, en este orden:

1. **Que un usuario no autenticado no pueda ver el dashboard de otro** (guard
   de sesión) — es lo mínimo de seguridad esperable y lo primero que rompe
   silenciosamente si alguien toca `auth.api.getSession`.
2. **El flujo signup → agregar link → verlo público** — es literalmente el
   producto. Todo lo demás (editar perfil, reordenar, borrar) es
   incremental sobre este flujo ya probado.
3. **Generación de slugs sin colisión y sin caracteres inválidos** — un slug
   roto o duplicado es un bug que solo se nota en producción (dos usuarios
   con la misma URL pública), no en desarrollo con un solo usuario de prueba.

Quedó **fuera** de esta ronda (ver deuda técnica): editar/borrar/reordenar
links, y validación de que una URL "rota" en `getHostname` no impida guardar
el link (hoy se guarda igual, solo no muestra hostname).

## Pipeline de CI/CD

Workflow: `.github/workflows/ci-cd.yml`, dispara en push y PR a `main`.

```
lint ──┬──> unit-tests ──┐
       └──> e2e-tests ───┴──> build ──> deploy (solo push a main)
```

- **lint**: corre primero y bloquea todo lo demás — no tiene sentido gastar
  minutos de CI corriendo tests sobre código que ni siquiera pasa las reglas
  básicas del proyecto.
- **unit-tests** y **e2e-tests** corren en paralelo (ambos dependen solo de
  `lint`), porque son independientes entre sí y no hace falta serializarlos.
  `e2e-tests` levanta un servicio de Postgres efímero (`services: postgres`),
  corre las migraciones de Drizzle y recién ahí ejecuta Playwright contra un
  build real de la app.
- **build**: depende de que unit-tests *y* e2e-tests hayan pasado. Si
  cualquiera de los dos falla, `build` ni se dispara.
- **deploy**: depende de `build`, y además tiene la condición
  `github.ref == 'refs/heads/main' && github.event_name == 'push'` — es decir,
  un PR nunca deploya a producción, solo un push (merge) a `main`. Esto es
  intencional: un PR abierto puede tener código a medio terminar; no
  queremos que eso pise producción solo porque el pipeline "pasó".
- Si falla el lint, ni tests ni build ni deploy corren — el error se ve en
  minutos, no después de un `git push` a mano contra Vercel.

## Limitaciones y deuda técnica

- El test E2E fue diseñado y verificado *lógicamente* contra el markup real
  del dashboard (selectores tomados del código, no inventados), pero no se
  pudo ejecutar en un entorno local porque no había Postgres/Docker
  disponibles en la máquina de desarrollo al momento de escribirlo. La
  primera ejecución real ocurre en CI, donde sí hay un servicio de Postgres
  configurado. Esto es un riesgo consciente: si un selector no matchea
  (por ejemplo el texto exacto de un botón), el primer indicio será un fallo
  en CI, no antes.
- No hay tests para editar, borrar ni reordenar links (`updateLink`,
  `deleteLink`, `reorderLinks` en `app/actions/links.ts`), ni para editar el
  perfil (`updateProfile`). Se priorizó el flujo de alta porque es el que
  un usuario nuevo ejercita primero, pero el resto del CRUD queda sin cubrir.
- `getOrCreateProfile` (la función que crea el perfil la primera vez que un
  usuario entra al dashboard) no tiene test de integración propio — se
  ejercita indirectamente a través del E2E de signup, pero no hay un test
  que aísle la creación del perfil de la creación de la sesión.
- La cobertura de código no llega al 60% opcional del enunciado: se
  concentró en los módulos con lógica pura (`lib/profile.ts`,
  `components/favicon-img.tsx`), dejando sin cubrir las Server Actions
  (requieren mockear `next/headers` y la sesión de Better Auth, lo cual no
  se justificaba dado el tiempo disponible frente a cubrirlas con el E2E).
- No se integró un servicio de error monitoring (Sentry u otro). Con más
  tiempo, sería la siguiente prioridad sobre agregar más tests: sin eso, un
  error en producción que no rompe el flujo E2E cubierto (por ejemplo, un
  fallo intermitente de red al pedir favicons) pasaría desapercibido hasta
  que un usuario se queje.
- El slug generado incluye un sufijo aleatorio de 4 caracteres en base36;
  no hay chequeo de unicidad contra la base de datos antes de insertar. La
  probabilidad de colisión es baja pero no nula — quedó aceptado como riesgo
  consciente dado el volumen esperado de usuarios en este contexto.
