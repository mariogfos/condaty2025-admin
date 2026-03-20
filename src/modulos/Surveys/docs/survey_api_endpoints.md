# Guía de Endpoints - Módulo Surveys (API)

Este documento resume los endpoints disponibles para el módulo de encuestas y su propósito sugerido.

## Base URL: `/api/surveys`

| Método | Endpoint | Parámetros Clave | Propósito |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | `fullType=CRUD` | Lista para administración (con contadores globales). |
| `GET` | `/` | `fullType=L`, `filterBy=(P\|R\|E)` | Lista para residentes (Pendientes, Respondidas, Expiradas). |
| `GET` | `/` | `fullType=DET`, `searchBy={id}` | Detalle completo. **Usa SurveyResource** (preguntas, opciones, metadata). |
| `GET` | `/my-counts` | `dpto_id` (opcional) | Contadores resumidos (P/R/E) para el usuario. |
| `GET` | `/results` | `survey_id`, `dpto_id` (opcional) | **Estadísticas y respuestas del usuario**. Devuelve `user_response`. |
| `POST` | `/answers` | `survey_id`, `squestions` (lista) | **Enviar respuestas**. Requiere `soption_id` para escala/selección. |
| `POST` | `/calculate-audience` | `target_criteria` | Estimar alcance antes de publicar (Admin). |
| `PUT` | `/{id}/status` | `status=(A\|C\|S\|X...)` | Cambiar estado (Publicar, Cerrar, etc.). |
| `POST` | `/{id}/duplicate` | - | Clonar encuesta. **Devuelve SurveyResource** (objeto completo con preguntas). |

## Estructura de Datos (Resultados)

El endpoint `/results` devuelve un objeto con:
- `survey_info`: Resumen (Total participantes, puntaje global).
- `questions`: Lista de preguntas procesadas para gráficos.
  - Cada pregunta incluye `user_response`: El valor o IDs elegidos por el usuario actual.
  - Las opciones vienen con `votes`.

## Flujo Recomendado para Visualización del Usuario

1.  **Si NO ha respondido**: Usar `fullType=DET` para renderizar el formulario.
2.  **Si YA ha respondido**: Usar `results` para mostrar los gráficos y resaltar su respuesta `user_response`.
