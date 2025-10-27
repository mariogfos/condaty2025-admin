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

```typescript
const customFilter = (filterKey: string, filterValue: string, previousFilter: Record<string, any>) => {
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