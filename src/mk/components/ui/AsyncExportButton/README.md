# AsyncExportButton (S33)

Componente standalone que pineá el flow async de export PDF introducido en S32 (PR #120).

## Qué hace

Reemplaza el patrón viejo de export (que se caía el server con reportes grandes) por el flow async:

```
[Click] → POST /api/v3/reports/{type}/export {params}
            ↓ (202 con job_id)
[Modal]  → "Generando reporte..." + progress
            ↓
          GET /api/v3/reports/{job_id}/status (polling cada 2.5s)
            ↓
[Modal]  → "Reporte listo" + botón Descargar
            ↓
[Click]  → GET /api/v3/reports/{job_id}/download
            ↓
          Blob → <a> download
```

## Uso básico

```tsx
import AsyncExportButton from "@/mk/components/ui/AsyncExportButton/AsyncExportButton";

<AsyncExportButton
  type="payments"
  params={{
    filterBy: "in_at:m",
    exportTitulos: "Nombre,Monto,Fecha",
  }}
  label="Exportar Pagos"
  onCompleted={(state) => console.log("Listo:", state.downloadUrl)}
  onError={(msg) => console.error("Error:", msg)}
/>
```

## API

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `type` | `string` | requerido | Identificador del ReportType (debe estar en el backend) |
| `params` | `Record<string, any>` | requerido | Parámetros del reporte (filtros, columnas, fechas) |
| `label` | `string` | `"Exportar"` | Texto del botón |
| `format` | `"pdf" \| "excel"` | `"pdf"` | Formato de salida |
| `className` | `string` | — | CSS adicional |
| `variant` | `"primary" \| "secondary" \| "terciary"` | `"terciary"` | Estilo del botón |
| `onCompleted` | `(state) => void` | — | Callback cuando el reporte está listo |
| `onError` | `(msg) => void` | — | Callback cuando falla |

## Tipos de reporte disponibles

Después de S32 (PR #120), solo `array_chunked` está registrado. Los módulos
reales (payments, accesses, balance, etc.) requieren su propio
`ReportType` en el backend:

```
app/Reports/Types/PaymentsReportType.php  (ejemplo, no existe)
app/Reports/Types/AccessesReportType.php  (sub-sprint S34)
...
```

## Cómo migrar un módulo

**ANTES** (useCrud.onExport línea 978 — flow viejo):
```tsx
import { IconExport } from "@/components/layout/icons/IconsBiblioteca";
// ... adentro de useCrud:
<IconExport onClick={() => onExport("pdf")} />
```

**AHORA** (opción 1 — usar AsyncExportButton standalone):
```tsx
import AsyncExportButton from "@/mk/components/ui/AsyncExportButton/AsyncExportButton";

<AsyncExportButton
  type="payments"
  params={{
    fullType: "L",
    filterBy: filterBy,
    exportTitulos: mod?.exportTitulos,
  }}
  label="Exportar Pagos"
/>
```

**AHORA** (opción 2 — usar useAsyncExport directamente para mayor control):
```tsx
import { useAsyncExport } from "@/mk/hooks/useAsyncExport/useAsyncExport";
import ExportProgressModal from "@/mk/components/ui/ExportProgressModal/ExportProgressModal";

const MyComponent = () => {
  const { state, start, download, reset } = useAsyncExport({
    type: "payments",
    onCompleted: (s) => showToast("Listo", "success"),
  });

  return (
    <>
      <button onClick={() => start(params)} disabled={state.isExporting}>
        Exportar
      </button>
      <ExportProgressModal
        open={state.isExporting || state.status === "completed"}
        state={state}
        reportTypeLabel="Pagos"
        onDownload={download}
        onClose={reset}
      />
    </>
  );
};
```

## Requisitos

- **Backend** S32 mergeado en dev (PR #120): endpoints `/api/v3/reports/{type}/export|{uuid}/status|{uuid}/download` disponibles.
- **Auth**: Sanctum token en cada request (heredado del `AxiosContext` del proyecto).
- **Type registrado**: el `type` debe existir en `App\Reports\ReportTypeRegistry`. Por ahora solo `array_chunked`.

## Limitaciones actuales

- **Solo `array_chunked` type**: módulos reales (payments, accesses, etc.) requieren
  crear el `ReportType` correspondiente en el backend. Esto se hace en
  sub-sprints siguientes.
- **No migra useCrud**: el botón de export viejo en useCrud (línea 1697-1728)
  sigue funcionando con el flow legacy. La migración es opt-in por módulo.
- **Sin e2e tests**: los tests del componente (smoke test del modal +
  unit del hook) están en `__tests__/`. Tests e2e con backend real
  requieren setup que no está en este sprint.

## Lecciones pineadas (binding, cross-project)

- Cuando pineas hook + modal para un flow async, **encapsular en un componente
  reusable** (este `AsyncExportButton`) minimiza el refactor de cada módulo
  que quiera migrar.
- **NO migrar useCrud en el mismo sprint**: el componente reusable + opt-in
  por módulo es más seguro que un refactor invasivo. Cada migración se
  hace en su propio sub-sprint.
- **Tests del hook con vitest + @testing-library/react**: usar `vi.fn()` para
  mockear `fetch` + `setInterval` (no `vi.useFakeTimers` que rompe `act`).
  El ref `isExportingRef` (no state) para evitar closures stale en tests.
