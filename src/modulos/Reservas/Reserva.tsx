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
import { getDateTimeStrMes } from "@/mk/utils/date";
import styles from "./Reserva.module.css";
import ReservaModal from "./ReservaModal/ReservaModal";
import Button from "@/mk/components/forms/Button/Button";
import { useRouter } from 'next/navigation';

const mod = {
  modulo: "reservations",
  singular: "Reserva",
  plural: "Reservas",
  permiso: "",
  extraData: true,
  hideActions: { edit: true, del: true, add: true},
  renderView: (props: any) => <ReservaModal {...props} />,
  loadView: { fullType: "DET" } ,
  // Esto cargará los detalles completos al hacer clic
};

const paramsInitial = {
  perPage: 10,
  page: 1,
  fullType: "L",
  searchBy: "",
};


const Reserva = () => {
  const router = useRouter();
  const fields = useMemo(
    () => ({
      id: { rules: [], api: "e" },
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
            const areaName = area?.name; // Acceso seguro a 'name'
            const imageUrl = area?.images?.[0]
              ? getUrlImages(
                  `/AREA-${area.images[0].area_id}-${area.images[0].id}.webp?d=${area.updated_at}`
                )
              : undefined; // Genera URL solo si hay datos

            return (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Avatar
                  src={imageUrl} // Pasa la URL segura (puede ser undefined)
                  square
                />
                <div>
                  {/* Muestra el nombre o un texto alternativo si no existe */}
                  <p>{areaName || 'Área no disponible'}</p>
                </div>
              </div>
            );
          }
          // FIN MODIFICACIÓN (area.onRender)
        },
      },
      owner: {
        rules: ["required"],
        api: "ae",
        label: "Residente",
        form: { type: "text" },
        list: {
          // MODIFICACIÓN AQUÍ (owner.onRender)
          onRender: (props: any) => {
            // Guarda el owner en una variable
            const owner = props?.item?.owner;
            // Llama a getFullName solo si owner existe, sino usa texto alternativo
            const ownerName = owner ? getFullName(owner) : 'Residente no disponible';
            const imageUrl = owner
              ? getUrlImages(`/OWNER-${owner.id}.webp?d=${owner.updated_at}`)
              : undefined; // Genera URL solo si hay owner

            return (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Avatar
                  src={imageUrl} // Pasa la URL segura (puede ser undefined)
                  name={ownerName} // Pasa el nombre seguro
                  square
                />
                <div>
                  <p>{ownerName}</p> {/* Muestra el nombre seguro */}
                </div>
              </div>
            );
          }
          // FIN MODIFICACIÓN (owner.onRender)
        },
      },
      date_at: {
        rules: ["required"],
        api: "ae",
        label: "Fecha del evento",
        form: { type: "date" },
        list: {
          onRender: (props: any) => {
            return <div>{getDateTimeStrMes(props?.item?.date_at)}</div>;
          },
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
                { id: "M", name: "En mantenimiento" }
            ] 
        },
        list: {
          onRender: (props: any) => {
            // NUEVO: Tipo actualizado para incluir los nuevos estados
            const status = props?.item?.status as 'X' | 'W' | 'Y' | 'N' | undefined;

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
              <div className={`${styles.statusBadge} ${currentStatus ? currentStatus.class : styles.statusUnknown}`}>
                {currentStatus ? currentStatus.label : 'Estado desconocido'}
              </div>
            );
          },
      },
    },
    }),
    []
  );
  const customAddButton = (
    <Button
      key="custom-add-reserva" // Añadir key única
      onClick={() => router.push('/create-reservas')} // Acción de navegación
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
    <div >
      <List />
    </div>
  );
};

export default Reserva;
