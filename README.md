# LinkHub

Acortador/organizador de links tipo Linktree: cada usuario tiene un perfil público
(`/tu-slug`) con la lista de links que administra desde un dashboard privado.

**Producción:** https://tp-2-front-links.vercel.app

## Stack

- [Next.js 16](https://nextjs.org/) (App Router)
- [Better Auth](https://www.better-auth.com/) para autenticación (email/password)
- [Drizzle ORM](https://orm.drizzle.team/) + PostgreSQL
- [Vitest](https://vitest.dev/) para tests unitarios, [Playwright](https://playwright.dev/) para E2E
- Deploy en [Vercel](https://vercel.com/), CI/CD con GitHub Actions

## Desarrollo local

```bash
bun install
cp .env.example .env   # completar DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL
bun run db:migrate
bun run dev
```

## Testing

```bash
bun run test           # unit tests (Vitest)
bun run test:coverage  # unit tests con reporte de cobertura
bun run test:e2e       # E2E (Playwright) — requiere DATABASE_URL apuntando a una DB de test
```

Ver [CALIDAD.md](./CALIDAD.md) para el detalle de qué cubre cada test y por qué.

## Flujo de trabajo (branches, issues, PRs)

- **Issues primero:** toda funcionalidad, mejora o bug se trackea como issue antes de
  empezar a trabajar, con título descriptivo y asignado a quien lo resuelve.
- **Branch naming:** `feature/nombre-feature` para funcionalidad nueva, `fix/nombre-bug`
  para arreglos. Ejemplos: `feature/reorder-links`, `fix/slug-collision`.
- **Pull Requests:** ningún cambio va directo a `main`. Cada PR referencia el issue que
  cierra (`closes #N`) y requiere al menos una revisión aprobada con comentarios
  concretos antes de mergear.
- **CI/CD:** cada push/PR a `main` corre lint → tests unitarios → tests E2E → build, y
  el deploy a producción solo se dispara si todo lo anterior pasa (ver
  `.github/workflows/ci-cd.yml`).
