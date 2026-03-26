# Informe de Impacto: Agregando el Flag has_maintenance_value

## 1. RESUMEN EJECUTIVO

### Descripción General de la Implementación Actual del Valor de Mantenimiento
El sistema actual ya implementa la funcionalidad del valor de mantenimiento en múltiples módulos. El campo `maintenance_amount` está presente en las estructuras de datos relacionadas con deudas y se utiliza en cálculos financieros, componentes de visualización y procesamiento de pagos. El campo representa cargos adicionales aplicados a las deudas más allá del monto base y los montos de penalización.

### Impacto de Agregar el Flag has_maintenance_value
Agregar un flag `has_maintenance_value` introduciría lógica condicional para controlar cuándo se aplican los valores de mantenimiento. Este flag probablemente sería una configuración que determina si los montos de mantenimiento deben incluirse en cálculos, visualizaciones y procesamiento de pagos para tipos específicos de deudas o configuraciones de condominio.

### Cambios Clave Necesarios
- Modificaciones al esquema de base de datos para agregar el flag
- Actualizaciones al módulo de configuración para gestionar el flag
- Modificaciones a la lógica de cálculo en múltiples módulos financieros
- Actualizaciones de UI para mostrar/ocultar condicionalmente campos de valor de mantenimiento
- Actualizaciones a endpoints de API para respetar el flag
- Actualizaciones a validación de formularios

## 2. ANÁLISIS DEL SISTEMA ACTUAL

### Funcionalidad Existente del Valor de Mantenimiento
El campo `maintenance_amount` está actualmente implementado en:
- Vistas y formularios de detalles de deudas
- Módulos de procesamiento de pagos
- Lógica de cálculo financiero
- Seguimiento de balances y gastos
- Módulos de gestión de deudas (individuales, compartidas, perdón)

### Campos Actuales de Base de Datos y Uso
- `maintenance_amount`: Campo numérico que almacena montos de valor de mantenimiento
- Utilizado en la tabla debt-dpto y registros financieros relacionados
- Integrado en cálculos de balance total: `amount + penalty_amount + maintenance_amount`

### Lógica Actual de Cálculo
Los montos de mantenimiento siempre se incluyen en los cálculos totales:
```typescript
const totalBalance = debtAmount + penaltyAmount + maintenanceAmount;
```
Esta lógica aparece en:
- Vistas de detalles de deudas
- Formularios de pagos
- Reportes financieros
- Cálculos de balances

## 3. ARCHIVOS Y MÓDULOS AFECTADOS

### Cambios en Base de Datos/Backend
| Ruta del Archivo | Tipo de Impacto | Funcionalidad Actual | Cambios Requeridos | Prioridad |
|------------------|-----------------|----------------------|---------------------|-----------|
| Esquema de base de datos (tabla debt-dpto) | Esquema | Contiene el campo maintenance_amount | Agregar flag booleano has_maintenance_value | Crítico |
| Endpoints de API (/debt-dptos) | Procesamiento de Datos | Retorna maintenance_amount en respuestas | Incluir/excluir condicionalmente maintenance_amount basado en el flag | Alto |
| APIs de procesamiento de pagos | Cálculo | Incluye maintenance_amount en totales | Aplicar lógica condicional para inclusión de mantenimiento | Alto |

### Módulos de Configuración
| Ruta del Archivo | Tipo de Impacto | Funcionalidad Actual | Cambios Requeridos | Prioridad |
|------------------|-----------------|----------------------|---------------------|-----------|
| `src/modulos/Config/Config.tsx` | Estructura del Módulo | Gestiona pestañas de configuración del cliente | Agregar pestaña/sección de configuración de valor de mantenimiento | Medio |
| `src/modulos/Config/DefaulterConfig/DefaulterConfig.tsx` | Componentes UI | Maneja configuración de penalizaciones | Agregar toggle de valor de mantenimiento y configuraciones | Alto |
| Endpoints de API de configuración del cliente | Almacenamiento de Datos | Almacena configuraciones de penalizaciones | Almacenar flag has_maintenance_value | Alto |

### Módulos de Gestión de Deudas
| Ruta del Archivo | Tipo de Impacto | Funcionalidad Actual | Cambios Requeridos | Prioridad |
|------------------|-----------------|----------------------|---------------------|-----------|
| `src/modulos/DebtsManager/TabComponents/AllDebts/RenderView/RenderView.tsx` | Visualización | Muestra monto de mantenimiento en detalles de deudas | Ocultar/mostrar condicionalmente basado en el flag | Medio |
| `src/modulos/DebtsManager/TabComponents/AllDebts/AllDebts.tsx` | Procesamiento de Datos | Procesa maintenance_amount en listas de deudas | Filtrar/incluir datos de mantenimiento basado en el flag | Medio |
| `src/modulos/DebtsManager/TabComponents/IndividualDebts/IndividualDebts.tsx` | Manejo de Formularios | Incluye maintenance_amount en formularios | Mostrar condicionalmente campos de mantenimiento | Medio |
| `src/modulos/DebtsManager/TabComponents/SharedDebts/SharedDebts.tsx` | Procesamiento de Datos | Maneja montos de mantenimiento de deudas compartidas | Aplicar lógica condicional | Medio |
| `src/modulos/DebtsManager/TabComponents/SharedDebts/DetalleDeudaCompartida/DetailSharedDebts.tsx` | Visualización | Muestra mantenimiento en detalles de deudas compartidas | Visualización condicional | Medio |
| `src/modulos/DebtsManager/TabComponents/Forgiveness/RenderView/RenderView.tsx` | Visualización | Muestra mantenimiento en vistas de perdón | Visualización condicional | Bajo |
| `src/modulos/DebtsManager/TabComponents/Forgiveness/RenderForm/RenderForm.tsx` | Cálculo | Incluye mantenimiento en cálculos de perdón | Cálculos condicionales | Medio |
| `src/modulos/DebtsManager/TabComponents/Forgiveness/Forgiveness.tsx` | Procesamiento de Datos | Procesa perdón con mantenimiento | Aplicar lógica condicional | Medio |

### Módulos de Cálculo Financiero
| Ruta del Archivo | Tipo de Impacto | Funcionalidad Actual | Cambios Requeridos | Prioridad |
|------------------|-----------------|----------------------|---------------------|-----------|
| `src/modulos/Payments/RenderForm/RenderForm.tsx` | Cálculo | Incluye mantenimiento en totales de pagos | Inclusión condicional en cálculos de pagos | Alto |
| `src/modulos/Payments/RenderView/RenderView.tsx` | Visualización | Muestra mantenimiento en detalles de pagos | Visualización condicional | Medio |
| `src/modulos/Expenses/ExpensesDetails/ExpensesDetailsView.tsx` | Procesamiento de Datos | Procesa montos de mantenimiento de gastos | Aplicar lógica condicional | Medio |
| `src/modulos/Expenses/ExpensesDetails/RenderView/RenderView.tsx` | Cálculo | Incluye mantenimiento en totales de gastos | Cálculos condicionales | Medio |
| `src/modulos/Balance/Balance.tsx` | Reportes | Incluye mantenimiento en cálculos de balances | Inclusión condicional en reportes financieros | Alto |

### Componentes UI/Visualización
| Ruta del Archivo | Tipo de Impacto | Funcionalidad Actual | Cambios Requeridos | Prioridad |
|------------------|-----------------|----------------------|---------------------|-----------|
| Varios componentes de tabla | Visualización | Muestran columnas de mantenimiento | Ocultar/mostrar condicionalmente columnas | Bajo |
| Componentes de formulario | Entrada | Campos de entrada de monto de mantenimiento | Mostrar/ocultar condicionalmente campos | Medio |
| Componentes de modal | Visualización | Visualización de valor de mantenimiento | Renderizado condicional | Medio |

### Endpoints de API
| Ruta del Archivo | Tipo de Impacto | Funcionalidad Actual | Cambios Requeridos | Prioridad |
|------------------|-----------------|----------------------|---------------------|-----------|
| Endpoints `/debt-dptos` | Recuperación de Datos | Retorna maintenance_amount | Incluir condicionalmente basado en el flag | Alto |
| Endpoints `/client-config` | Configuración | Gestiona configuraciones del cliente | Almacenar/recuperar flag has_maintenance_value | Alto |
| Endpoints de procesamiento de pagos | Cálculo | Procesa pagos con mantenimiento | Lógica condicional | Alto |

## 4. PLAN DETALLADO DE IMPLEMENTACIÓN

### Cambios al Esquema de Base de Datos
1. Agregar columna booleana `has_maintenance_value` a la tabla de configuración del cliente
2. Valor por defecto: true (para mantener compatibilidad hacia atrás)
3. Agregar script de migración de base de datos
4. Actualizar modelos ORM para incluir el nuevo campo

### Actualizaciones al Módulo de Configuración
1. Agregar nueva sección de configuración en el componente DefaulterConfig
2. Crear toggle switch para habilitar/deshabilitar valores de mantenimiento
3. Agregar validación para la nueva configuración
4. Actualizar funcionalidad de guardado para persistir el flag

### Modificaciones a la Lógica de Cálculo
Para cada módulo financiero, implementar lógica condicional:
```typescript
const shouldApplyMaintenance = clientConfig?.has_maintenance_value ?? true;
const totalBalance = debtAmount + penaltyAmount + (shouldApplyMaintenance ? maintenanceAmount : 0);
```

### Actualizaciones a Componentes UI
1. Renderizar condicionalmente campos relacionados con mantenimiento
2. Actualizar encabezados y columnas de tablas
3. Modificar reglas de validación de formularios
4. Actualizar componentes de visualización para ocultar mantenimiento cuando esté deshabilitado

### Actualizaciones a APIs
1. Modificar endpoints de recuperación de datos para respetar el flag
2. Actualizar endpoints de cálculo
3. Asegurar compatibilidad hacia atrás para datos existentes

## 5. CAMBIOS AL MÓDULO DE CONFIGURACIÓN

### Dónde Agregar la Configuración has_maintenance_value
- Ubicación: `src/modulos/Config/DefaulterConfig/DefaulterConfig.tsx`
- Sección: Agregar nueva sección después de la configuración de penalizaciones
- Componente UI: Toggle switch con texto descriptivo

### Componentes UI Necesarios
```typescript
// Nueva estructura de componente
<div className={styles.sectionContainer}>
  <div>
    <div style={{ display: "flex", gap: 8 }}>
      <h2 className={styles.sectionTitle}>Valor de mantenimiento</h2>
      <Tooltip
        position="right"
        title="Habilita o deshabilita la aplicación de valores de mantenimiento en las deudas del condominio"
      >
        <IconQuestion size={16} />
      </Tooltip>
    </div>
    <p className={styles.sectionSubtitle}>
      Controla si se aplicarán cargos adicionales por mantenimiento en las expensas
    </p>
  </div>

  <div className={styles.inputField}>
    <ToggleSwitch
      name="has_maintenance_value"
      label="Habilitar valor de mantenimiento"
      value={formState?.has_maintenance_value}
      onChange={onChange}
    />
  </div>
</div>
```

### Cambios al Esquema de Base de Datos
- Agregar `has_maintenance_value` BOOLEAN DEFAULT TRUE a la tabla client_config
- Actualizar registros existentes para mantener el comportamiento actual

### Actualizaciones a Validación de Formularios
- Agregar validación para la nueva configuración de toggle
- Asegurar manejo adecuado de tipos de datos (booleano)

## 6. CAMBIOS A LA LÓGICA DE CÁLCULO

### Para Cada Módulo Financiero
La lógica de cálculo necesita actualizarse en múltiples ubicaciones:

#### Cálculos de Pagos
```typescript
// Antes
const total = amount + penaltyAmount + maintenanceAmount;

// Después
const shouldApplyMaintenance = clientConfig?.has_maintenance_value ?? true;
const total = amount + penaltyAmount + (shouldApplyMaintenance ? maintenanceAmount : 0);
```

#### Cálculos de Balances
```typescript
// En Balance.tsx y componentes relacionados
const calculatedTotals = useMemo(() => {
  // ... lógica existente
  const totalBalance = totalIngresos - totalEgresos + saldoInicial;
  // Los montos de mantenimiento se incluyen en datos de ingresos/egresos
  // No se necesita cambio directo si el filtrado de datos se maneja a nivel de API
}, [finanzas?.data?.ingresosHist, finanzas?.data?.egresosHist, finanzas?.data?.saldoInicial]);
```

### Puntos de Integración
1. **Filtrado a Nivel de API**: Modificar endpoints `/balances` y `/debt-dptos` para incluir condicionalmente montos de mantenimiento
2. **Cálculos del Lado del Cliente**: Actualizar toda la lógica de cálculo para verificar el flag
3. **Envíos de Formularios**: Asegurar que los formularios respeten el flag de mantenimiento al enviar datos


## 7. IMPACTO EN UI/UX

### Nuevos Elementos de Interfaz Necesarios
1. Toggle de configuración en DefaulterConfig
2. Visualización condicional de columnas de mantenimiento en tablas
3. Campos de formulario condicionales en formularios de creación/edición de deudas
4. Etiquetas y texto de ayuda actualizados

### Modificaciones a Interfaces Existentes
1. **Encabezados de Tablas**: Mostrar condicionalmente la columna "Valor Mant."
2. **Campos de Formulario**: Ocultar entradas de monto de mantenimiento cuando esté deshabilitado
3. **Vistas de Detalles**: Mostrar condicionalmente información de mantenimiento
4. **Formularios de Pago**: Ocultar montos de mantenimiento en cálculos

### Cambios en el Flujo de Trabajo del Usuario
1. **Configuración**: Los administradores ahora pueden deshabilitar valores de mantenimiento globalmente
2. **Gestión de Deudas**: Los usuarios no verán campos de mantenimiento cuando esté deshabilitado
3. **Procesamiento de Pagos**: Los montos de mantenimiento no aparecerán en totales cuando estén deshabilitados
4. **Reportes**: Los reportes financieros excluirán mantenimiento cuando esté deshabilitado


## 8. ANÁLISIS DE RIESGOS

### Cambios Disruptivos Potenciales
1. **Visualización de Datos**: Los montos de mantenimiento existentes pueden desaparecer de las vistas
2. **Cálculos**: Los montos totales cambiarán cuando el mantenimiento esté deshabilitado
3. **Reportes**: Los reportes históricos pueden mostrar totales diferentes
4. **Respuestas de API**: La estructura de respuesta puede cambiar basado en la configuración


### Impactos en Rendimiento
1. **Consultas de Base de Datos**: Impacto mínimo - adición de un solo campo booleano
2. **Rendimiento de API**: Aumento leve debido a lógica condicional
3. **Rendimiento del Cliente**: Mínimo - mayormente renderizado condicional

### Complejidad de Pruebas
1. **Pruebas de Configuración**: Probar funcionalidad de toggle
2. **Lógica Condicional**: Probar todas las rutas de código con flag habilitado/deshabilitado
3. **Compatibilidad hacia Atrás**: Asegurar comportamiento existente cuando el flag esté habilitado
4. **Pruebas de Integración**: Probar en todos los módulos afectados

## 9. CRONOGRAMA DE IMPLEMENTACIÓN

### Fase 1: Base de Datos y Configuración 
- Actualizar UI del módulo de configuración
- Implementar funcionalidad básica de toggle
- Pruebas unitarias para cambios de configuración

### Fase 2: Actualizaciones de API
- Modificar endpoints de recuperación de datos
- Agregar filtrado condicional
- Pruebas de integración de API

### Fase 3: Actualizaciones de Frontend 
- Actualizar módulos de gestión de deudas
- Modificar componentes de cálculo
- Actualizar componentes UI para visualización condicional
- Pruebas de integración de frontend

### Fase 4: Módulos Financieros
- Actualizar procesamiento de pagos
- Modificar cálculos de balances
- Actualizar manejo de gastos
- Pruebas de lógica financiera


### Dependencias de Ruta Crítica
1. La migración de base de datos debe completarse antes de los cambios en API
2. El módulo de configuración debe ser funcional antes de otras actualizaciones de UI
3. Los cambios en API deben desplegarse antes de las actualizaciones de frontend
4. Todos los cálculos financieros deben verificarse antes del lanzamiento en producción

### Fases de Pruebas
1. **Pruebas Unitarias**: Pruebas de componentes y funciones individuales
2. **Pruebas de Integración**: Pruebas de interacción entre módulos
3. **Pruebas de Sistema**: Pruebas de flujos de trabajo de extremo a extremo
4. **Pruebas de Aceptación del Usuario**: Pruebas de escenarios de usuario reales

### Consideraciones de Despliegue
1. **Flag de Característica**: Considerar usar flags de característica para lanzamiento gradual
2. **Migración de Base de Datos**: Asegurar migración sin tiempo de inactividad
3. **Plan de Retroceso**: Preparar procedimientos de retroceso
4. **Monitoreo**: Implementar monitoreo para cambios en cálculos

## 10. RECOMENDACIONES

### Mejores Prácticas para la Implementación
1. **Compatibilidad hacia Atrás**: Establecer el flag por defecto en true para mantener el comportamiento existente
2. **Pruebas Exhaustivas**: Probar todas las rutas de cálculo thoroughly
3. **Documentación**: Actualizar guías de usuario y documentación de API

Esta implementación proporciona un enfoque integral para agregar funcionalidad condicional de valor de mantenimiento mientras se mantiene la estabilidad del sistema y la compatibilidad hacia atrás.