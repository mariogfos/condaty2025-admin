"use client";
import useCrud from "@/mk/hooks/useCrud/useCrud";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import useCrudUtils from "../shared/useCrudUtils";
import { useMemo } from "react";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import {
  getDateStrMes,
  getDateTimeStrMes,
  getDateTimeStrMesShort,
} from "@/mk/utils/date";
import styles from "./Reserva.module.css";
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
  filter: true,
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

  // --- MODIFICACIÓN AQUÍ: Actualizar opciones del filtro ---
  // Define los nuevos estados para el filtro, incluyendo "Todos" con valor vacío
  const getReservaStatusOptions = () => [
    { id: "ALL", name: "Todos" }, // Opción para mostrar todos (envía vacío)
    { id: "W", name: "En espera" },
    { id: "A", name: "Aprobado" },
    { id: "X", name: "Rechazado" },
    { id: "C", name: "Cancelado" },
  ];
  // --- FIN MODIFICACIÓN ---

  const fields = useMemo(
    () => ({
      id: { rules: [], api: "e" },
      area: {
        rules: ["required"],
        api: "ae",
        label: "Área Social",
        form: { type: "text" },
        list: {
          onRender: (props: any) => {
            const area = props?.item?.area;
            const areaName = area?.title;
            const imageUrl = area?.images?.[0]
              ? getUrlImages(
                  `/AREA-${area.images[0].entity_id}-${
                    area.images[0].id
                  }.webp?d=${new Date().toISOString()}`
                )
              : undefined;
            return (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Avatar src={imageUrl} hasImage={2} name={areaName} />
                <p
                  style={{
                    color: "var(--cWhite)",
                    fontWeight: 500,
                    fontSize: 14,
                  }}
                >
                  {areaName || "Área no disponible"}
                </p>
              </div>
            );
          },
        },
      },
      owner: {
        rules: ["required"],
        api: "ae",
        label: "Residente",
        form: { type: "text" },
        list: {
          width: 470,
          onRender: (props: any) => {
            const owner = props?.item?.owner;
            const dpto = props?.item?.dpto;
            const ownerName = owner
              ? getFullName(owner)
              : "Residente no disponible";
            const dptoNro = dpto?.nro ? dpto.nro : "Sin Dpto.";

            const imageUrl = owner
              ? getUrlImages(
                  `/OWNER-${owner.id}.webp?d=${owner.updated_at || Date.now()}`
                )
              : undefined;

            return (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Avatar
                  src={imageUrl}
                  name={ownerName}
                  // hasImage={owner.has_image}
                />
                <div>
                  <p
                    style={{
                      color: "var(--cWhite)",
                      fontWeight: 500,
                      fontSize: 14,
                    }}
                  >
                    {ownerName}
                  </p>
                  {dpto && (
                    <p
                      style={{
                        fontSize: 14,
                        color: "var(--cWhiteV1)",
                      }}
                    >
                      {dptoNro}
                    </p>
                  )}
                  {!owner && dpto && (
                    <p
                      style={{
                        fontSize: 14,
                        color: "var(--cWhiteV1)",
                      }}
                    >
                      {dptoNro}
                    </p>
                  )}
                </div>
              </div>
            );
          },
        },
      },
      created_at: {
        label: "Fecha de solicitud",
        form: false,
        list: {
          width: 246,
          onRender: (props: any) => {
            return getDateTimeStrMes(props?.value);
          },
        },
      },
      date_at: {
        rules: ["required"],
        api: "ae",
        label: "Fecha del evento",
        form: { type: "date" },
        list: {
          width: 246,
          onRender: (props: any) => {
            return (
              <div>
                {getDateStrMes(props?.item?.date_at)}{" "}
                {format(
                  parse(props?.item?.start_time, "HH:mm:ss", new Date()),
                  "H:mm"
                )}
              </div>
            );
          },
        },
      },

      status: {
        rules: ["required"],
        api: "ae",
        label: "Estado",
        // NOTA: Las opciones del 'form' no se pidieron cambiar,
        // pero podrían necesitar ajuste si este campo se edita en algún formulario.
        form: {
          type: "select",
          options: [
            { id: "A", name: "Disponible" },
            { id: "X", name: "No disponible" },
            { id: "M", name: "En mantenimiento" },
          ],
        },
        list: {
          width: 180,
          onRender: (props: any) => {
            const status = props?.item?.status as
              | "W"
              | "A"
              | "X"
              | "C"
              | undefined; // Quitamos N y A (si no aplica a reservas listadas)

            // Mapeo actualizado con los nuevos estados, textos y clases CSS
            const statusMap = {
              W: { label: "Por confirmar", class: styles.statusW }, // En espera
              A: { label: "Reservada", class: styles.statusA }, // Aprobado
              X: { label: "Rechazado", class: styles.statusX }, // Rechazado
              C: { label: "Cancelado", class: styles.statusC }, // Cancelado (Asegúrate de tener styles.statusC)
              // Quitamos N y A (si no aplica a reservas listadas)
            };
            // --- FIN MODIFICACIÓN ---

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
          // Usa la función actualizada para las opciones del filtro
          options: getReservaStatusOptions,
        },
      },
    }),
    []
  );
  const customAddButton = (
    <Button
      key="custom-add-reserva"
      onClick={() => router.push("/create-reservas")}
      variant="primary"
      style={{ height: 48 }}
    >
      Crear Reserva
    </Button>
  );

  const { userCan, List, setStore, onSearch, searchs, onEdit, onDel, data } =
    useCrud({
      paramsInitial,
      mod,
      fields,
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
      <List height={"calc(100vh - 330px)"} />
      {/* Asegúrate de que ReservaModal/RenderView también manejen los nuevos estados si es necesario */}
    </div>
  );
};

export default Reserva;
