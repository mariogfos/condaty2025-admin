# Admin — guía operativa para agentes

## Antes de cambiar

1. Ejecuta `git status --short --branch` y revisa el remoto, la identidad local
   y el ambiente objetivo. Conserva cualquier cambio existente del usuario.
2. Antes de iniciar cualquier fix o feature, ejecuta
   `git fetch --prune origin <rama-base>` y compara la base local con
   `origin/<rama-base>`. Si el checkout está limpio y solo atrasado, actualízalo
   mediante `git pull --ff-only`; si tiene cambios o divergencia, consérvalo y
   crea un worktree aislado desde el remoto recién actualizado. Nunca inicies
   trabajo nuevo desde una referencia remota sin refrescar.
3. Crea la rama de trabajo desde el `origin/<rama-base>` verificado y mantén
   separados los cambios de `test` y producción.

## Integración `ryno` y promoción a Test

- Para nuevos fixes y features, `ryno` es la rama base de desarrollo. Refresca
  `origin/ryno`, crea una rama `feature/*` o `fix/*` y entrega mediante PR hacia
  `ryno`. Después promueve `ryno` a `test` mediante otro PR autorizado; no
  desarrolles directamente sobre `test` salvo una conciliación o emergencia
  expresamente acordada, que también debe volver a `ryno`.
- `test` debe tener el mismo árbol de archivos que `ryno` tras la promoción.
  Antes de ella, revisa commits y diferencias de ambos lados. Si existen
  cambios exclusivos de `test`, concílialos explícitamente antes de promover;
  no hagas merges masivos ni sobrescribas una rama a ciegas. Después de los
  merges, refresca ambas referencias y comprueba que
  `git diff --exit-code origin/ryno origin/test` no tenga diferencias. Un squash
  puede producir SHA distintos aunque el
  contenido sea idéntico; informa ambos SHA y cualquier diferencia pendiente.
- El merge a `test` no equivale a un despliegue ni autoriza cambios en
  Producción.

## Promoción exacta a Producción

- Solo con autorización explícita, audita primero los cambios exclusivos de
  `prod` y conserva en `ryno`/`test` cualquier corrección productiva que deba
  sobrevivir. No sobrescribas esas diferencias sin revisarlas.
- Crea una rama de liberación desde `origin/prod` actualizado y sustituye su
  árbol de archivos versionados por el árbol exacto de `origin/test`. Entrega
  mediante PR y squash merge, sin force push; después confirma con
  `git diff --exit-code origin/test origin/prod` que ambos árboles coincidan.
- Esta promoción no borra configuración ni archivos persistentes del servidor,
  y no equivale a un despliegue.

## Git y validación

- Usa la identidad `Alexander Hurtado <product.designer.fos@gmail.com>` y la
  cuenta GitHub `landerxhurtado` para operaciones remotas.
- No hagas push, merge ni deploy sin autorización explícita.
- Ejecuta pruebas focalizadas, build y `git diff --check` antes de proponer un
  PR. Un merge o build correcto no demuestra por sí solo un despliegue.
