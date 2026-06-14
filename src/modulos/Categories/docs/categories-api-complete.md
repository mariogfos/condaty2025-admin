# API Documentation - Módulo Categories (Complete)

> Documentación técnica completa de endpoints y enumeraciones para equipos Frontend
> Versión API: Laravel REST (v3)
> Autenticación: Bearer Token (Sanctum)

---

## Tabla de Contenidos

1. [Base URL y Autenticación](#base-url-y-autenticación)
2. [Enumeraciones](#enumeraciones)
3. [Endpoints CRUD](#endpoints-crud)
4. [Estructuras de Datos](#estructuras-de-datos)

---

## Base URL y Autenticación

```
Base URL: /api/v3
Authentication: Bearer Token (Laravel Sanctum)
```

Todos los endpoints del módulo categories requieren autenticación.

**Headers requeridos:**
```
Authorization: Bearer {token}
Content-Type: application/json
Accept: application/json
```

---

## Enumeraciones

El backend utiliza tipos numéricos para optimizar los índices B-Tree de la base de datos (Estrategia Expand and Contract).

### CategoryType (Tipo de Movimiento)
Representa si la categoría agrupa ingresos o egresos.

| Valor | Etiqueta | Descripción |
|-------|----------|-------------|
| `1` | Ingreso | Movimientos de entrada financiera |
| `2` | Egreso | Movimientos de salida financiera |

### CategoryStatus (Estado de la Categoría)
Determina la visibilidad y uso de la categoría.

| Valor | Etiqueta | Descripción |
|-------|----------|-------------|
| `0` | Inactivo | Oculta para nuevas transacciones |
| `1` | Activo | Habilitada y utilizable |
| `2` | Anulado | Eliminada de forma pasiva por tener registros históricos vinculados |

### CategoryFixed (Inmutabilidad del Sistema)
Define si la categoría es protegida y no puede eliminarse ni editarse de forma directa.

| Valor | Etiqueta | Descripción |
|-------|----------|-------------|
| `0` | No | Modificable por el usuario |
| `1` | Sí | Categoría por defecto requerida por el sistema |

---

## Endpoints CRUD

### 1. Listar Categorías
* **Ruta**: `GET /categories`
* **Query Params**:
  * `type`: `1` (Ingresos) o `2` (Egresos). Por defecto `1`.
  * `searchBy`: Término de búsqueda por nombre o descripción.
  * `perPage`: Cantidad de ítems por página (opcional, para habilitar paginación).
* **Respuesta**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "name": "Expensas",
        "description": "Cuotas de mantenimiento ordinarias",
        "type": 1,
        "status": 1,
        "fixed": 1,
        "category_id": null,
        "bank_account_id": 3,
        "hijos": []
      }
    ]
  }
  ```

### 2. Obtener Datos Extras (Extradata)
* **Ruta**: `GET /categories?fullType=EXTRA`
* **Query Params**:
  * `type`: `1` (Ingresos) o `2` (Egresos).
* **Respuesta**:
  ```json
  {
    "success": true,
    "data": {
      "categories": [
        { "id": 1, "name": "Expensas" }
      ],
      "bankAccounts": [
        { "id": 3, "alias_holder": "Banco Unión - Administración" }
      ],
      "searchMsg": "Busque por categoría o descripción"
    }
  }
  ```

### 3. Crear Categoría o Subcategoría
* **Ruta**: `POST /categories`
* **Body**:
  ```json
  {
    "name": "Mantenimiento Ascensores",
    "description": "Repuestos e inspecciones",
    "type": 2,
    "category_id": 2,
    "bank_account_id": 3
  }
  ```

### 4. Actualizar Categoría
* **Ruta**: `PUT /categories/{id}`
* **Body**:
  ```json
  {
    "name": "Inspección Ascensores",
    "description": "Repuestos e inspecciones mensuales",
    "type": 2,
    "category_id": 2,
    "bank_account_id": 3
  }
  ```

### 5. Eliminar Categoría
* **Ruta**: `DELETE /categories/{id}`
* **Respuesta**:
  - Si no está asociada a transacciones (Borrado físico):
    ```json
    {
      "success": true,
      "message": "Categoría eliminada con éxito"
    }
    ```
  - Si tiene uso pasivo en transacciones (Borrado lógico / Anulación):
    ```json
    {
      "success": true,
      "message": "La categoría se encuentra en uso. Ha sido desactivada para evitar inconsistencias."
    }
    ```

---

## Estructuras de Datos

### CategoryItem (Estructura en Frontend)
```typescript
export interface CategoryItem {
  id?: string | number;
  name?: string;
  description?: string;
  category_id?: string | number | null;
  category?: {
    id?: string | number;
    name?: string;
  };
  hijos?: CategoryItem[];
  type?: CategoryType | number;
  status?: CategoryStatus | number;
  fixed?: CategoryFixed | number;
  _isAddingSubcategoryFlow?: boolean;
}
```
