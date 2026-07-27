"use client";
// S103: VisitReasons es feature DEAD — el backend nunca expuso
// `/api/v3/visit-reasons` (verificado con `php artisan route:list` el 2026-07-27).
// El módulo tenía `permiso: ""` y siempre mostraba NotAccess; el entry del menú
// Backoffice se removió en S103 (mainMenuConfig.ts). La página
// /visit-reasons queda huérfana (próximo sprint: borrarla si Mario confirma).
//
// Pin: este placeholder documenta el estado y previene que cualquier reactivador
// futuro restaure el módulo sin haberse asegurado primero de que el back tiene
// los endpoints. Para reactivar:
//   1. Crear `app/Modules/VisitReasons/Controllers/VisitReasonController.php` en
//      el back y registrarlo en routes/api.php como `/api/v3/visit-reasons`.
//   2. Restaurar el entry del menú en mainMenuConfig.ts.
//   3. Reemplazar este componente con la implementación real (useCrud).
import NotAccess from "@/components/auth/NotAccess/NotAccess";

const VisitReasons = () => {
  return <NotAccess />;
};

export default VisitReasons;
