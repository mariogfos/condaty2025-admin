# Encuestas — el API que consume esta pantalla

> **La documentación del API vive en el API**, no acá:
> `condaty-api/app/Modules/Surveys/Docs/API.md` (cada endpoint, quién entra,
> parámetros, respuestas, errores), `CONTRATO.md` (qué pantalla de qué front
> llama a qué) y `ENUMS_Y_CONSTANTES.md`.
>
> Esta página tenía una copia de 864 líneas que se había quedado vieja: documentaba
> un endpoint que nunca tuvo ruta (`responses` de texto), `dpto_id` como filtro de
> los resultados (dejó de serlo el 2026-10-06) y no sabía que
> `generate-test-data` se retiró. Dos copias del mismo contrato se desincronizan;
> acá queda sólo lo que esta pantalla necesita saber y que el API no puede decir.

## Lo que las pantallas del admin mandan, y por qué

| pantalla | endpoint | lo que importa del lado del front |
|---|---|---|
| Encuestas (grilla) | `GET /v3/surveys?fullType=CRUD` | `filterBy` acepta el período de `created_at` (y las otras tres fechas) y `status`; cualquier otra clave se ignora |
| Formulario | `POST`/`PUT /v3/surveys[/{id}]` | `type` sólo `normal` o `assembly`, y **no cambia en la edición**. La edición sólo mueve entre Borrador y Programada: publicar, pausar o cerrar es `PUT /v3/surveys/{id}/status`. `min_options`/`max_options` hasta 100 |
| Detalle / tablero | `GET /v3/surveys/results` | sin `dpto_id`: no es un filtro. Los filtros del tablero (`block_id`, `date_from`, `date_to`, `is_arrears`, `respondent_type`) sólo aplican a una encuesta **no anónima** |
| Mis Encuestas | `POST /v3/surveys/answers` | **sin `dpto_id`**: el administrador vota como persona. Mandar una unidad es 403. Una papeleta sin respuestas es 422 |
| Votaciones de asamblea | `POST`/`PUT`/`DELETE /v3/surveys`, `/status` | se votan por la asamblea, nunca por `/v3/surveys/answers` (422) |
