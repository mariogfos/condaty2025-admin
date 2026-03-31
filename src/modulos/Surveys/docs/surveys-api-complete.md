# API Documentation - Módulo Surveys (Complete)

> Documentación técnica completa de endpoints para equipos Frontend
> Versión API: Laravel REST
> Autenticación: Bearer Token (Sanctum)

---

## Tabla de Contenidos

1. [Base URL y Autenticación](#base-url-y-autenticación)
2. [Enumeraciones](#enumeraciones)
3. [Endpoints CRUD](#endpoints-crud)
4. [Endpoints de Respuestas](#endpoints-de-respuestas)
5. [Endpoints de Resultados y Estadísticas](#endpoints-de-resultados-y-estadísticas)
6. [Endpoints de Audiencia](#endpoints-de-audiencia)
7. [Endpoints de IA](#endpoints-de-ia)
8. [Estructuras de Datos](#estructuras-de-datos)
9. [Códigos de Error](#códigos-de-error)

---

## Base URL y Autenticación

```
Base URL: /api
Authentication: Bearer Token (Laravel Sanctum)
```

Todos los endpoints del módulo surveys requieren autenticación excepto los de lectura pública (si la encuesta está activa).

**Headers requeridos:**
```
Authorization: Bearer {token}
Content-Type: application/json
Accept: application/json
```

---

## Enumeraciones

### SurveyStatus (Estados de Encuesta)

| Valor | Etiqueta | Descripción |
|-------|----------|-------------|
| `D` | Borrador | Encuesta en edición, no visible |
| `S` | Programada | Programada para publicarse en el futuro |
| `A` | Activa | Recibiendo votos |
| `P` | Paused | Visible pero votación detenida |
| `C` | Cerrada | Finalizada, no permite más votos |
| `X` | Deshabilitada | Eliminada lógicamente |

### QuestionType (Tipos de Pregunta)

| Valor | Etiqueta | Descripción |
|-------|----------|-------------|
| `S` | Opción Única | Solo una selección permitida |
| `M` | Opción Múltiple | Múltiples selecciones permitidas |
| `E` | Escala | Valor numérico (1-5 o 1-10) |
| `T` | Texto Abierto | Respuesta libre del usuario |

### SurveyFilter (Filtros para Usuario)

| Valor | Etiqueta | Descripción |
|-------|----------|-------------|
| `P` | Pendientes | Encuestas no respondidas |
| `R` | Respondidas | Encuestas que el usuario ya respondió |
| `E` | Expiradas | Encuestas vencidas |

### TargetRoles (Roles para Segmentación de Encuestas)

> **Versión:** 2.0 (Marzo 2026)
> **Actualización:** Se agregaron 7 nuevos roles para mejor segmentación

| Rol | Descripción |
|-----|-------------|
| `owner_homeowner` | Propietario (dueño del departamento) |
| `owner_homeowner_resident` | Propietario que RESIDE en el condominio |
| `owner_homeowner_non_resident` | Propietario que NO reside en el condominio |
| `owner_titular` | Inquilino/Arrendatario |
| `resident` | Cualquier persona que resida (propietario + inquilino) |
| `owner_dependiente` | Dependiente de cualquier titular |
| `dependent_of_homeowner` | Dependiente de un propietario |
| `dependent_of_tenant` | Dependiente de un inquilino |
| `guard` | Guardia de seguridad |
| `guard_supervisor` | Supervisor de guardias |
| `admin` | Administrador del sistema |
| `directive` | Miembro de mesa directiva |

**Nota:** Un usuario puede tener múltiples roles simultáneamente. Ejemplo: un propietario que vive en el edificio tiene `owner_homeowner` + `owner_homeowner_resident` + `resident`.

---

## Endpoints CRUD

### 1. Listar Encuestas (Admin)

```http
GET /api/surveys?fullType=CRUD
```

**Parámetros Query:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `fullType` | string | ✅ | Usar `CRUD` para lista admin |
| `searchBy` | string | ❌ | Texto para buscar por título |
| `filterBy` | string | ❌ | Filtrar: `P` (Programadas), `C` (Cerradas), o expresión como `status:A\|status:P` |
| `include_counts` | boolean | ❌ | Include counts para usuarios regulares |

**Respuesta Exitosa (200):**

```json
{
  "data": [
    {
      "id": 1,
      "title": "Encuesta de satisfacción",
      "description": "Descripción de la encuesta",
      "status": "A",
      "status_label": "Activa",
      "is_mandatory": false,
      "target_criteria": {
        "roles": ["owner_titular"],
        "only_arrears": false,
        "only_current": false,
        "vote_per_unit": true,
        "unit_types": []
      },
      "created_by": 1,
      "created_by_name": "Juan Pérez",
      "scheduled_at": "2026-03-30T10:00:00-04:00",
      "published_at": "2026-03-30T09:00:00-04:00",
      "expires_at": "2026-04-30T23:59:59-04:00",
      "closed_at": null,
      "created_at": "2026-03-30T09:00:00-04:00",
      "squestions_count": 5,
      "total_voters": 45,
      "estimated_audience": 100,
      "participation_percentage": 45.0,
      "is_expired": false,
      "is_paused": false,
      "can_respond": false,
      "has_responded": false
    }
  ],
  "total": 10
}
```

---

### 2. Listar Encuestas (Usuario/Residente)

```http
GET /api/surveys?fullType=L&filterBy=P
```

**Parámetros Query:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `fullType` | string | ✅ | Usar `L` para lista de usuario |
| `filterBy` | string | ❌ | `P` (Pendientes), `R` (Respondidas), `E` (Expiradas) |
| `dpto_id` | integer | ❌ | Filtrar por departamento |
| `searchBy` | string | ❌ | Texto para buscar |
| `include_counts` | boolean | ❌ | Include counts |

**Respuesta Exitosa (200):**

```json
{
  "data": [
    {
      "id": 1,
      "title": "Encuesta de satisfacción",
      "description": "Descripción",
      "status": "A",
      "status_label": "Activa",
      "is_mandatory": true,
      "expires_at": "2026-04-30T23:59:59-04:00",
      "can_respond": true,
      "has_responded": false,
      "questions_count": 5,
      "total_voters": 45,
      "estimated_audience": 100,
      "participation_percentage": 45.0
    }
  ],
  "total": 5,
  "__extraData": {
    "counts": {
      "pending": 3,
      "answered": 2,
      "expired": 5
    }
  }
}
```

---

### 3. Ver Detalle de Encuesta

```http
GET /api/surveys?fullType=DET&searchBy={id}
```

**Parámetros Query:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `fullType` | string | ✅ | Usar `DET` para detalle |
| `searchBy` | integer | ✅ | ID de la encuesta |

**Respuesta Exitosa (200):**

```json
{
  "data": {
    "survey": {
      "id": 1,
      "title": "Encuesta de satisfacción",
      "description": "Descripción completa...",
      "status": "A",
      "status_label": "Activa",
      "is_mandatory": true,
      "expires_at": "2026-04-30T23:59:59-04:00",
      "can_respond": true,
      "has_responded": false,
      "squestions": [
        {
          "id": 1,
          "question_text": "¿Cómo califica el servicio?",
          "type": "S",
          "is_required": true,
          "min_options": 1,
          "max_options": 1,
          "order": 0,
          "soptions": [
            {
              "id": 1,
              "option_text": "Excelente",
              "description": null,
              "order": 0,
              "votes": 10
            },
            {
              "id": 2,
              "option_text": "Bueno",
              "description": null,
              "order": 1,
              "votes": 5
            }
          ]
        },
        {
          "id": 2,
          "question_text": "Comentarios adicionales",
          "type": "T",
          "is_required": false,
          "min_options": 0,
          "max_options": 1,
          "order": 1,
          "open_answers": ["Muy buen servicio", "Excelente atención"]
        }
      ]
    },
    "estimated_audience": 100,
    "total_voters": 45
  }
}
```

---

### 4. Crear Encuesta (Admin)

```http
POST /api/surveys
```

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**

```json
{
  "title": "Título de la encuesta",
  "description": "Descripción opcional",
  "is_mandatory": false,
  "target_criteria": {
    "roles": ["owner_titular", "owner_homeowner"],
    "unit_types": [1, 2, 3],
    "only_arrears": false,
    "only_current": true,
    "only_inhabited_units": false,
    "vote_per_unit": true
  },
  "scheduled_at": "2026-04-01T10:00:00",
  "expires_at": "2026-04-30T23:59:59",
  "squestions": [
    {
      "question_text": "¿Cómo califica el servicio?",
      "type": "S",
      "description": null,
      "is_required": true,
      "min_options": 1,
      "max_options": 1,
      "order": 0,
      "soptions": [
        { "option_text": "Excelente", "order": 0 },
        { "option_text": "Bueno", "order": 1 },
        { "option_text": "Regular", "order": 2 },
        { "option_text": "Malo", "order": 3 }
      ]
    },
    {
      "question_text": "¿Del 1 al 5, qué tan satisfecho está?",
      "type": "E",
      "is_required": true,
      "min_options": 1,
      "max_options": 1,
      "order": 1,
      "soptions": []
    },
    {
      "question_text": "Comentarios adicionales",
      "type": "T",
      "is_required": false,
      "order": 2,
      "soptions": []
    }
  ]
}
```

**Respuesta Exitosa (201):**

```json
{
  "ok": true,
  "message": "Encuesta creada con éxito",
  "data": {
    "id": 1,
    "title": "Título de la encuesta",
    "status": "D"
  }
}
```

---

### 5. Actualizar Encuesta (Admin)

```http
PUT /api/surveys/{id}
```

**Body:** Mismo formato que crear, todos los campos opcionales.

**Respuesta Exitosa (200):**

```json
{
  "ok": true,
  "message": "Encuesta actualizada con éxito",
  "data": {
    "id": 1,
    "title": "Título actualizado",
    "status": "D"
  }
}
```

---

### 6. Eliminar Encuesta (Admin)

```http
DELETE /api/surveys/{id}
```

**Restricciones:** No se puede eliminar una encuesta que ya tiene respuestas.

**Respuesta Exitosa (200):**

```json
{
  "ok": true,
  "message": "Encuesta eliminada"
}
```

**Respuesta Error (422):**

```json
{
  "ok": false,
  "message": "No se puede eliminar una encuesta que ya tiene respuestas registradas.",
  "data": []
}
```

---

### 7. Cambiar Estado de Encuesta

```http
PUT /api/surveys/{id}/status
```

**Body:**

```json
{
  "status": "A",
  "scheduled_at": "2026-04-01T10:00:00",
  "expires_at": "2026-04-30T23:59:59"
}
```

**Valores de status:** `D`, `S`, `A`, `P`, `C`, `X`

**Respuesta Exitosa (200):**

```json
{
  "ok": true,
  "message": "La encuesta ahora está: Activa",
  "data": {
    "id": 1,
    "status": "A",
    "status_label": "Activa"
  }
}
```

---

### 8. Duplicar Encuesta

```http
POST /api/surveys/{id}/duplicate
```

**Respuesta Exitosa (200):**

```json
{
  "ok": true,
  "message": "Encuesta clonada como borrador...",
  "data": {
    "id": 2,
    "title": "Título (Copia)",
    "status": "D",
    "squestions": [...]
  }
}
```

---

## Endpoints de Respuestas

### 9. Enviar Respuestas

```http
POST /api/surveys/answers
```

**Body:**

```json
{
  "survey_id": 1,
  "dpto_id": 5,
  "started_at": "2026-03-30T10:00:00",
  "completed_at": "2026-03-30T10:05:00",
  "squestions": [
    {
      "squestion_id": 1,
      "soption_id": 2
    },
    {
      "squestion_id": 2,
      "soption_id": 3
    },
    {
      "squestion_id": 3,
      "answer": "Muy satisfecho con el servicio"
    },
    {
      "squestion_id": 4,
      "soption_ids": [1, 3]
    }
  ]
}
```

**Estructura de cada respuesta según tipo:**

| Tipo Pregunta | Campo a usar | Ejemplo |
|---------------|--------------|---------|
| `S` (Única) | `soption_id` | `{ "squestion_id": 1, "soption_id": 2 }` |
| `M` (Múltiple) | `soption_ids` (array) | `{ "squestion_id": 1, "soption_ids": [1, 3] }` |
| `E` (Escala) | `soption_id` | `{ "squestion_id": 1, "soption_id": 3 }` (3 = valor 3) |
| `T` (Texto) | `answer` | `{ "squestion_id": 1, "answer": "Mi comentario" }` |

**Respuesta Exitosa (200):**

```json
{
  "ok": true,
  "message": "¡Tu participación ha sido registrada con éxito!",
  "data": {
    "ok": true
  }
}
```

---

## Endpoints de Resultados y Estadísticas

### 10. Obtener Resultados de Encuesta

```http
GET /api/surveys/results?survey_id={id}
```

**Parámetros Query:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `survey_id` | integer | ✅ | ID de la encuesta |
| `dpto_id` | integer | ❌ | Filtrar por departamento |

**Respuesta Exitosa (200):**

```json
{
  "ok": true,
  "message": "Resultados obtenidos correctamente",
  "data": {
    "survey_info": {
      "id": 1,
      "title": "Encuesta de satisfacción",
      "total_participants": 45,
      "global_score": 4.2
    },
    "questions": [
      {
        "id": 1,
        "question_text": "¿Cómo califica el servicio?",
        "type": "S",
        "options": [
          {
            "id": 1,
            "option_text": "Excelente",
            "votes": 20,
            "percentage": 44.44,
            "user_response": 1
          },
          {
            "id": 2,
            "option_text": "Bueno",
            "votes": 15,
            "percentage": 33.33,
            "user_response": null
          }
        ]
      }
    ],
    "user_response": {
      "1": { "squestion_id": 1, "soption_id": 1 }
    }
  }
}
```

---

### 11. Obtener Contadores del Usuario

```http
GET /api/surveys/my-counts?dpto_id={id}
```

**Parámetros Query:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `dpto_id` | integer | ❌ | ID del departamento |

**Respuesta Exitosa (200):**

```json
{
  "ok": true,
  "message": "Contadores obtenidos correctamente",
  "data": {
    "pending": 3,
    "answered": 2,
    "expired": 5,
    "total": 10
  }
}
```

---

### 12. Obtener Respuestas de Texto (Admin)

```http
GET /api/surveys/text-responses/{questionId}
```

**Parámetros Query:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `page` | integer | Página (default: 1) |

**Respuesta Exitosa (200):**

```json
{
  "ok": true,
  "message": "Listado de comentarios",
  "data": {
    "data": [
      {
        "id": 1,
        "answer": "Excelente servicio",
        "respondent": {
          "id": 5,
          "name": "Juan Pérez"
        }
      }
    ],
    "current_page": 1,
    "last_page": 1,
    "per_page": 20,
    "total": 15
  }
}
```

---

## Endpoints de Audiencia

### 13. Calcular Audiencia

```http
POST /api/surveys/calculate-audience
```

**Body:**

```json
{
  "client_id": "uuid-del-cliente",
  "target_criteria": {
    "roles": ["owner_titular", "owner_homeowner"],
    "unit_types": [1, 2],
    "only_arrears": false,
    "only_current": true,
    "vote_per_unit": true
  }
}
```

**Respuesta Exitosa (200):**

```json
{
  "ok": true,
  "message": "Audiencia calculada",
  "data": {
    "count": 150
  }
}
```

---

## Endpoints de IA

### 14. Iniciar Análisis de IA

```http
POST /api/surveys/analyze-ai
```

**Body:**

```json
{
  "survey_id": 1,
  "provider": "gemini"
}
```

**Proveedores disponibles:** `gemini` (default), `openai`

**Respuesta Exitosa (200):**

```json
{
  "ok": true,
  "message": "Análisis de IA iniciado para toda la encuesta:gemini",
  "data": null
}
```

---

### 15. Obtener Reportes de IA

```http
GET /api/surveys/ai-reports?survey_id={id}
```

**Respuesta Exitosa (200):**

```json
{
  "ok": true,
  "message": "Reportes de IA recuperados",
  "data": [
    {
      "id": 1,
      "survey_id": 1,
      "squestion_id": null,
      "analysis": "Análisis completo de la encuesta...",
      "provider": "gemini",
      "created_at": "2026-03-30T10:00:00"
    }
  ]
}
```

---

## Estructuras de Datos

### Survey (Recurso completo)

```typescript
interface Survey {
  id: number;
  title: string;
  description: string | null;
  target_criteria: {
    roles: string[];
    unit_types: number[];
    only_arrears: boolean;
    only_current: boolean;
    only_inhabited_units: boolean;
    vote_per_unit: boolean;
  };
  created_by: number;
  created_by_name: string;
  is_mandatory: boolean;
  status: 'D' | 'S' | 'A' | 'P' | 'C' | 'X';
  status_label: string;
  scheduled_at: string | null;
  published_at: string | null;
  expires_at: string | null;
  closed_at: string | null;
  created_at: string;
  squestions: Question[];
  is_expired: boolean;
  is_paused: boolean;
  can_respond: boolean;
  has_responded: boolean;
  questions_count: number;
  total_voters: number;
  estimated_audience: number;
  participation_percentage: number;
}
```

### Question

```typescript
interface Question {
  id: number;
  question_text: string;
  type: 'S' | 'M' | 'E' | 'T';
  is_required: boolean;
  min_options: number;
  max_options: number;
  order: number;
  soptions: Option[];
  open_answers?: string[]; // Solo para tipo T
}
```

### Option

```typescript
interface Option {
  id: number;
  option_text: string;
  description: string | null;
  order: number;
  votes?: number;
  was_selected?: boolean;
}
```

---

## Códigos de Error

| Código | Descripción |
|--------|-------------|
| `200` | Éxito |
| `201` | Creado correctamente |
| `400` | Solicitud malformada |
| `401` | No autenticado |
| `403` | No autorizado (solo admin) |
| `404` | Recurso no encontrado |
| `422` | Validación fallida |
| `500` | Error interno del servidor |

### Mensajes de Error Comunes

```json
{
  "message": "Solo el administrador puede crear encuestas.",
  "message": "Solo el administrator puede editar encuestas.",
  "message": "Encuesta no encontrada.",
  "message": "No se puede eliminar una encuesta que ya tiene respuestas registradas.",
  "message": "Estado no válido. Use: D, S, A, P, C, X"
}
```

---

## Notas Importantes

1. **Fechas**: Todas las fechas se devuelven en zona horaria Bolivia (`-04:00`)
2. **Audiencia**: El campo `estimated_audience` es una estimación basada en los criterios de segmentación
3. **Votación por unidad**: Si `vote_per_unit = true`, cada unidad (departamento) cuenta como un voto; si es `false`, cada usuario cuenta como un voto
4. **Respuestas obligatorias**: El campo `is_mandatory` indica si el usuario debe responder para continuar usando la app

---

*Documento generado automáticamente del código fuente del módulo Surveys*
*Última actualización: 2026-03-30*
