"use client";
import { useState } from "react";
import styles from "./Activities.module.css";
import TabsButtons from "@/mk/components/ui/TabsButton/TabsButtons";
import AccessesTab from "./AccessTab/AccessTab";
import QrTab from "./QrTab/QrTab";
import PedidosTab from "./PedidosTab/PedidosTab";

const paramsInitialAccess = {
  fullType: "L",
  perPage: 20,
  page: 1,
  extraData: true,
};

/**
 * ⚠️ Sin `extraData`: la lista de invitaciones no tiene tarjetas de resumen, y
 * pedirlo dispara una segunda vuelta del controller para nada.
 */
const paramsInitialQr = {
  fullType: "L",
  perPage: 20,
  page: 1,
};

/**
 * ⚠️ Los pedidos tampoco tienen tarjetas de resumen.
 */
const paramsInitialPedidos = {
  fullType: "L",
  perPage: 20,
  page: 1,
};

const tabs = [
  { value: "accesses", text: "Accesos" },
  { value: "qr", text: "Invitaciones" },
  { value: "pedidos", text: "Pedidos" },
];

/**
 * 🔴 `QrTab` existía desde hacía meses y NO LA IMPORTABA NADIE.
 *
 * Lo preguntó Mario el 2026-08-08 —"dónde está la lista de invitaciones, no la
 * veo"— y no la veía porque esta página montaba sólo `AccessesTab`. El
 * componente estaba entero y sano por dentro: recibía `paramsInitial`, tenía su
 * `RenderView`, su filtro por período y su botón de exportar. Lo único que le
 * faltaba era alguien que lo renderizara.
 *
 * ⚠️ Es la segunda vez en la Fase 6 (la otra fue Presupuestos) y la tercera
 * contando el módulo `homeowners`: **si un componente está muerto lo dice el
 * LLAMADOR, no el componente**. Buscar "¿esto se usa?" leyendo el archivo no
 * sirve — hay que buscar quién lo importa.
 *
 * En el menú, "Invitaciones QR" (`/invitations`) apunta a OTRA cosa: las
 * campañas (`v3/campaigns`), con columnas de rol, código y cantidad.
 *
 * 🔴 Y `PedidosTab` estaba EXACTAMENTE IGUAL: entera, con su `RenderView`, su
 * filtro por período, su botón de exportar y hasta las acciones de registrar
 * entrada y salida — y sin un solo import en todo el proyecto. Apareció al
 * migrar su reporte al motor declarativo (Fase 6, 2026-08-08): el back tenía
 * `OtherReportType` vivo para una lista que nadie podía abrir.
 *
 * Van tres en la Fase 6 —Presupuestos, QrTab, PedidosTab— más el módulo
 * `homeowners`. Ya no es una casualidad: **buscar quién importa, no qué
 * importa**.
 */
const Activities = () => {
  const [tab, setTab] = useState("accesses");

  return (
    <div className={styles.container1}>
      <TabsButtons sel={tab} tabs={tabs} setSel={setTab} variant="rounded" />

      {tab === "accesses" && <AccessesTab paramsInitial={paramsInitialAccess} />}
      {tab === "qr" && <QrTab paramsInitial={paramsInitialQr} />}
      {tab === "pedidos" && <PedidosTab paramsInitial={paramsInitialPedidos} />}
    </div>
  );
};

export default Activities;
