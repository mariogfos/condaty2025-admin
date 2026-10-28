# condaty-admin — reglas que aplican siempre

> `AGENTS.md` es un symlink a este archivo: se edita sólo `CLAUDE.md`.

Panel de administración de Condaty: Next.js 16. Consume `condaty-api`. Se
trabaja desde `dev`.

## Lo que viene de la API

- **El aislamiento entre condominios lo garantiza `condaty-api`**, no el front.
  Sus reglas y cómo se prueba están en el `CLAUDE.md` de ese repo: cualquier
  pantalla que muestre o escriba datos de un condominio se revisa contra ellas.
- **Las horas**: la base guarda UTC, la zona la dice el condominio y **el front
  presenta**. Nunca escribas `'America/La_Paz'` en el código.
- **Los estados son enums numéricos desde 1**, los mismos que la API.

## Local

- Un solo dev server por directorio: `npx next dev --port 3099`. Dos `next dev`
  sobre el mismo directorio corrompen `.next`.
- Se prueba contra la base `condaty_test`, **nunca** `condatylocal` (es una
  copia de producción).
- `pnpm test` (Vitest), `pnpm test:e2e` (Playwright), `pnpm lint`,
  `pnpm build`.
