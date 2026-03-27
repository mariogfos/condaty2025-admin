# 🏢 CONDATY ADMIN - MEMORY BANK BRIEF

## 📋 Visión General del Proyecto
**Condaty Admin** es un sistema integral de gestión de condominios construido con **Next.js 15 (App Router)** y **React 19**. El núcleo del sistema es una arquitectura de **Microkernel (mk)** personalizada que estandariza el desarrollo de módulos CRUD, la autenticación y la interfaz de usuario.

## 🏗️ Arquitectura Core: El Microkernel (`src/mk/`)
El proyecto se basa en un framework reutilizable ubicado en `src/mk/`. Entender esto es crucial para cualquier desarrollo.

- **`useCrud` Hook** (`src/mk/hooks/useCrud/`): El motor principal. Maneja toda la lógica de CRUD, paginación, filtros, búsqueda y estados de modales basándose en un objeto de configuración.
- **`useAxios`**: Wrapper para peticiones HTTP con manejo automático de estados de carga (`loading`, `waiting`) y errores.
- **`AuthProvider`**: Gestiona la autenticación JWT, persistencia de sesión y sistema de permisos granular (`userCan`).
- **Componentes Base**: `DataModal`, `Table`, `RenderItem`, y componentes de formulario (`Input`, `Select`, `Check`) estandarizados.

## 🛠️ Stack Tecnológico
- **Framework**: Next.js 15.2.4 (con Turbopack)
- **Core UI**: React 19.1.0
- **Lenguaje**: TypeScript (Configuración estricta)
- **Real-time**: 
  - **InstantDB**: Para chat, presencia y sincronización de datos en tiempo real.
  - **Pusher**: Para notificaciones push y alertas críticas.
- **Estilos**: CSS Modules + Variables Globales (`theme.css` para tema oscuro).
- **Visualización**: React ApexCharts.
- **Utilidades**: date-fns, xlsx, html2canvas.

## 🧩 Patrón de Módulos
Todos los módulos de negocio en `src/modulos/` siguen una estructura estricta para funcionar con el Microkernel:

1.  **Configuración**: Objeto `ModCrudType` que define endpoint, permisos y textos.
2.  **Campos**: Objeto `FieldConfig` que define inputs del formulario y columnas de la lista.
3.  **Archivos Estándar**:
    - `[Modulo].tsx`: Punto de entrada que invoca `useCrud`.
    - `RenderForm.tsx`: Formulario de creación/edición (inyectado en `DataModal`).
    - `RenderView.tsx`: Vista de detalles (inyectado en `DataModal`).

## 📂 Dominios Principales
- **💰 Finanzas**: `Payments` (Ingresos), `Outlays` (Egresos), `Balance` (Flujo de caja), `Expenses` (Expensas), `DebtsManager` (Gestión de deudas), `Defaulters` (Morosos).
- **🏢 Administración**: `Units` (Unidades), `Areas` (Áreas sociales), `Documents` (Gestión documental), `Config` (Configuraciones del sistema), `Surveys` (Encuestas).
- **👥 Usuarios**: `Owners` (Propietarios), `Users` (Staff), `Roles` (Permisos), `HomeOwners`, `Profile`.
- **📅 Reservas**: `Reservas` (Gestión), `CreateReserva` (Interfaz de reserva).
- **📢 Comunicación**: `Contents` (Avisos), `Reel` (Muro social), `Notifications`.
- **🔐 Seguridad**: `Guards` (Guardias), `Alerts` (Emergencias), `Binnacle` (Bitácora).

## 🔄 Flujos Críticos
- **Autenticación**: Login contra API Laravel -> JWT almacenado -> Validación en `AuthProvider`.
- **Permisos**: Verificación mediante `userCan('CODIGO_PERMISO')` antes de renderizar acciones o rutas.
- **Navegación**: `MainMenu` dinámico basado en configuración y permisos.