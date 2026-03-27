# CONDATY ADMIN - Contexto Completo del Proyecto

## 📋 Información General del Proyecto

**Nombre del Proyecto**: Condaty Admin
**Tipo**: Aplicación Web de Administración Condominial
**Framework Principal**: Next.js 15.2.4 con React 19.1.0
**Lenguaje**: TypeScript con configuración estricta
**Estilos**: CSS personalizado con variables CSS para tema oscuro
**Build Tool**: Turbopack para desarrollo rápido

---

## 🏗️ Arquitectura Técnica

### Configuración del Proyecto

#### package.json - Dependencias Principales
```json
{
  "name": "condaty-admin",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "next": "15.2.4",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "typescript": "^5",
    "axios": "^1.6.0",
    "date-fns": "^3.0.6",
    "react-apexcharts": "^1.4.1",
    "html2canvas": "^1.4.1",
    "xlsx": "^0.18.5",
    "pusher-js": "^8.4.0-rc2",
    "instantdb": "^0.15.0"
  }
}
```

#### TypeScript Configuration (tsconfig.json)
- **Target**: ES5
- **Strict Mode**: Habilitado
- **Module Resolution**: Node
- **JSX**: React JSX
- **Paths**: Configurados para imports absolutos

#### Next.js Configuration
- **App Router**: Utiliza el nuevo sistema de rutas de Next.js 13+
- **Turbopack**: Para desarrollo rápido
- **ESLint**: Configuración integrada con Next.js

### Estructura de Carpetas Completa
```
src/
├── app/                          # Next.js App Router (Páginas)
│   ├── activities/               # Página de actividades
│   ├── alerts/                   # Página de alertas
│   ├── api/                      # API Routes
│   │   ├── chatbot/              # API de chatbot
│   │   ├── health/               # Health check
│   │   ├── login/                # Autenticación
│   │   └── notif/                # Notificaciones
│   ├── areas/                    # Página de áreas sociales
│   ├── balance/                  # Página de balance financiero
│   ├── binnacle/                 # Página de bitácora
│   ├── budget/                   # Página de presupuestos
│   ├── categories/               # Página de categorías
│   ├── configs/                  # Página de configuraciones
│   ├── contents/                 # Página de contenidos
│   ├── create-reservas/          # Página de crear reservas
│   ├── dashDpto/                 # Dashboard por departamento
│   ├── debts_manager/            # Página de gestión de deudas
│   ├── defaulters/               # Página de morosos
│   ├── documents/                # Página de documentos
│   ├── dptos/                    # Página de departamentos
│   ├── events/                   # Página de eventos
│   ├── expenses/                 # Página de gastos
│   ├── guards/                   # Página de guardias
│   ├── homeowners/               # Página de propietarios
│   ├── notifications/            # Página de notificaciones
│   ├── owners/                   # Página de propietarios
│   ├── payments/                 # Página de pagos
│   ├── profile/                  # Página de perfil
│   ├── reels/                    # Página de reels/contenido
│   ├── reservas/                 # Página de reservas
│   ├── roles/                    # Página de roles
│   ├── surveys/                  # Página de encuestas
│   ├── units/                    # Página de unidades
│   ├── users/                    # Página de usuarios
│   ├── layout.tsx                # Layout raíz de la aplicación
│   ├── page.tsx                  # Página principal/dashboard
│   └── globals.css               # Estilos globales
├── components/                   # Componentes específicos del proyecto
├── contexts/                     # Context providers específicos
├── mk/                           # LIBRERÍA MK - Framework Reutilizable
│   ├── cli/                      # Utilidades de línea de comandos
│   ├── components/               # Componentes reutilizables
│   │   ├── auth/                 # Componentes de autenticación
│   │   ├── calendar/             # Sistema de calendarios
│   │   ├── chat/                 # Sistema de chat
│   │   ├── data/                 # Componentes de datos
│   │   ├── forms/                # Componentes de formularios
│   │   ├── notif/                # Sistema de notificaciones
│   │   └── ui/                   # Componentes de UI básicos
│   ├── contexts/                 # Context providers
│   │   ├── AuthProvider.tsx      # Proveedor de autenticación
│   │   └── AxiosInstanceProvider.tsx # Proveedor de Axios
│   ├── hooks/                    # Custom hooks reutilizables
│   │   ├── useCrud/              # Hook CRUD completo
│   │   │   ├── useCrud.tsx       # Hook principal (1646 líneas)
│   │   │   ├── FormElement.tsx   # Elementos de formulario
│   │   │   └── README.md         # Documentación completa
│   │   ├── useAxios.tsx          # Hook para llamadas HTTP
│   │   ├── useEmojiRenderer.tsx  # Renderizado de emojis
│   │   ├── useEvents.tsx         # Gestión de eventos
│   │   └── [otros hooks...]      # Más hooks reutilizables
│   ├── interceptors/             # Interceptores de Axios
│   ├── types/                    # Definiciones TypeScript
│   └── utils/                    # Utilidades generales
│       ├── adapters.ts           # Adaptadores de datos
│       ├── date.tsx              # Utilidades de fecha
│       ├── images.tsx            # Utilidades de imágenes
│       ├── logs.tsx              # Sistema de logging
│       ├── numbers.tsx           # Utilidades numéricas
│       ├── platform.tsx          # Utilidades de plataforma
│       ├── searchs/              # Utilidades de búsqueda
│       └── traductor.tsx         # Sistema de traducción
├── modulos/                      # Módulos de negocio específicos
│   ├── Activities/               # Gestión de actividades
│   ├── Alerts/                   # Sistema de alertas
│   ├── Areas/                    # Áreas sociales
│   ├── Balance/                  # Control financiero
│   ├── Binnacle/                 # Bitácora/registro
│   ├── Budget/                   # Presupuestos
│   ├── Categories/               # Categorización
│   ├── Config/                   # Configuraciones
│   ├── CreateReserva/            # Crear reservas
│   ├── DebtsManager/             # Gestión de deudas
│   ├── Defaulters/               # Morosos
│   ├── Documents/                # Documentos
│   ├── Dptos/                    # Departamentos
│   ├── Events/                   # Eventos
│   ├── Expenses/                 # Gastos
│   ├── Guards/                   # Guardias
│   ├── HomeOwners/               # Propietarios
│   ├── Notifications/            # Notificaciones
│   ├── Owners/                   # Propietarios
│   ├── Outlays/                  # Egresos
│   ├── Payments/                 # Pagos
│   ├── Profile/                  # Perfil/Usuario
│   ├── Reel/                     # Contenido/Reels
│   ├── Reservas/                 # Reservas
│   ├── Roles/                    # Roles y permisos
│   ├── Surveys/                  # Encuestas
│   └── shared/                   # Componentes compartidos entre módulos
└── styles/                       # Estilos globales
    ├── globals.css               # Estilos globales
    ├── theme.css                 # Tema de colores
    └── utils.css                 # Utilidades CSS
```

---

## 🎯 Arquitectura de Módulos

### Patrón de Diseño Modular
Cada módulo sigue una estructura consistente:

```
Modulo/
├── Modulo.tsx                    # Componente principal
├── Modulo.module.css             # Estilos específicos
├── RenderForm.tsx                # Formulario CRUD
├── RenderView.tsx                # Vista de detalle
├── [Submodulos]/                 # Submódulos específicos
│   ├── Submodulo.tsx
│   ├── RenderForm.tsx
│   └── RenderView.tsx
└── constants/                    # Constantes del módulo
```

### Componentes Compartidos
- **useCrudUtils**: Hook para operaciones CRUD comunes
- **RenderItem**: Componente para listas con acciones contextuales
- **DataModal**: Modal genérico para formularios
- **LoadingScreen**: Pantalla de carga
- **StatusBadge**: Badges para estados

---

## 📱 Funcionalidades por Módulo

### 1. Activities (Actividades)
**Ubicación**: `src/modulos/Activities/`
**Funcionalidad**: Gestión completa de accesos, invitaciones y pedidos

#### Submódulos:
- **AccessTab**: Control de accesos con filtros por período
  - Filtros: fecha, tipo de acceso, guardia
  - Exportación de reportes
  - Vista detallada de cada acceso

- **PedidosTab**: Gestión de pedidos (taxi, delivery, etc.)
  - Creación y seguimiento de pedidos
  - Integración con proveedores externos
  - Estados: pendiente, en proceso, completado

- **QrTab**: Sistema de invitaciones QR
  - Invitaciones individuales y grupales
  - Generación automática de códigos QR
  - Control de validez temporal

**Características Técnicas**:
- Integración con sistema de guardias
- Filtros avanzados por fecha y tipo
- Exportación de datos
- Notificaciones en tiempo real

### 2. Alerts (Alertas)
**Ubicación**: `src/modulos/Alerts/`
**Funcionalidad**: Sistema de alertas de seguridad

#### Niveles de Prioridad:
- **Emergencia (4)**: Amenazas críticas
- **Alto (3)**: Problemas serios
- **Medio (2)**: Situaciones importantes
- **Bajo (1)**: Información general

**Características**:
- Notificaciones push vía Pusher
- Atención y seguimiento de alertas
- Historial completo
- Integración con guardias

### 3. Areas (Áreas Sociales)
**Ubicación**: `src/modulos/Areas/`
**Funcionalidad**: Gestión de áreas comunes del condominio

**Características**:
- Configuración de reservas por día/hora
- Precios y penalizaciones configurables
- Control de capacidades
- Encuestas post-uso
- Mantenimiento programado

### 4. Balance (Flujo de Efectivo)
**Ubicación**: `src/modulos/Balance/`
**Funcionalidad**: Control financiero completo

**Componentes**:
- **TableIngresos**: Tabla de ingresos
- **TableEgresos**: Tabla de egresos
- **TableResumenGeneral**: Resumen financiero
- **TableFinance**: Tabla financiera detallada

**Características**:
- Gráficos interactivos (ApexCharts)
- Filtros por período y categorías
- Exportación de reportes Excel
- Cálculos automáticos de totales

### 5. Binnacle (Bitácora)
**Ubicación**: `src/modulos/Binnacle/`
**Funcionalidad**: Registro de actividades del los guardias

**Características**:
- Log de todas las operaciones
- Filtros por usuario, fecha


### 6. Budget (Presupuestos)
**Ubicación**: `src/modulos/Budget/`
**Funcionalidad**: Sistema de presupuestos y aprobaciones

#### Submódulos:
- **Budget**: Presupuestos principales
- **BudgetDir**: Presupuestos directos
- **ApprovalModal**: Modal de aprobaciones

**Características**:
- Flujo de aprobación jerárquico
- Categorización de gastos
- Seguimiento de ejecución
- Alertas de desviaciones

### 7. Categories (Categorías)
**Ubicación**: `src/modulos/Categories/`
**Funcionalidad**: Sistema de categorización

**Características**:
- Categorías jerárquicas
- Tipos de categorías
- Gestión visual con tarjetas
- Integración con otros módulos

### 8. Config (Configuraciones)
**Ubicación**: `src/modulos/Config/`
**Funcionalidad**: Configuraciones del sistema

#### Submódulos:
- **DefaulterConfig**: Configuración de morosos
- **DptoConfig**: Configuración de departamentos
- **PaymentsConfig**: Configuración de pagos

### 9. DebtsManager (Gestión de Deudas)
**Ubicación**: `src/modulos/DebtsManager/`
**Funcionalidad**: Gestión completa de deudas

#### Tipos de Deudas:
- **AllDebts**: Todas las deudas
- **IndividualDebts**: Deudas individuales
- **SharedDebts**: Deudas compartidas
- **Forgiveness**: Sistema de condonación

**Características**:
- Seguimiento detallado
- Recordatorios automáticos
- Reportes de morosidad
- Condonación selectiva

### 10. Defaulters (Morosos)
**Ubicación**: `src/modulos/Defaulters/`
**Funcionalidad**: Gestión de usuarios morosos

**Características**:
- Listado de morosos
- Historial de pagos
- Acciones de cobranza
- Reportes específicos

### 11. Documents (Documentos)
**Ubicación**: `src/modulos/Documents/`
**Funcionalidad**: Sistema documental

**Características**:
- Almacenamiento de documentos
- Categorización
- Búsqueda avanzada
- Control de versiones

### 12. Dptos (Departamentos)
**Ubicación**: `src/modulos/Dptos/`
**Funcionalidad**: Gestión de departamentos

**Características**:
- Información detallada de cada departamento
- Asignación de propietarios
- Configuración de cuotas
- Historial de residentes

### 13. Events (Eventos)
**Ubicación**: `src/modulos/Events/`
**Funcionalidad**: Sistema de eventos

#### Submódulos:
- **Events**: Eventos generales
- **EventsAdmin**: Administración de eventos

**Características**:
- Creación y gestión de eventos
- Invitaciones
- Control de asistencia
- Integración con calendario

### 14. Expenses (Gastos)
**Ubicación**: `src/modulos/Expenses/`
**Funcionalidad**: Gestión de gastos

#### Submódulos:
- **ExpensesDetails**: Detalles de gastos
- **RenderForm**: Formulario de gastos

**Características**:
- Categorización de gastos
- Aprobación de gastos
- Reportes detallados
- Integración con presupuestos

### 15. Guards (Guardias)
**Ubicación**: `src/modulos/Guards/`
**Funcionalidad**: Gestión del personal de seguridad

**Características**:
- Perfiles de guardias
- Turnos y horarios
- Reportes de actividad
- Control de accesos

### 16. HomeOwners (Propietarios)
**Ubicación**: `src/modulos/HomeOwners/`
**Funcionalidad**: Gestión de propietarios de vivienda

**Características**:
- Información personal
- Departamentos asociados
- Historial de pagos
- Comunicaciones

### 17. Notifications (Notificaciones)
**Ubicación**: `src/modulos/Notifications/`
**Funcionalidad**: Sistema de notificaciones

**Características**:
- Notificaciones push
- Centro de notificaciones
- Configuración por usuario
- Historial completo

### 18. Owners (Propietarios)
**Ubicación**: `src/modulos/Owners/`
**Funcionalidad**: Gestión general de propietarios

**Características**:
- CRUD completo
- Perfiles detallados
- Gestión de permisos
- Integración con departamentos

### 19. Payments (Pagos)
**Ubicación**: `src/modulos/Payments/`
**Funcionalidad**: Sistema de pagos

**Características**:
- Registro de pagos
- Métodos de pago
- Recibos automáticos
- Conciliación bancaria

### 20. Profile (Perfil)
**Ubicación**: `src/modulos/Profile/`
**Funcionalidad**: Gestión de perfil de usuario

#### Componentes:
- **Authentication**: Sistema de login
- **Profile**: Perfil de usuario

**Características**:
- Autenticación JWT
- Gestión de sesiones
- Cambio de contraseña
- Configuración personal

### 21. Reel (Contenido)
**Ubicación**: `src/modulos/Reel/`
**Funcionalidad**: Sistema de contenido multimedia

#### Submódulos:
- **ReelCompactList**: Lista compacta
- **ImageMosaic**: Mosaico de imágenes
- **MediaRenderer**: Renderizado de medios
- **CommentModal**: Sistema de comentarios

**Características**:
- Publicación de contenido
- Comentarios y likes
- Galerías de imágenes
- Integración con Cloudinary

### 22. Reservas (Reservas)
**Ubicación**: `src/modulos/Reservas/`
**Funcionalidad**: Sistema de reservas

#### Submódulos:
- **Reserva**: Reservas principales
- **ReservaPending**: Reservas pendientes
- **ReservaModal**: Modal de reservas
- **CalendarPicker**: Selector de calendario

**Características**:
- Reserva de áreas sociales
- Calendario interactivo
- Aprobación automática/manual
- Control de conflictos

### 23. Roles (Roles y Permisos)
**Ubicación**: `src/modulos/Roles/`
**Funcionalidad**: Sistema de roles y permisos

#### Submódulos:
- **Roles**: Definición de roles
- **Permisos**: Gestión de permisos
- **RolesAbilities**: Capacidades por rol
- **RolesCategories**: Categorías de roles

**Características**:
- Control granular de permisos
- Roles jerárquicos
- Asignación por usuario
- Auditoría de cambios

### 24. Surveys (Encuestas)
**Ubicación**: `src/modulos/Surveys/`
**Funcionalidad**: Sistema de encuestas

#### Submódulos:
- **SurveyList**: Lista de encuestas
- **SurveyScaleChoice**: Escalas de respuesta

**Características**:
- Creación de encuestas
- Múltiples tipos de preguntas
- Análisis de resultados
- Reportes automáticos

---

## 🔧 Componentes Técnicos Core

### 📚 LIBRERÍA MK - Framework Reutilizable

La **Librería MK** es el corazón técnico del proyecto Condaty Admin. Es una librería completa y reutilizable diseñada para ser usada en múltiples proyectos, con el objetivo futuro de convertirse en un paquete NPM.

#### Arquitectura de la Librería MK
**Ubicación**: `src/mk/`
**Propósito**: Framework completo para desarrollo de aplicaciones CRUD con funcionalidades avanzadas

**Características Principales**:
- **Reutilizable**: Diseñada para ser usada en cualquier proyecto
- **Configurable**: Altamente personalizable mediante configuración
- **Generalista**: No específica de condominios, adaptable a cualquier dominio
- **Completa**: Incluye todo lo necesario para desarrollo full-stack frontend

#### Hook useCrud - Núcleo de la Librería
**Ubicación**: `src/mk/hooks/useCrud/useCrud.tsx` (1646 líneas)
**Funcionalidad**: Hook completo para operaciones CRUD con todas las funcionalidades

**Características del useCrud**:
```typescript
interface UseCrudType {
  // CRUD Operations
  onAdd: () => void;
  onEdit: (item: Record<string, any>) => void;
  onDel: (item: Record<string, any>) => void;
  onView: (item: Record<string, any>) => void;
  onSave: (data: Record<string, any>, setErrors?: Function) => Promise<void>;

  // Data Management
  data: any;
  loaded: boolean;
  reLoad: (params?: Record<string, any>, noWaiting?: boolean, force?: boolean) => void;

  // UI State
  open: boolean; setOpen: Function;
  openView: boolean; setOpenView: Function;
  openDel: boolean; setOpenDel: Function;

  // Search & Filter
  onSearch: (searchTerm: string) => void;
  onFilter: (filterKey: string, filterValue: string) => void;

  // Pagination
  onChangePage: (page: number) => void;
  onChangePerPage: (perPage: number) => void;

  // Import/Export
  onImport: () => void;
  onExport: (type?: 'pdf' | 'xls' | 'csv', callback?: Function) => void;

  // Components
  List: React.FC<any>; // Componente principal de lista

  // Extra Data
  extraData: Record<string, any>;
  getExtraData: () => Promise<void>;
}
```

**Funcionalidades del useCrud**:
- ✅ **Operaciones CRUD completas** con validación automática
- ✅ **Sistema de formularios dinámicos** basado en configuración
- ✅ **Paginación automática** con controles personalizables
- ✅ **Búsqueda y filtros avanzados** con múltiples criterios
- ✅ **Importación/Exportación** de datos (Excel, PDF)
- ✅ **Sistema de permisos** integrado con roles
- ✅ **Manejo de estados** completo (loading, errores, etc.)
- ✅ **Componente List automático** con tabla responsive
- ✅ **Modales integrados** para crear, editar, ver y eliminar
- ✅ **Validación de formularios** con reglas personalizables
- ✅ **Manejo de datos extra** para selects dependientes

#### Configuración del useCrud
```typescript
const modConfig: ModCrudType = {
  modulo: 'users',           // Endpoint API
  singular: 'Usuario',       // Nombre singular
  plural: 'Usuarios',        // Nombre plural
  permiso: 'USER',           // Código de permiso

  // Opcionales
  export: true,              // Habilitar exportación
  import: true,              // Habilitar importación
  filter: true,              // Habilitar filtros
  search: true,              // Habilitar búsqueda
  pagination: true,          // Habilitar paginación
  listAndCard: true,         // Vista lista/tarjetas

  // Personalización
  titleAdd: 'Crear Usuario',
  titleEdit: 'Editar Usuario',
  titleDel: 'Eliminar Usuario',

  // Mensajes personalizados
  saveMsg: {
    add: 'Usuario creado exitosamente',
    edit: 'Usuario actualizado exitosamente',
    del: 'Usuario eliminado exitosamente'
  },

  // Control de acciones
  hideActions: {
    add: false,
    edit: false,
    del: false,
    view: false
  }
};
```

#### Campos de Configuración (FieldConfig)
```typescript
const fields: Record<string, FieldConfig> = {
  name: {
    label: 'Nombre',
    form: {
      type: 'text',
      rules: { required: true, minLength: 3 },
      order: 1
    },
    list: {
      order: 1,
      width: '200px'
    },
    view: {
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
      optionsExtra: 'categories', // Carga desde extraData
      optionLabel: 'name',
      optionValue: 'id'
    }
  }
};
```

#### Componentes de la Librería MK

##### Sistema de Formularios
- **Button**: Botones con variantes y estados
- **Input**: Campos de texto con validación
- **Select**: Selects con búsqueda y opciones dinámicas
- **Check**: Checkboxes y radio buttons
- **TextArea**: Áreas de texto
- **InputImage**: Upload de imágenes
- **InputPassword**: Campos de contraseña
- **DataSearch**: Búsqueda con debounce

##### Componentes UI
- **DataModal**: Modales genéricos para formularios
- **Table**: Tablas con ordenamiento y paginación
- **Pagination**: Paginación automática
- **LoadingScreen**: Pantallas de carga
- **Avatar**: Avatares con imágenes
- **Card**: Tarjetas para contenido
- **Badge**: Badges para estados
- **Toast**: Notificaciones toast

##### Sistema de Autenticación
**Ubicación**: `src/mk/contexts/AuthProvider.tsx`
**Características**:
- JWT Token management automático
- Refresh token automático
- Context API para estado global
- Sistema de permisos basado en roles
- Protección de rutas automática

##### Hook useAxios
**Ubicación**: `src/mk/hooks/useAxios.tsx`
**Características**:
- Wrapper completo para Axios
- Manejo automático de loading states
- Cancelación automática de requests
- Error handling centralizado
- Interceptors para JWT automático

##### Utilidades de la Librería
- **date.tsx**: Utilidades completas de fechas
- **numbers.tsx**: Formateo de números y monedas
- **string.tsx**: Manipulación de strings
- **images.tsx**: Procesamiento de imágenes
- **logs.tsx**: Sistema de logging
- **adapters.ts**: Adaptadores de datos
- **searchs/**: Utilidades de búsqueda avanzada

#### useCrudUtils - Extensión para Móviles
**Ubicación**: `src/modulos/shared/useCrudUtils.tsx`
**Funcionalidad**: Utilidades adicionales para interfaces móviles/táctiles

**Características**:
- Long-press para acciones contextuales
- Estados de búsqueda móvil
- Navegación por gestos
- Modo de edición múltiple

### RenderItem Component
**Ubicación**: `src/modulos/shared/RenderItem.tsx`
**Funcionalidad**: Renderizado de elementos de lista con acciones contextuales

**Características**:
- Soporte para long-press
- Acciones contextuales
- Estados de carga
- Animaciones suaves

---

## 🎨 Sistema de Estilos y UI

### Variables CSS Globales
**Ubicación**: `src/styles/variables.css`
```css
:root {
  --primary-color: #00e38c;
  --secondary-color: #1a1a1a;
  --background-color: #0a0a0a;
  --text-color: #ffffff;
  --border-color: #333333;
  --font-family: 'Inter', sans-serif;
  --border-radius: 8px;
  --spacing-unit: 8px;
}
```

### Tema Oscuro
- **Color primario**: Verde (#00e38c)
- **Fondo**: Negro (#0a0a0a)
- **Texto**: Blanco (#ffffff)
- **Fondos secundarios**: Gris oscuro (#1a1a1a)

### Componentes UI Reutilizables
- **DataModal**: Modal genérico con formulario
- **Avatar**: Componente de avatar con imagen
- **StatusBadge**: Badges para estados (activo, inactivo, pendiente)
- **LoadingScreen**: Pantalla de carga con spinner
- **Button**: Botones con variantes (primary, secondary, danger)

### Responsive Design
- **Breakpoints**: Mobile (320px), Tablet (768px), Desktop (1024px)
- **Grid System**: CSS Grid y Flexbox
- **Mobile First**: Diseño adaptativo

---

## 🔗 Integraciones y APIs

### API Principal
**URL**: `https://phplaravel-1214481-5270819.cloudwaysapps.com/api`
**Framework Backend**: Laravel
**Autenticación**: JWT Bearer Token

### Servicios Externos

#### Pusher (Notificaciones en Tiempo Real)
```javascript
const pusher = new Pusher('your-app-key', {
  cluster: 'us2',
  encrypted: true
});
```
- **Uso**: Alertas, notificaciones, chat en tiempo real
- **Canales**: `alerts`, `notifications`, `chat`

#### InstantDB (Base de Datos en Tiempo Real)
```javascript
import { init, tx } from '@instantdb/react';
const db = init({ appId: 'your-app-id' });
```
- **Uso**: Chat, notificaciones persistentes
- **Características**: Sincronización automática, offline support

#### Cloudinary (Almacenamiento de Imágenes)
- **Uso**: Avatares, imágenes de perfil, contenido multimedia
- **Características**: Optimización automática, transformaciones

### Axios Configuration
**Ubicación**: `src/mk/utils/axiosConfig.ts`
```typescript
const api = axios.create({
  baseURL: 'https://phplaravel-1214481-5270819.cloudwaysapps.com/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptors para JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

---

## 👥 Sistema de Usuarios y Roles

### Roles del Sistema
1. **Administrador**: Acceso completo a todos los módulos
2. **Guardia**: Acceso limitado a actividades, alertas, accesos
3. **Residente**: Acceso limitado a reservas, pagos, perfil

### Permisos CRUD
- **Create**: Crear nuevos registros
- **Read**: Ver información
- **Update**: Modificar registros existentes
- **Delete**: Eliminar registros

### Gestión de Sesiones
- **JWT Tokens**: Autenticación stateless
- **Refresh Tokens**: Renovación automática
- **Logout**: Invalidación de tokens
- **Session Timeout**: 24 horas

---

## 📊 Dashboard y Analytics

### Dashboard Principal
**Ubicación**: `src/app/(dashboard)/page.tsx`
**Características**:
- Resumen financiero mensual
- Alertas pendientes
- Solicitudes de reservas activas
- Pre-registros de usuarios
- Gráficos de ingresos/egresos

### Reportes y Exportación
- **Formatos**: Excel (xlsx), PDF (html2canvas)
- **Filtros**: Por fecha, categoría, usuario
- **Gráficos**: ApexCharts para visualización
- **Exportación**: Automática con un clic

---

## 🔄 Flujos de Trabajo

### Flujo de Reservas
1. Usuario solicita reserva
2. Sistema verifica disponibilidad
3. Aprobación automática/manual según reglas
4. Generación de QR si aprobado
5. Notificación al usuario y guardias

### Flujo de Alertas
1. Usuario/Guardia crea alerta
2. Notificación push a todos los usuarios relevantes
3. Atención de la alerta
4. Seguimiento y cierre
5. Registro en bitácora de guardias

### Flujo de Pagos
1. Registro de pago pendiente
2. Notificación al residente
3. Procesamiento del pago
4. Confirmación y recibo
5. Actualización de balance

---

## 🐛 Manejo de Errores y Logging

### Error Handling
- **Global Error Boundary**: Captura errores no manejados
- **API Error Handling**: Manejo centralizado de errores HTTP
- **User Feedback**: Mensajes de error amigables
- **Retry Logic**: Reintentos automáticos para requests fallidos

### Logging
- **Console Logging**: Desarrollo
- **Bitácora**: Registro de actividades importantes de guardias
- **Error Reporting**: Reportes de errores críticos

---

## 🚀 Despliegue y DevOps

### Scripts de Package.json
```json
{
  "scripts": {
    "dev": "next dev --turbo",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "export": "next export"
  }
}
```

### Variables de Entorno
- **API_URL**: URL del backend
- **PUSHER_KEY**: Clave de Pusher
- **CLOUDINARY_URL**: URL de Cloudinary
- **JWT_SECRET**: Secreto para JWT

### Build Process
- **Next.js Build**: Optimización automática
- **Static Export**: Para despliegue estático
- **Image Optimization**: Next.js Image component
- **Code Splitting**: Automático por rutas

---

## 🔍 Consideraciones de Rendimiento

### Optimizaciones Implementadas
- **Lazy Loading**: Componentes cargados bajo demanda
- **Image Optimization**: Next.js Image component
- **Code Splitting**: Por rutas y módulos
- **Caching**: HTTP caching headers
- **Bundle Analysis**: Análisis de tamaño de bundles

### Métricas de Rendimiento
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **First Input Delay**: < 100ms
- **Cumulative Layout Shift**: < 0.1

---

## 🧪 Testing y Calidad

### Estrategia de Testing
- **Unit Tests**: Componentes individuales
- **Integration Tests**: Flujos completos
- **E2E Tests**: Playwright (planeado)
- **TypeScript**: Type checking estricto

### Code Quality
- **ESLint**: Reglas estrictas
- **Prettier**: Formateo automático
- **Husky**: Pre-commit hooks
- **Commitlint**: Conventional commits

---

## 📚 Documentación y Mantenimiento

### Documentación Técnica
- **README.md**: Guía de instalación y uso
- **API Docs**: Documentación de endpoints
- **Component Docs**: Storybook (planeado)
- **Architecture Docs**: Diagramas y decisiones

### Mantenimiento
- **Dependency Updates**: Actualizaciones regulares
- **Security Audits**: Revisiones de seguridad
- **Performance Monitoring**: Métricas continuas
- **User Feedback**: Iteración basada en usuarios

---

## 🎯 Conclusión

**Condáty Admin** es una plataforma integral de administración condominial construida sobre la **Librería MK**, un framework completo y reutilizable diseñado para desarrollo de aplicaciones CRUD.

### Arquitectura Principal

#### 1. Librería MK - Framework Core
La **Librería MK** es el corazón del sistema, proporcionando:
- **Hook useCrud**: Framework completo para operaciones CRUD (1646 líneas de código)
- **Sistema de formularios dinámicos** basado en configuración JSON
- **Componentes reutilizables** para UI/UX consistente
- **Utilidades completas** para manejo de datos, fechas, imágenes, etc.
- **Sistema de autenticación** con JWT y permisos
- **Integraciones** con APIs externas (Pusher, InstantDB, Cloudinary)

**Características de la Librería MK**:
- ✅ **Reutilizable**: Diseñada para múltiples proyectos
- ✅ **Configurable**: Altamente personalizable sin modificar código core
- ✅ **Completa**: Incluye todo lo necesario para desarrollo full-stack
- ✅ **Generalista**: No específica de condominios, adaptable a cualquier dominio
- ✅ **Extensible**: Fácil agregar nuevas funcionalidades

#### 2. Módulos de Negocio
24 módulos específicos que implementan la lógica de administración condominial:
- **Activities**: Gestión de accesos, invitaciones QR, pedidos
- **Alerts**: Sistema de alertas de seguridad con 4 niveles
- **Areas**: Gestión de áreas sociales con reservas
- **Balance**: Control financiero con gráficos interactivos
- **Budget**: Sistema de presupuestos y aprobaciones
- **DebtsManager**: Gestión completa de deudas
- **Reservas**: Sistema de reservas con calendario
- **Roles**: Control granular de permisos
- Y 16 módulos adicionales

### Tecnologías Clave
- **Frontend**: Next.js 15.2.4, React 19.1.0, TypeScript
- **Backend**: Laravel API (PHP)
- **Real-time**: Pusher, InstantDB
- **Storage**: Cloudinary para imágenes
- **Charts**: ApexCharts para visualización
- **Styling**: CSS Variables, Tema Oscuro
- **Build**: Turbopack para desarrollo rápido

### Patrón de Desarrollo
Cada módulo sigue el patrón consistente:
```typescript
// 1. Configuración del módulo
const mod: ModCrudType = {
  modulo: 'users',
  singular: 'Usuario',
  plural: 'Usuarios',
  permiso: 'USER'
};

// 2. Definición de campos
const fields: Record<string, FieldConfig> = { /* ... */ };

// 3. Uso del hook useCrud
const { List, onAdd, onEdit, onDel } = useCrud({
  paramsInitial: { page: 1, perPage: 10 },
  mod,
  fields
});

// 4. Renderizado automático
return <List />;
```

### Funcionalidades Implementadas

#### Gestión de Accesos
- Control completo de visitantes y residentes
- Sistema de invitaciones QR
- Registro de entradas/salidas
- Integración con guardias

#### Administración Financiera
- Seguimiento detallado del flujo de efectivo
- Gráficos interactivos con ApexCharts
- Exportación de reportes Excel/PDF
- Categorización automática de gastos

#### Sistema de Alertas
- 4 niveles de prioridad (Emergencia, Alto, Medio, Bajo)
- Notificaciones en tiempo real vía Pusher
- Atención y seguimiento de alertas
- Integración con bitácora

#### Gestión de Áreas Sociales
- Reserva de espacios comunes
- Configuración flexible de horarios y precios
- Control de capacidades
- Encuestas post-uso

#### Sistema de Usuarios y Roles
- Autenticación JWT completa
- Control granular de permisos (C/R/U/D)
- Roles jerárquicos
- Gestión de sesiones automática

### Integraciones Externas
- **API Backend**: Laravel con endpoints RESTful
- **Pusher**: Notificaciones en tiempo real
- **InstantDB**: Base de datos para chat y notificaciones
- **Cloudinary**: Almacenamiento y optimización de imágenes

### Futuro de la Librería MK
La Librería MK está diseñada para evolucionar hacia un **paquete NPM reutilizable** que permita:
- Desarrollo rápido de aplicaciones CRUD
- Consistencia en UI/UX across proyectos
- Reutilización de componentes probados
- Actualizaciones centralizadas
- Comunidad de desarrolladores

### Beneficios del Approach
1. **Rapidez de Desarrollo**: Nuevo módulo en minutos con configuración
2. **Consistencia**: UI/UX uniforme en toda la aplicación
3. **Mantenibilidad**: Código centralizado y bien documentado
4. **Escalabilidad**: Fácil agregar nuevos módulos y funcionalidades
5. **Reutilización**: Framework usable en otros proyectos

Esta documentación proporciona el contexto completo necesario para que cualquier desarrollador pueda entender, mantener y extender el sistema Condáty Admin, aprovechando al máximo la potencia de la Librería MK.