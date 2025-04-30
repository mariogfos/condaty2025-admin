"use client";
import useCrud from "@/mk/hooks/useCrud/useCrud";
import NotAccess from "@/components/auth/NotAccess/NotAccess";

import ItemList from "@/mk/components/ui/ItemList/ItemList";
import useCrudUtils from "../shared/useCrudUtils";
import { useMemo } from "react";
import RenderItem from "../shared/RenderItem";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import RenderView from "./RenderView/RenderView";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import { getDateStrMes, getDateTimeStrMes, getHourStr } from "@/mk/utils/date";
import styles from "./Reserva.module.css";
import ReservaModal from "./ReservaModal/ReservaModal";
import Button from "@/mk/components/forms/Button/Button";
import { useRouter } from "next/navigation";
import { format, parse } from "date-fns";
import ReservationDetailModal from "./RenderView/RenderView";

const mod = {
  modulo: "reservations",
  singular: "Reserva",
  plural: "Reservas",
  permiso: "",
  extraData: true,
  hideActions: { edit: true, del: true, add: true },
  renderView: (props: any) => <ReservationDetailModal {...props} />,
  loadView: { fullType: "DET" },
  filter:true
  // Esto cargará los detalles completos al hacer clic
};

const paramsInitial = {
  perPage: 20,
  page: 1,
  fullType: "L",
  searchBy: "",
};

const Reserva = () => {
  const router = useRouter();
  const getReservaStatusOptions = () => [
    { id: "", name: "Todos" }, // Opción para mostrar todos
    { id: "W", name: "En espera" },
    { id: "Y", name: "Aprobado" },
    { id: "N", name: "Rechazado" },
    { id: "X", name: "Cancelado" },
    // Agrega otros estados si son relevantes para filtrar, por ejemplo:
    // { id: "A", name: "Disponible" }, // Si aplica
  ];
  const fields = useMemo(
    () => ({
      id: { rules: [], api: "e" },
      date_at: {
        rules: ["required"],
        api: "ae",
        label: "Fecha del evento",
        form: { type: "date" },
        list: {
          onRender: (props: any) => {
            return (
              <div>
                {getDateStrMes(props?.item?.date_at)}{" "}
                {format(parse(props?.item?.start_time, "HH:mm:ss", new Date()), "H:mm")}
              </div>
            );
          },
        },
      },
      area: {
        rules: ["required"],
        api: "ae",
        label: "Área Social",
        form: { type: "text" },
        list: {
          // MODIFICACIÓN AQUÍ (area.onRender)
          onRender: (props: any) => {
            // Guarda el área y el nombre en variables con comprobación
            const area = props?.item?.area;
            const areaName = area?.title; // Acceso seguro a 'name'
            const imageUrl = area?.images?.[0]
              ? getUrlImages(
                  `/AREA-${area.images[0].area_id}-${area.images[0].id}.webp?d=${area.updated_at}`
                )
              : undefined; // Genera URL solo si hay datos

            return (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Avatar
                  src={imageUrl} // Pasa la URL segura (puede ser undefined)
                  
                />
                <div>
                  {/* Muestra el nombre o un texto alternativo si no existe */}
                  <p>{areaName || "Área no disponible"}</p>
                </div>
              </div>
            );
          },
          // FIN MODIFICACIÓN (area.onRender)
        },
      },
      owner: {
        rules: ["required"],
        api: "ae",
        label: "Residente",
        form: { type: "text" },
        list: {
          // ***** MODIFICACIÓN AQUÍ *****
          onRender: (props: any) => {
            const owner = props?.item?.owner;
            const dpto = props?.item?.dpto; // Obtener el objeto dpto del item

            const ownerName = owner
              ? getFullName(owner)
              : "Residente no disponible";
            // Obtener el número de dpto de forma segura
            const dptoNro = dpto?.nro ? `Dpto: ${dpto.nro}` : "Sin Dpto.";

            const imageUrl = owner
              ? getUrlImages(`/OWNER-${owner.id}.webp?d=${owner.updated_at || Date.now()}`) // Fallback para d
              : undefined;

            return (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Avatar
                  src={imageUrl}
                  name={ownerName}
                />
                <div>
                  {/* Párrafo para el nombre */}
                  <p style={{ margin: 0, lineHeight: '1.3' }}>
                    {ownerName}
                  </p>
                  {/* Párrafo para el número de departamento (solo si dpto existe) */}
                  {dpto && (
                     <p style={{ margin: 0, fontSize: '0.85em', color: '#666', lineHeight: '1.3' }}>
                       {dptoNro}
                     </p>
                  )}
                  {/* Si 'owner' es null pero 'dpto' sí existe, podrías mostrar solo el dpto */}
                  {!owner && dpto && (
                     <p style={{ margin: 0, fontSize: '0.85em', color: '#666', lineHeight: '1.3' }}>
                       {dptoNro}
                     </p>
                  )}
                </div>
              </div>
            );
          },
           // ***** FIN MODIFICACIÓN *****
        },
      },
      
      status: {
        rules: ["required"],
        api: "ae",
        label: "Estado",
        form: {
          type: "select",
          options: [
            { id: "A", name: "Disponible" },
            { id: "X", name: "No disponible" },
            { id: "M", name: "En mantenimiento" },
          ],
        },
        list: {
          onRender: (props: any) => {
            // NUEVO: Tipo actualizado para incluir los nuevos estados
            const status = props?.item?.status as
              | "X"
              | "W"
              | "Y"
              | "N"
              | undefined;

            // NUEVO: Mapeo actualizado con los nuevos estados y clases
            const statusMap = {
              X: { label: "Cancelado", class: styles.statusX },
              W: { label: "En espera", class: styles.statusW },
              Y: { label: "Aprobado", class: styles.statusY },
              N: { label: "Rechazado", class: styles.statusN },
              A: { label: "Disponible", class: styles.statusA },
            };

            const currentStatus = status ? statusMap[status] : null;

            return (
              <div
                className={`${styles.statusBadge} ${
                  currentStatus ? currentStatus.class : styles.statusUnknown
                }`}
              >
                {currentStatus ? currentStatus.label : "Estado desconocido"}
              </div>
            );
          },
        },
        filter: {
          label: "Estado Reserva", 
          width: "180px",              
          options: getReservaStatusOptions, 
        },
      }, 
    }),
    []
  );
  const customAddButton = (
    <Button
      key="custom-add-reserva" // Añadir key única
      onClick={() => router.push("/create-reservas")} // Acción de navegación
      variant="primary" // O el variant que uses
      style={{ height: 48 }} // Mantener estilo consistente si es necesario
    >
      Crear Reserva
    </Button>
  );

  const {
    userCan,
    List,
    // Ya no necesitas onAdd del hook si no lo usas
    // onAdd,
    // ...otros elementos que sí uses ...
    setStore,
    onSearch,
    searchs,
    onEdit, // Mantienes onEdit/onDel si los usas en otro lugar (ej. onLongPress)
    onDel,
    extraData,
    findOptions,
    reLoad
  } = useCrud({
    paramsInitial,
    mod,
    fields,
    // NUEVO: Pasar el botón personalizado como extraButton
    extraButtons: [customAddButton],
  });
  const { onLongPress, selItem } = useCrudUtils({
    onSearch,
    searchs,
    setStore,
    mod,
    onEdit,
    onDel,
  });

  if (!userCan(mod.permiso, "R")) return <NotAccess />;
  return (
    <div>
      <List />
    </div>
  );
};

export default Reserva;
