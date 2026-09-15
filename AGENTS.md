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

## Git y validación

- Usa la identidad `Alexander Hurtado <product.designer.fos@gmail.com>` y la
  cuenta GitHub `landerxhurtado` para operaciones remotas.
- No hagas push, merge ni deploy sin autorización explícita.
- Ejecuta pruebas focalizadas, build y `git diff --check` antes de proponer un
  PR. Un merge o build correcto no demuestra por sí solo un despliegue.
