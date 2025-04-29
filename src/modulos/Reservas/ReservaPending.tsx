"use client";
import useCrud from "@/mk/hooks/useCrud/useCrud";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import styles from "./Reserva.module.css"; // Puedes usar los mismos estilos o crear unos nuevos
import useCrudUtils from "../shared/useCrudUtils"; // Ajusta la ruta si es necesario
import { useMemo, useEffect } from "react"; // useEffect puede no ser necesario aquí
import { getFullName, getUrlImages } from "@/mk/utils/string";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import { getDateStrMes } from "@/mk/utils/date"; // Asegúrate que format venga de tu utilidad o date-fns
import { format, parse } from "date-fns"; // Necesario para parsear hora
import { useRouter } from "next/navigation";
import ReservationDetailModal from "./RenderView/RenderView"; // Ajusta la ruta si es necesario
import { useAuth } from "@/mk/contexts/AuthProvider"; // Importa useAuth si necesitas userCan

// --- Definición del Módulo (Ajusta singular/plural si quieres) ---
const mod = {
  modulo: "reservations",
  singular: "Reserva Pendiente", // Cambiado para claridad
  plural: "Reservas Pendientes", // Cambiado para claridad
  permiso: "", // Asegúrate que el permiso sea correcto
  extraData: true,
  hideActions: { edit: true, del: true, add: true }, // Ocultar acciones por defecto en esta vista
  renderView: (props: any) => <ReservationDetailModal {...props} />,
  loadView: { fullType: "DET" },
};

// --- Parámetros Iniciales con Filtro por Estado 'W' ---
const paramsInitial = {
  perPage: 20,
  page: 1,
  fullType: "L",
  searchBy: "",
  filterBy: "status:W", // <-- ¡FILTRO APLICADO AQUÍ!
  sortBy: 'created_at', // Ordenar por fecha de creación (más antiguas primero)
  orderBy: 'asc',     // Orden ascendente
};


const ReservaPending = () => {
  const router = useRouter();
  // Obtén userCan de useAuth para la verificación de permisos final
  const { userCan } = useAuth();

  // Definición de campos (sin cambios)
  const fields = useMemo(
    () => ({
      // ... (definición de fields igual que antes) ...
       id: { rules: [], api: "e" },
      date_at: {
        api: "ae", label: "Fecha Evento", list: {
          onRender: (props: any) => {
            const timeString = props?.item?.start_time;
            let formattedTime = '';
            if (typeof timeString === 'string' && timeString.match(/^\d{2}:\d{2}:\d{2}$/)) {
               try { formattedTime = format(parse(timeString, "HH:mm:ss", new Date()), "H:mm"); } catch (e) { console.error("Error parsing time:", e); }
            }
            return ( <div> {getDateStrMes(props?.item?.date_at)}{" "} {formattedTime} </div> );
          },
        },
      },
      area: {
         api: "ae", label: "Área Social", list: {
          onRender: (props: any) => {
            const area = props?.item?.area;
            const areaName = area?.title;
            const firstImage = area?.images?.[0];
            const imageUrl = firstImage ? getUrlImages( `/AREA-${firstImage.area_id}-${firstImage.id}.${firstImage.ext}?d=${area.updated_at || Date.now()}` ) : undefined;
            return ( <div style={{ display: "flex", alignItems: "center", gap: 8 }}> <Avatar src={imageUrl} /> <div> <p style={{ margin: 0 }}>{areaName || "Área no disponible"}</p> </div> </div> );
          },
        },
      },
      owner: {
         api: "ae", label: "Residente", list: {
          onRender: (props: any) => {
            const owner = props?.item?.owner;
            const dpto = props?.item?.dpto;
            const ownerName = owner ? getFullName(owner) : "Residente no disponible";
            const dptoNro = dpto?.nro ? `Dpto: ${dpto.nro}` : "Sin Dpto.";
            const imageUrl = owner ? getUrlImages(`/OWNER-${owner.id}.webp?d=${owner.updated_at || Date.now()}`) : undefined;
            return ( <div style={{ display: "flex", alignItems: "center", gap: 8 }}> <Avatar src={imageUrl} name={ownerName} /> <div> <p style={{ margin: 0, lineHeight: '1.3' }}> {ownerName} </p> {dpto && ( <p style={{ margin: 0, fontSize: '0.85em', color: '#666', lineHeight: '1.3' }}> {dptoNro} </p> )} {!owner && dpto && ( <p style={{ margin: 0, fontSize: '0.85em', color: '#666', lineHeight: '1.3' }}> {dptoNro} </p> )} </div> </div> );
          },
        },
      },
      status: {
         api: "ae", label: "Estado", list: {
          onRender: (props: any) => {
            const status = props?.item?.status; // Debería ser 'W' aquí
            const statusMap:any = { W: { label: "En espera", class: styles.statusW }, A: { label: "Aprobado", class: styles.statusA }, R: { label: "Rechazado", class: styles.statusR }, C: { label: "Cancelado", class: styles.statusC }, M: { label: "Mantenimiento", class: styles.statusM }, };
            const currentStatus = status ? statusMap[status] : null;
            // Para la lista de pendientes, siempre debería ser 'W', pero mantenemos la lógica por si acaso
            return ( <div className={`${styles.statusBadge} ${ currentStatus ? currentStatus.class : styles.statusUnknown }`} > {currentStatus ? currentStatus.label : status || "Desconocido"} </div> );
          },
        },
        // No necesitamos el filtro de estado aquí, ya está en paramsInitial
      },
    }),
    []
  );

  // Desestructura las props necesarias para useCrudUtils desde useCrud
  const {
    List,
    onSearch, // <-- Necesario para useCrudUtils
    searchs,  // <-- Necesario para useCrudUtils
    setStore, // <-- Necesario para useCrudUtils (el que devuelve useCrud)
    onEdit,
    onDel,
    // ...otros elementos si los necesitas...
  } = useCrud({
    paramsInitial,
    mod,
    fields,
  });

  // Llama a useCrudUtils pasando las props requeridas
  const { onLongPress, selItem } = useCrudUtils({
      onSearch, // <-- Pasar onSearch
      searchs,  // <-- Pasar searchs
      setStore, // <-- Pasar setStore (de useCrud)
      mod,
      onEdit,
      onDel,
    });

  // Verificar permisos (usando userCan de useAuth)
 // if (!userCan(mod.permiso, "R")) return <NotAccess />;

  // Renderizado (sin cambios)
  return (
    <div>
      <List onLongPress={onLongPress} selItem={selItem} />
    </div>
  );
};

export default ReservaPending;