# 🏢 CONDATY ADMIN - ANÁLISIS COMPLETO DEL SISTEMA

## 📋 RESUMEN EJECUTIVO

**Condaty Admin** es un sistema administrativo integral construido con Next.js 15 y React 19, diseñado para la gestión de condominios y propiedades horizontales. El sistema utiliza una arquitectura modular con microkernel (mk) que proporciona componentes reutilizables, hooks personalizados y utilidades comunes.

### 🎯 Propósito Principal
- Gestión financiera completa de condominios (ingresos, egresos, expensas, morosos)
- Administración de unidades, áreas sociales y accesos
- Sistema de reservas y comunicación entre residentes
- Vigilancia y seguridad con alertas en tiempo real
- Gestión de usuarios, roles y permisos

### 🏗️ Arquitectura Tecnológica
- **Frontend**: Next.js 15 (App Router) + React 19 + TypeScript
- **Estilos**: CSS Modules + Theme CSS personalizado
- **HTTP**: Axios con interceptores personalizados
- **Estado**: Context API + Hooks personalizados
- **Base de Datos**: InstantDB para tiempo real (chat/notificaciones)
- **Autenticación**: Sistema propio con IAM

---

## 📁 ESTRUCTURA DEL PROYECTO

```
src/
├── app/                    # Rutas de Next.js (App Router)
├── components/             # Componentes React compartidos
├── modulos/               # Módulos funcionales del sistema
├── mk/                     # Microkernel - Sistema base reutilizable
├── contexts/               # Contextos de React
├── styles/                 # Estilos globales y temas
├── types/                  # Definiciones TypeScript
└── config/                 # Configuraciones
```

### 📂 app/ - Sistema de Rutas
Cada carpeta representa una ruta del sistema:
- **Finanzas**: balance, payments, outlays, expenses, defaulters, debts_manager, bank-accounts
- **Administración**: units, areas, activities, documents, configs
- **Usuarios**: owners, users, roles
- **Comunicación**: contents, reels
- **Reservas**: reservas, create-reservas
- **Seguridad**: guards, alerts, binnacle

### 📂 components/ - Componentes Compartidos
- **auth/**: Componentes de autenticación (Login, ForgotPass)
- **layout/**: Layout principal y componentes de navegación
- **MainMenu/**: Menú principal con configuración modular
- **Header/**: Cabecera con notificaciones y perfil
- **Modales**: CommentsModal, ImageModal, ProfileModal, etc.
- **Widgets**: Componentes de dashboard (gráficos, estadísticas)

---

## 🔧 SISTEMA MICROKERNEL (mk/)

El microkernel proporciona una capa de abstracción reutilizable:

### Contextos Base
- **AuthProvider**: Gestión de autenticación y permisos
- **AxiosInstanceProvider**: Configuración centralizada de Axios
- **ImageModalProvider**: Sistema global de modales de imágenes

### Hooks Esenciales
- **useAxios**: Gestión de peticiones HTTP con loading automático
- **useCrud**: Operaciones CRUD estandarizadas
- **useAuth**: Acceso al contexto de autenticación
- **useToast**: Sistema de notificaciones
- **useEvents**: Sistema de eventos globales

### Componentes UI Base
- **Button**: Botón con variantes y estados de carga
- **Toast**: Notificaciones flotantes
- **DataModal**: Modal genérico para formularios
- **Sidebar**: Menú lateral responsive
- **Forms**: Componentes de formulario reutilizables

---

## 💰 MÓDULOS FINANCIEROS

### 💳 Payments (Ingresos)
**Archivo**: `src/modulos/Payments/Payments.tsx`
- **Propósito**: Gestión de pagos y cobros de residentes
- **Estados**: Por Pagar (A), Pagado (P), Por confirmar (S), Moroso (M), Rechazado (R), Anulado (X)
- **Funcionalidades**:
  - CRUD completo de pagos
  - Filtros por fecha, unidad, método de pago
  - Exportación de datos
  - Gestión de comprobantes
- **Integraciones**: Categorías, unidades, métodos de pago
- **Componentes**: RenderForm, RenderView, RenderDel

### 💸 Outlays (Egresos)
**Archivo**: `src/modulos/Outlays/Outlays.tsx`
- **Propósito**: Control de gastos y egresos del condominio
- **Funcionalidades**:
  - Registro de facturas y comprobantes
  - Aprobación de egresos
  - Categorización de gastos
  - Seguimiento de presupuestos

### 📊 Balance (Flujo de Efectivo)
**Archivo**: `src/modulos/Balance/Balance.tsx`
- **Propósito**: Visualización del flujo financiero
- **Componentes**:
  - TableIngresos: Ingresos por período
  - TableEgresos: Egresos detallados
  - TableResumenGeneral: Resumen financiero
- **Filtros**: Por mes/año, comparativas

### 🏠 Expenses (Expensas)
**Archivo**: `src/modulos/Expenses/Expenses.tsx`
- **Propósito**: Cálculo y gestión de expensas mensuales
- **Funcionalidades**:
  - Generación automática de expensas
  - Distribución por unidad
  - Estados de pago
  - Notificaciones a morosos

### ⚠️ Defaulters (Morosos)
**Archivo**: `src/modulos/Defaulters/Defaulters.tsx`
- **Propósito**: Gestión de residentes con pagos pendientes
- **Funcionalidades**:
  - Listado de deudores
  - Cálculo de intereses
  - Envío de notificaciones
  - Reportes de morosidad

### 💳 DebtsManager (Administrador de Deudas)
**Archivo**: `src/modulos/DebtsManager/DebtsManager.tsx`
- **Propósito**: Control detallado de deudas individuales
- **Funcionalidades**:
  - Consolidación de deudas
  - Planes de pago
  - Historial de pagos
  - Gestión de convenios

---

## 🏢 MÓDULOS DE ADMINISTRACIÓN

### 🏠 Units (Unidades)
**Archivo**: `src/modulos/Units/Units.tsx`
- **Propósito**: Gestión de departamentos/unidades del condominio
- **Funcionalidades**:
  - CRUD de unidades
  - Asignación de propietarios
  - Control de estado (ocupado, disponible)
  - Historial de propietarios

### 🌳 Areas (Áreas Sociales)
**Archivo**: `src/modulos/Areas/Areas.tsx`
- **Propósito**: Administración de áreas comunes
- **Funcionalidades**:
  - Registro de áreas (piscina, gimnasio, salones)
  - Configuración de horarios
  - Tarifas y reglas de uso
  - Mantenimiento programado

### 📄 Documents (Documentos)
**Archivo**: `src/modulos/Documents/Documents.tsx`
- **Propósito**: Gestión documental del condominio
- **Funcionalidades**:
  - Almacenamiento de documentos
  - Versionado de archivos
  - Permisos de acceso
  - Categorización documental

### ⚙️ Configs (Configuración)
**Archivo**: `src/modulos/Config/Config.tsx`
- **Propósito**: Configuración general del sistema
- **Submódulos**:
  - DefaulterConfig: Configuración de morosos
  - DptoConfig: Configuración de departamentos
  - PaymentsConfig: Configuración de pagos

---

## 👥 MÓDULOS DE USUARIOS

### 👤 Owners (Propietarios/Residentes)
**Archivo**: `src/modulos/Owners/Owners.tsx`
- **Propósito**: Gestión de residentes y propietarios
- **Funcionalidades**:
  - Perfil completo de residentes
  - Vinculación con unidades
  - Historial de pagos
  - Comunicación directa

### 👔 Users (Personal Administrativo)
**Archivo**: `src/modulos/Users/Users.tsx`
- **Propósito**: Gestión del staff administrativo
- **Funcionalidades**:
  - Perfiles de empleados
  - Asignación de roles
  - Control de acceso
  - Auditoría de acciones

### 🔐 Roles (Roles y Permisos)
**Archivo**: `src/modulos/Roles/Roles.tsx`
- **Propósito**: Sistema de permisos basado en roles
- **Integraciones**: RolesAbilities, RolesCategories
- **Funcionalidades**:
  - Creación de roles personalizados
  - Asignación granular de permisos
  - Jerarquía de roles

---

## 📅 MÓDULOS DE RESERVAS

### 📆 Reservas
**Archivo**: `src/modulos/Reservas/Reserva.tsx`
- **Propósito**: Sistema de reservas de áreas comunes
- **Funcionalidades**:
  - Calendario de disponibilidad
  - Reservas por franja horaria
  - Aprobación de reservas
  - Cancelaciones y reprogramaciones

### 🏊 CreateReserva (Crear Reservas)
**Archivo**: `src/modulos/CreateReserva/CreateReserva.tsx`
- **Propósito**: Interfaz de creación de reservas
- **Funcionalidades**:
  - Selector de área y fecha
  - Validación de conflictos
  - Pago de tarifas
  - Confirmación instantánea

---

## 📢 MÓDULOS DE COMUNICACIÓN

### 📰 Contents (Contenidos/Publicaciones)
**Archivo**: `src/modulos/Contents/Contents.tsx`
- **Propósito**: Gestión de publicaciones y avisos
- **Funcionalidades**:
  - Creación de publicaciones
  - Programación de contenidos
  - Segmentación de audiencia
  - Análisis de engagement

### 🎞️ Reels (Muro de Publicaciones)
**Archivo**: `src/modulos/Reel/Reel.tsx`
- **Propósito**: Muro de publicaciones tipo redes sociales
- **Funcionalidades**:
  - Feed de publicaciones
  - Sistema de likes y comentarios
  - Compartir contenido
  - Notificaciones de interacción

---

## 🔐 MÓDULOS DE SEGURIDAD

### 👮 Guards (Guardias)
**Archivo**: `src/modulos/Guards/Guards.tsx`
- **Propósito**: Gestión del personal de seguridad
- **Funcionalidades**:
  - Registro de guardias
  - Asignación de turnos
  - Control de acceso
  - Supervisión de actividades

### 🚨 Alerts (Alertas)
**Archivo**: `src/modulos/Alerts/Alerts.tsx`
- **Propósito**: Sistema de alertas de emergencia
- **Tipos de Alertas**:
  - E: Emergencia Médica 🏥
  - F: Incendio 🔥
  - T: Robo 🦹
  - O: Otro ⚠️
- **Funcionalidades**:
  - Creación de alertas
  - Notificación en tiempo real
  - Sistema de respuesta
  - Historial de alertas

### 📋 Binnacle (Bitácora)
**Archivo**: `src/modulos/Binnacle/Binnacle.tsx`
- **Propósito**: Registro de actividades de seguridad
- **Funcionalidades**:
  - Registro de incidencias
  - Control de turnos
  - Reportes diarios
  - Auditoría de accesos

---

## 🎨 SISTEMA DE ESTILOS

### 🎯 Variables CSS (theme.css)
```css
/* Colores principales */
--cPrimary: #00e38c;      /* Verde principal */
--cSecondary: #212121;    /* Negro */
--cSuccess: #34a853;      /* Verde éxito */
--cError: #e46055;        /* Rojo error */
--cWarning: #fbbc05;      /* Amarillo advertencia */
--cInfo: #4285fa;         /* Azul información */

/* Layout */
--cSidebar: #246950;      /* Verde sidebar */
--cBigSidebar: #246950;   /* Sidebar expandido */
```

### 📱 Sistema Responsive
- **Desktop-first**: Diseño optimizado para escritorio
- **Mobile-adaptive**: Adaptación para tablets y móviles
- **Componentes responsive**: Todos los componentes se adaptan

---

## 🔌 INTEGRACIONES Y SERVICIOS

### 💬 InstantDB (Tiempo Real)
- **Chat**: Sistema de mensajería entre usuarios
- **Notificaciones**: Push notifications en tiempo real
- **Presencia**: Estado online/offline de usuarios
- **Archivos**: `ChatInstantDb.tsx`, `ActiveNotificationDB.tsx`

### 📊 APIs Externas
- **React ApexCharts**: Gráficos y visualizaciones
- **React Player**: Reproductor de video
- **Date-fns**: Manipulación de fechas
- **XLSX**: Exportación de Excel

---

## 🔐 SISTEMA DE PERMISOS

### Estructura de Permisos
El sistema utiliza un esquema de permisos granular basado en rutas:

```typescript
// Ejemplo de permisos por módulo
const permisos = {
  'balance': 'Ver balance financiero',
  'payments': 'Gestionar pagos',
  'outlays': 'Gestionar egresos',
  'expenses': 'Gestionar expensas',
  'defaulters': 'Ver morosos',
  'units': 'Gestionar unidades',
  'areas': 'Gestionar áreas',
  'reservations': 'Gestionar reservas',
  'alerts': 'Gestionar alertas',
  // ... más permisos
};
```

### Función userCan()
```typescript
const { userCan } = useAuth();

// Verificar permiso
if (userCan('payments')) {
  // Usuario puede gestionar pagos
}
```

---

## 🔄 FLUJOS PRINCIPALES

### 🔐 Flujo de Autenticación
1. **Login**: Usuario ingresa credenciales → Validación en IAM → Token JWT
2. **Sesión**: Token almacenado en localStorage → Verificación periódica
3. **Permisos**: Carga de permisos según rol → Verificación en cada ruta
4. **Logout**: Limpieza de token → Redirección a login

### 💰 Flujo de Pagos
1. **Creación**: Admin crea pago → Asigna unidad y monto → Define fecha límite
2. **Notificación**: Sistema notifica al residente → Email/app notification
3. **Pago**: Residente accede → Sube comprobante → Sistema valida
4. **Confirmación**: Admin confirma pago → Estado cambia a 'Pagado'
5. **Registro**: Transacción registrada → Actualización de balance

### 📅 Flujo de Reservas
1. **Búsqueda**: Usuario selecciona área → Elige fecha → Sistema valida disponibilidad
2. **Reserva**: Completa formulario → Paga tarifa si aplica → Sistema confirma
3. **Aprobación**: Admin revisa → Aprueba o rechaza → Notificación al usuario
4. **Uso**: Usuario accede al área → Guardia registra ingreso
5. **Finalización**: Sistema libera espacio → Actualiza disponibilidad

### 🚨 Flujo de Alertas
1. **Activación**: Usuario crea alerta → Selecciona tipo → Añade descripción
2. **Notificación**: Sistema envía a todos los usuarios → Sonido de alerta
3. **Respuesta**: Usuarios responden → Sistema registra acciones
4. **Seguimiento**: Admin monitorea → Actualiza estado → Cierra alerta

---

## 📊 HOOKS Y UTILIDADES ESPECIALES

### useCrud - Hook Principal
```typescript
const {
  data,           // Datos del módulo
  loading,        // Estado de carga
  error,          // Errores
  create,         // Crear registro
  update,         // Actualizar registro
  remove,         // Eliminar registro
  search,         // Búsqueda
  reload          // Recargar datos
} = useCrud('payments');
```

### useAxios - Peticiones HTTP
```typescript
const {
  data,           // Respuesta del servidor
  error,          // Errores
  loaded,         // Estado de carga
  execute,        // Ejecutar petición
  waiting,        // Contador de peticiones activas
  setWaiting      // Control manual de loading
} = useAxios();
```

### Utilidades de Fecha
- **getDateStrMes()**: Formato "Marzo 2024"
- **getDateTimeAgo()**: "Hace 2 horas"
- **getFormattedDate()**: Formato personalizado

### Utilidades de String
- **getFullName()**: Concatena nombre completo
- **getUrlImages()**: Procesa URLs de imágenes
- **FormatBsAlign()**: Formato de moneda local

---

## 🐛 MANEJO DE ERRORES

### Sistema de Logs
```typescript
import { logError, logInfo } from '@/mk/utils/logs';

// Registro de errores
logError('Error en módulo de pagos:', error);

// Información general
logInfo('Pago procesado exitosamente:', data);
```

### Toast Notifications
```typescript
const { showToast } = useAuth();

// Mostrar notificación
showToast('Pago registrado exitosamente', 'success');
showToast('Error al procesar pago', 'error');
showToast('Verifique los datos', 'warning');
```

---

## 🧪 PATRONES DE DESARROLLO

### Patrón de Componentes
Todos los módulos siguen una estructura consistente:
```
Módulo/
├── Módulo.tsx          # Componente principal
├── Módulo.module.css   # Estilos del módulo
├── RenderForm/         # Formulario de creación/edición
├── RenderView/         # Vista detallada
└── RenderDel/          # Confirmación de eliminación
```

### Patrón de Estados
```typescript
// Estados comunes en módulos
const [store, setStore] = useState({
  searchBy: '',        // Búsqueda activa
  searchState: 0,     // Estado de búsqueda
  selItem: null,      // Item seleccionado
  modalForm: false,   // Modal de formulario
  modalDel: false,    // Modal de eliminación
  loading: false,     // Estado de carga
});
```

### Patrón de Permisos
```typescript
// Verificación de permisos antes de renderizar
const { userCan } = useAuth();

if (!userCan('payments')) {
  return <NotAccess />;
}
```

---

## 🚀 CONFIGURACIÓN Y DEPLOYMENT

### Variables de Entorno
```bash
# Autenticación
NEXT_PUBLIC_AUTH_IAM=https://api.iam.com/auth

# API
NEXT_PUBLIC_API_URL=https://api.condaty.com

# Aplicación
NEXT_PUBLIC_APP_NAME=Condaty Admin
NEXT_PUBLIC_APP_DESCRIPTION=Sistema de Administración de Condominios
```

### Scripts Disponibles
```bash
npm run dev      # Desarrollo con Turbopack
npm run build    # Build de producción
npm run start    # Iniciar servidor de producción
npm run lint     # Linting con ESLint
```

---

## 🔍 DEBUGGING Y DESARROLLO

### React Scan
El proyecto incluye React Scan para debugging de renders:
```typescript
// Descomentar en layout.tsx para activar
// import { ReactScan } from "@/mk/utils/reactscan/ReactScan";
// <ReactScan />
```

### Herramientas de Desarrollo
- **ESLint**: Configuración personalizada en `eslint.config.mjs`
- **TypeScript**: Configuración estricta en `tsconfig.json`
- **Knip**: Detección de código no utilizado

---

## 📈 MÉTRICAS Y ANALÍTICAS

### Widgets de Dashboard
Los módulos incluyen widgets para visualización de datos:
- **WidgetGrafBalance**: Gráfico de balance financiero
- **WidgetGrafIngresos**: Ingresos por período
- **WidgetGrafEgresos**: Egresos categorizados
- **WidgetDefaulterResume**: Resumen de morosidad
- **WidgetScale**: Escalas de evaluación

### Reportes
- Exportación a Excel con XLSX
- Generación de PDFs (html2canvas)
- Gráficos interactivos con ApexCharts

---

## 🎯 CASOS DE USO COMUNES

### "Necesito crear un nuevo pago para un residente"
1. Navegar a `/payments`
2. Click en "Nuevo Pago" → Abre RenderForm
3. Completar: Unidad, monto, fecha límite, categoría
4. Sistema valida y crea → Notifica al residente
5. Residente recibe notificación → Accede a subir comprobante

### "Quiero ver el balance financiero del mes"
1. Navegar a `/balance`
3. Seleccionar período en filtros
4. Sistema carga: ingresos, egresos, saldo
5. Widgets muestran gráficos y tablas

### "Un residente reporta una emergencia médica"
1. Residente accede a `/alerts`
2. Click en "Nueva Alerta" → Tipo "Emergencia Médica"
3. Describe situación → Envía alerta
4. Sistema notifica a todos los usuarios
5. Personal de seguridad responde → Actualiza estado

---

## 🚨 SOLUCIÓN DE PROBLEMAS COMUNES

### "La página no carga datos"
- Verificar conexión a API en Network tab
- Revisar logs en consola para errores
- Confirmar permisos del usuario actual
- Verificar variables de entorno

### "Los estilos no se aplican"
- Verificar import de CSS modules
- Revisar nombres de clases CSS
- Confirmar theme.css está cargado
- Verificar especificidad CSS

### "Las notificaciones no funcionan"
- Verificar InstantDB connection
- Revisar permisos de notificación en navegador
- Confirmar user_id en contexto
- Verificar event listeners

### "No puedo acceder a un módulo"
- Verificar permisos con `userCan('modulo')`
- Revisar rol del usuario en IAM
- Confirmar ruta en mainMenuConfig.ts
- Verificar componente NotAccess

---

## 📝 NOTAS FINALES

### Convenciones del Proyecto
- **Nomenclatura**: CamelCase para componentes, kebab-case para archivos CSS
- **Idioma**: Español para UI, inglés para código y variables
- **TypeScript**: Uso estricto de tipos en todos los componentes
- **CSS Modules**: Siempre usar módulos CSS para estilos
- **Comentarios**: JSDoc para funciones complejas

### Mejores Prácticas
- Siempre verificar permisos antes de renderizar contenido
- Usar el sistema de loading automático de useAxios
- Implementar manejo de errores con try-catch
- Utilizar componentes del microkernel cuando sea posible
- Mantener consistencia en patrones de estado

### Optimizaciones
- Lazy loading de módulos pesados
- Memoización de componentes costosos
- Paginación server-side para listados grandes
- Caché de datos frecuentes

---

**Documento generado para análisis completo del sistema Condaty Admin**
**Versión**: 1.0.0
**Última actualización**: Diciembre 2024
**Contexto**: Proyecto Next.js 15 + React 19 + TypeScript