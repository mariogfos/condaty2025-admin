# El CI se corre a mano

El workflow de GitHub Actions (`.github/workflows/ci.yml`) **se saco el
2026-08-22**, junto con los de los otros tres repos de Condaty.

El motivo aca es distinto al de los demas: este repo **era publico**, y en un
repo publico Actions es gratis. Se paso a **privado** el mismo dia —tenia un
`.env` versionado con un token admin de InstantDB, expuesto desde el 2025-03-20—
y al pasar a privado sus minutos empezaron a contra la cuota mensual, que ya
estaba agotada.

| workflow | corridas (28 h) | minutos |
|---|---|---|
| `ci.yml` | 18 | 38 |

## Lo que hay que correr antes de abrir un PR

Es exactamente lo que hacian los dos jobs.

```bash
pnpm install --frozen-lockfile
pnpm exec tsc --noEmit
pnpm exec vitest run
```

⚠️ `pnpm exec` y no `npx`: si el binario no estuviera instalado, `npx` lo baja
del registro y todo sigue en verde **midiendo otra version**.

⚠️ En local hay pnpm 11 y **Vercel corre pnpm 9**. La config vive duplicada a
proposito en `.npmrc` y en `pnpm-workspace.yaml` porque cada version lee un
archivo distinto: si se toca una, se toca la otra.

## Los dos pisos de la suite (CDT-116)

🔴 Son **dos formas distintas de morir en verde** y ninguna caza a la otra. Ya
mordio a este proyecto: en los rn el CI de Jest nunca corrio y ocho suites
estaban muertas en verde.

| piso | que caza |
|---|---|
| **100 archivos** recolectados | un glob del `include` de `vitest.config.ts` que deja de matchear un **arbol entero** |
| **750 tests** ejecutados en verde | un `describe.skip` masivo o un guard que deja de matchear: los 142 archivos siguen ahi y `vitest run` **sale 0** |

```bash
set -euo pipefail

# 🔴 A un archivo y NO por tuberia a `wc`: una tuberia se come el exit code, asi
# que `vitest list | wc -l` devolveria el 0 de `wc` aunque la recoleccion
# hubiera reventado.
pnpm exec vitest list --filesOnly > /tmp/archivos-recolectados.txt
n="$(wc -l < /tmp/archivos-recolectados.txt | tr -d '[:space:]')"
echo "Archivos de test recolectados: $n (piso: 100)"
[ "$n" -ge 100 ] || { echo "ROJO: mira la lista blanca de \`include\` en vitest.config.ts"; exit 1; }

pnpm exec vitest run --reporter=default --reporter=json --outputFile.json=/tmp/vitest-resultado.json

node -e '
  const r = require("/tmp/vitest-resultado.json");
  const piso = 750;
  const verdes = r.numPassedTests;
  const dormidos = r.numPendingTests + r.numTodoTests;
  console.log(`Tests ejecutados y en verde: ${verdes} (piso: ${piso}) — sin ejecutar: ${dormidos}`);
  if (verdes < piso) {
    console.log(`ROJO: hay ${dormidos} sin ejecutar. Busca un describe.skip/it.skip o un guard que dejo de matchear.`);
    process.exit(1);
  }
'
```

### De donde salen los numeros

Medidos el **2026-08-20** (CDT-116), y son una **decision**, no una medicion que
se re-derive sola.

- **142 archivos**: `src/modulos` 84, `src/mk` 48, `src/components` 5,
  `src/types` 3, `src/styles` 1, `src/test` 1. Lo que se rompe no es un archivo
  suelto: es un arbol entero. Perder el mas grande deja 58; perder el segundo
  deja 94. El piso tiene que estar **por encima de 94** para cazar cualquiera de
  los dos, y bien por debajo de 142 para no ponerse rojo solo. **100** cumple las
  dos y deja 42 de margen.
- **917 tests**: `src/modulos` 625, `src/mk` 213, `src/types` 51,
  `src/components` 24, `src/styles` 2, `src/test` 2. De los dos arboles grandes,
  el que menos se lleva es `src/mk`, que deja 704. El piso tiene que estar **por
  encima de 704**. **750** cumple y deja 167 de margen.

🔴 Se cuenta `numPassedTests` —los que EJECUTARON y quedaron en verde— y no
`numTotalTests`, que incluye a los skippeados y por lo tanto no se moveria.

🔴 **El piso es ESTATICO y la suite crece.** El disparador para revisarlo es
concreto: cuando `total − tests(src/mk)` se acerque a 750 (hoy da 704). Ahi se
sube el piso Y se actualiza este reparto, juntos.

Si la suite baja de los pisos sin que nadie lo haya decidido, **eso ES el
hallazgo**.

## Como se vuelve a prender

El workflow no se perdio: esta en el historial, con todos sus comentarios.

```bash
git log --oneline --diff-filter=D -- .github/workflows/
git checkout <ese-commit>^ -- .github/workflows/
```

⚠️ Antes de volver a prenderlo, releer su bloque `concurrency`: fuera de los PR
el grupo lleva el `sha`, y **no es cosmetico**. Con el grupo por rama, tres
merges seguidos a `dev` dejan un commit **sin veredicto y en silencio** —figura
`cancelled`, no rojo—.
