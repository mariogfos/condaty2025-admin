# useCrud Hook Documentation

## Overview

`useCrud` is a comprehensive React hook that provides a complete CRUD (Create, Read, Update, Delete) solution for React applications. It handles data fetching, form management, validation, pagination, filtering, searching, importing, and exporting operations.

## Features

- ✅ **Complete CRUD Operations**: Create, Read, Update, Delete
- ✅ **Form Management**: Automatic form state management and validation
- ✅ **Pagination**: Built-in pagination support
- ✅ **Search & Filter**: Advanced search and filtering capabilities
- ✅ **Import/Export**: Data import and export functionality
- ✅ **Permission System**: Role-based access control integration
- ✅ **Customizable UI**: Custom render functions for forms, views, and actions
- ✅ **Responsive Design**: Mobile-friendly interface
- ✅ **TypeScript Support**: Full TypeScript definitions

## Basic Usage

```typescript
import { useCrud } from '@/mk/hooks/useCrud/useCrud';

const MyComponent = () => {
  const {
    List,
    onAdd,
    onEdit,
    onDel,
    onView,
    data,
    loaded
  } = useCrud({
    paramsInitial: { page: 1, perPage: 10 },
    mod: {
      modulo: 'users',
      singular: 'Usuario',
      plural: 'Usuarios',
      permiso: 'USER'
    },
    fields: {
      name: {
        label: 'Nombre',
        form: { type: 'text' },
        list: { order: 1 }
      },
      email: {
        label: 'Email',
        form: {
          type: 'email',
          rules: { required: true, email: true }
        },
        list: { order: 2 }
      }
    }
  });

  return (
    <div>
      <List />
    </div>
  );
};
```

## Configuration (ModCrudType)

### Basic Configuration

```typescript
const modConfig: ModCrudType = {
  modulo: 'users',           // API endpoint identifier
  singular: 'Usuario',       // Singular entity name
  plural: 'Usuarios',        // Plural entity name
  permiso: 'USER'           // Permission code for access control
};
```

### Optional Features

```typescript
const modConfig: ModCrudType = {
  // Basic configuration
  modulo: 'users',
  singular: 'Usuario',
  plural: 'Usuarios',
  permiso: 'USER',

  // Optional features
  export: true,              // Enable export functionality
  import: true,              // Enable import functionality
  filter: true,              // Enable filtering
  search: true,              // Enable search
  pagination: true,          // Enable pagination
  listAndCard: true,         // Enable list/card view toggle

  // Custom titles
  titleAdd: 'Crear Usuario',
  titleEdit: 'Editar Usuario',
  titleDel: 'Eliminar Usuario',

  // Custom messages
  saveMsg: {
    add: 'Usuario creado exitosamente',
    edit: 'Usuario actualizado exitosamente',
    del: 'Usuario eliminado exitosamente'
  },

  // Hide specific actions
  hideActions: {
    add: false,
    edit: false,
    del: false,
    view: false
  }
};
```

## Field Configuration (FieldConfig)

### Basic Field

```typescript
const fields = {
  name: {
    label: 'Nombre',
    form: { type: 'text' },
    list: { order: 1 }
  }
};
```

### Advanced Field Configuration

```typescript
const fields = {
  name: {
    label: 'Nombre',
    form: {
      type: 'text',
      label: 'Nombre completo',
      order: 1,
      rules: { required: true, minLength: 3 },
      style: { width: '100%' }
    },
    list: {
      label: 'Nombre',
      order: 1,
      width: '200px'
    },
    view: {
      label: 'Nombre',
      order: 1
    }
  },

  status: {
    label: 'Estado',
    form: {
      type: 'select',
      options: [
        { id: 'active', name: 'Activo' },
        { id: 'inactive', name: 'Inactivo' }
      ],
      optionLabel: 'name',
      optionValue: 'id'
    },
    list: {
      order: 2,
      onRender: (item) => (
        <span className={item.value === 'active' ? 'badge-success' : 'badge-danger'}>
          {item.value === 'active' ? 'Activo' : 'Inactivo'}
        </span>
      )
    }
  },

  category: {
    label: 'Categoría',
    form: {
      type: 'select',
      optionsExtra: 'categories', // Load from extraData
      optionLabel: 'name',
      optionValue: 'id'
    }
  }
};
```

## Hook Return Value (UseCrudType)

The hook returns an object with the following properties:

### Core Functions

```typescript
interface UseCrudType {
  // CRUD Operations
  onAdd: () => void;                    // Open add form
  onEdit: (item: Record<string, any>) => void;  // Open edit form
  onDel: (item: Record<string, any>) => void;   // Open delete confirmation
  onView: (item: Record<string, any>) => void;  // Open view modal
  onSave: (data: Record<string, any>, setErrors?: Function) => Promise<void>;

  // Data Management
  data: any;                           // Current data
  loaded: boolean;                     // Loading state
  reLoad: (params?: Record<string, any>, noWaiting?: boolean, force?: boolean) => void;

  // State Management
  formState: Record<string, any>;      // Current form data
  setFormState: (state: Record<string, any>) => void;
  errors: Record<string, any>;         // Form errors
  setErrors: (errors: Record<string, any>) => void;

  // UI State
  open: boolean;                       // Form modal open state
  setOpen: (open: boolean) => void;
  openView: boolean;                   // View modal open state
  setOpenView: (open: boolean) => void;
  openDel: boolean;                    // Delete modal open state
  setOpenDel: (open: boolean) => void;

  // Search & Filter
  onSearch: (searchTerm: string) => void;
  onFilter: (filterKey: string, filterValue: string) => void;
  searchs: Record<string, any>;
  setSearchs: (search: Record<string, any>) => void;

  // Pagination
  onChangePage: (page: number) => void;
  onChangePerPage: (perPage: number) => void;
  getTotalPages: () => number;

  // Import/Export
  onImport: () => void;
  onExport: (type?: 'pdf' | 'xls' | 'csv', callback?: Function) => void;

  // Utility Functions
  userCan: (permission: string, action: string) => boolean;
  findOptions: (value: any, options: Record<string, any>[], key?: string, label?: string) => string;

  // Components
  List: React.FC<any>;                 // Main list component

  // Extra Data
  extraData: Record<string, any>;
  getExtraData: () => Promise<void>;
}
```

## Custom Render Functions

### Custom Form Renderer

```typescript
const customFormRenderer = ({
  open,
  onClose,
  item,
  setItem,
  onSave,
  extraData,
  errors,
  setErrors
}) => {
  return (
    <DataModal open={open} onClose={onClose} title="Custom Form">
      <CustomForm
        data={item}
        onChange={setItem}
        onSave={onSave}
        errors={errors}
        extraData={extraData}
      />
    </DataModal>
  );
};

const modConfig = {
  // ... other config
  renderForm: customFormRenderer
};
```

### Custom View Renderer

```typescript
const customViewRenderer = ({
  open,
  onClose,
  item,
  extraData
}) => {
  return (
    <DataModal open={open} onClose={onClose} title="Custom View">
      <CustomView data={item} extraData={extraData} />
    </DataModal>
  );
};

const modConfig = {
  // ... other config
  renderView: customViewRenderer
};
```

## Advanced Examples

### With Custom Search

```typescript
const customSearch = (searchTerm: string, previousSearch: Record<string, any>) => {
  return {
    searchBy: searchTerm,
    searchFields: ['name', 'email'] // Search in specific fields
  };
};

const {
  onSearch,
  searchs
} = useCrud({
  // ... config
  getSearch: customSearch
});
```

### With Custom Filter

> 🔴 **"Sin filtro" son sólo `undefined`, `null` y `""`.** El hook serializa
> `filterBy` a la cadena `campo:valor|campo:valor` descartando únicamente esos
> tres valores, y el **cero es un valor legítimo**: hay estados que valen 0
> (`ExpenseStatus.CANCELLED`, `PaymentStatus.CANCELLED`,
> `BankAccountStatus.INACTIVE`, `BankEntityStatus.INACTIVE`). Un `getFilter`
> propio que borre la clave con un chequeo de verdad (`if (!value) delete ...`)
> hace que el back reciba la lista SIN filtrar, sin ningún error: la pantalla
> muestra todos los estados y el usuario les cree (CDT-38, Egresos).
>
> `filterValue` puede llegar como número: es el `id` crudo de la opción del
> `Select`, no una cadena.

```typescript
const customFilter = (filterKey: string, filterValue: string | number, previousFilter: Record<string, any>) => {
  if (filterValue === "" || filterValue === null || filterValue === undefined) {
    const { [filterKey]: _, ...resto } = previousFilter.filterBy || {};
    return { filterBy: resto };
  }

  return {
    filterBy: {
      ...previousFilter.filterBy,
      [filterKey]: filterValue
    }
  };
};

const {
  onFilter
} = useCrud({
  // ... config
  getFilter: customFilter
});
```

### With Custom Change Handler

```typescript
const customChangeHandler = (
  e: React.ChangeEvent,
  formState: Record<string, any>,
  setFormState: (state: Record<string, any>) => void,
  setShowExtraModal?: (modal: any) => void,
  action?: ActionType
) => {
  // Custom logic here
  if (e.target.name === 'category' && e.target.value) {
    // Load subcategory options
    loadSubcategories(e.target.value);
  }

  // Return false to prevent default behavior
  return false;
};

const {
  onChange
} = useCrud({
  // ... config
  _onChange: customChangeHandler
});
```

## Permission System

The hook integrates with the authentication system to check permissions:

```typescript
// The hook automatically checks permissions for actions
const { onAdd, onEdit, onDel, userCan } = useCrud({
  mod: {
    modulo: 'users',
    permiso: 'USER' // Permission code
  }
});

// Manual permission check
if (userCan('USER', 'C')) { // C = Create
  // User can create
}

if (userCan('USER', 'R')) { // R = Read
  // User can read
}

if (userCan('USER', 'U')) { // U = Update
  // User can update
}

if (userCan('USER', 'D')) { // D = Delete
  // User can delete
}
```

## Best Practices

### 1. Field Configuration
- Always define proper field types in `form.type`
- Use validation rules for required fields
- Set appropriate `order` values for field ordering
- Use `optionLabel` and `optionValue` for select fields

### 2. Performance
- Use `noWaiting` option for background operations
- Implement proper loading states
- Use pagination for large datasets

### 2.1 Scroll infinito dentro de un `<LoadingScreen>` (CDT-53)

Con `paramsInitial.perPage > 0` el hook usa scroll infinito y pide las páginas
solo. Ese pedido decide por sí mismo si mueve el contador global `waiting` del
`AxiosInstanceProvider` —el que `LoadingScreen` usa para tapar a sus hijos con
un esqueleto—, y el criterio es la PÁGINA:

| situación                                | `page` | esqueleto |
|------------------------------------------|--------|-----------|
| carga inicial                            | 1      | **sí**    |
| reset por filtro, búsqueda u orden        | 1      | **sí**    |
| append del scroll infinito                | > 1    | **no**    |

🔴 Un append que moviera `waiting` desmontaría el contenedor scrolleable y lo
remontaría con `scrollTop = 0`: la lista salta al inicio sola y con muchas filas
nunca se llega al final. Y al revés, apagarlo también en los resets dejaría al
usuario mirando las filas del filtro anterior como si fueran el resultado del
nuevo.

⚠️ El "cargando más" del pie de la lista NO sale de acá: lo dibuja
`isAppendingList`, que es del hook. Un módulo no necesita declarar `noWaiting`
para arreglar el salto de scroll — ya está resuelto en el hook, y declararlo
apagaría también el esqueleto de la carga inicial y el de los filtros.

### 3. User Experience
- Provide meaningful labels and messages
- Use custom renderers for complex UI requirements
- Implement proper error handling

### 4. TypeScript
- Define proper types for custom configurations
- Use type assertions when necessary
- Extend existing types for custom requirements

## Troubleshooting

### Common Issues

1. **TypeScript Errors**
   - Ensure all required properties are defined in `ModCrudType`
   - Check field configurations match `FieldConfig` interface
   - Verify custom render function signatures

2. **Permission Issues**
   - Check permission codes in authentication system
   - Verify user roles and permissions
   - Use `userCan` function for manual checks

3. **Data Not Loading**
   - Verify API endpoints and parameters
   - Check network connectivity
   - Review browser console for errors

4. **Form Validation Issues**
   - Ensure field rules are properly defined
   - Check validation function implementations
   - Verify form data structure

## 🔴 `onSave` nunca es mudo

Un guardado que no llega a buen puerto **siempre** dice algo. Son tres salidas y
las tres avisan:

| salida | qué se ve |
|---|---|
| `checkRulesFields` rechaza | toast de error `"Revisa los datos del formulario"`, y los mensajes por campo quedan en `errors` / el `setErrors` que le hayas pasado. **No se despacha request.** |
| el request responde `success: false` | el `message` del API |
| el request **muere** (500, red, un `1366` de MySQL) | `"No se pudo guardar. Intenta nuevamente."` — no hay sobre, así que no hay `message` |

⚠️ Que el rechazo de validación tenga toast **no exime al formulario de pintar
los errores por campo**. Si tu `renderForm` arma su propia validación local,
mezclá los dos juegos de errores; quedarte sólo con los locales tapa lo que
rechazó el kernel:

```tsx
// ❌ `{}` es truthy: este `||` se queda SIEMPRE con el del kernel
const errores = externalErrors || _errors;
// ✅
const errores = { ..._errors, ...(externalErrors || {}) };
```

Y `showToast("")` **no limpia la cola de toasts**: un pedido sin mensaje se
ignora. Para sacar un toast de la pantalla está el `onDismiss` del
`ToastViewport`, que lo quita por `id`.

Contexto: CDT-60. El alta de Deudas Individuales mandaba cuatro banderas como
`'Y'`/`'N'` a columnas `tinyint(1)`, el INSERT moría con
`ERROR 1366: Incorrect integer value: 'N' for column has_mv`, el toast salía sin
mensaje y `useToast` con mensaje vacío vaciaba la cola. Se apretaba Crear y la
pantalla no se movía.

### 🔴 Los 5 s del toast cuentan desde que se VE, no desde que se emite

El `time` de `showToast` (5 s por defecto) empieza a correr cuando el toast se
vuelve visible, no cuando nace. Con la pestaña oculta —cualquier acción que haga
`window.open`, como el recibo y el envío por WhatsApp de Pagos— el navegador
suspende el `requestAnimationFrame` de la animación de entrada, así que el toast
espera: aparece cuando el usuario vuelve y recién ahí arranca su reloj.

Contexto: CDT-68. Antes el reloj arrancaba en el montaje y el descarte estaba
condicionado a que el `rAF` hubiera corrido: el timeout vencía con la pestaña al
fondo, no encontraba la entrada hecha y **nunca agendaba el descarte**. Al volver
el toast aparecía y se quedaba para siempre, hasta 4 apilados y tapando el
buscador. No se podía cerrar a mano: la tarjeta tiene `pointer-events: none`.

## API Reference

### Types

- `ModCrudType`: Module configuration
- `FieldConfig`: Field definitions
- `UseCrudType`: Hook return type
- `RenderViewProps`: Custom view renderer props
- `RenderFormProps`: Custom form renderer props
- `RenderDelProps`: Custom delete renderer props

### Functions

- `useCrud(props)`: Main hook function
- `onAdd()`: Open add form
- `onEdit(item)`: Open edit form
- `onDel(item)`: Open delete confirmation
- `onView(item)`: Open view modal
- `onSave(data, setErrors?)`: Save form data
- `onSearch(searchTerm)`: Perform search
- `onFilter(key, value)`: Apply filter
- `onExport(type?, callback?)`: Export data
- `onImport()`: Open import modal
- `userCan(permission, action)`: Check permissions
- `findOptions(value, options, key?, label?)`: Find option label

## License

This hook is part of the internal component library and should be used according to project guidelines.