"use client";
import useCrud from "@/mk/hooks/useCrud/useCrud";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import { useMemo, useState } from "react";
import { useAuth } from "@/mk/contexts/AuthProvider";
import RenderForm from "./RenderForm/RenderForm";
import RenderView from "./RenderView/RenderView";
import Button from "@/mk/components/forms/Button/Button";
import MaintenanceModal from "./MaintenanceModal/MaintenanceModal";

const paramsInitial = {
  perPage: 20,
  page: 1,
  fullType: "L",
  searchBy: "",
};

const Areas = () => {
  const [openMaintenance, setOpenMaintenance] = useState(false);
  const mod = {
    modulo: "areas",
    singular: "área social",
    plural: "áreas sociales",
    permiso: "",
    extraData: false,
    //   hideActions: { edit: true, del: true, add: true },
    renderView: (props: {
      open: boolean;
      onClose: any;
      item: Record<string, any>;
      setOpenList: any;
      openList: boolean;
      extraData: any;
    }) => <RenderView {...props} />,
    // loadView: { fullType: "DET" },
    renderForm: (props: {
      item: any;
      setItem: any;
      errors: any;
      extraData: any;
      open: boolean;
      onClose: any;
      user: any;
      execute: any;
      setErrors: any;
      action: any;
      openList: any;
      setOpenList: any;
    }) => {
      return (
        <RenderForm
          onClose={props.onClose}
          open={props.open}
          item={props.item}
          setItem={props.setItem}
          errors={props.errors}
          extraData={props.extraData}
          user={props.user}
          execute={props.execute}
          setErrors={props.setErrors}
          reLoad={reLoad}
          action={props.action}
          openList={props.openList}
          setOpenList={props.setOpenList}
        />
      );
    },
    export: true,
    filter: true,
  };
  const fields = useMemo(
    () => ({
      id: { rules: [], api: "e" },
      title: {
        rules: ["required"],
        api: "ae",
        label: "Nombre",
        list: true,
        form: { type: "text" },
      },
      description: {
        rules: ["required"],
        api: "ae",
        label: "Descripción",
        list: true,
        form: { type: "text" },
      },
      max_capacity: {
        rules: ["required"],
        api: "ae",
        label: "Capacidad máxima",
        list: false,
        form: { type: "number" },
      },
      available_days: {
        rules: ["required"],
        api: "ae",
        label: "Días disponibles",
        list: false,
        form: { type: "text" },
      },
      available_hours: {
        rules: ["required"],
        api: "ae",
        label: "Horarios disponibles",
        list: false,
        form: { type: "text" },
      },
      booking_mode: {
        rules: ["required"],
        api: "ae",
        label: "Modo de reserva",
        list: false,
        form: { type: "text" },
      },
      price: {
        rules: ["required"],
        api: "ae",
        label: "Precio",
        list: false,
        form: { type: "number" },
      },
      is_free: {
        rules: ["required"],
        api: "ae",
        label: "Gratis",
        list: false,
        form: { type: "text" },
      },
      max_booking_duration: {
        rules: ["required"],
        api: "ae",
        label: "Duración máxima de reserva",
        list: false,
        form: { type: "number" },
      },
      special_restrictions: {
        rules: ["required"],
        api: "ae",
        label: "Restricciones especiales",
        list: false,
        form: { type: "text" },
      },
      usage_rules: {
        rules: ["required"],
        api: "ae",
        label: "Reglas de uso",
        list: false,
        form: { type: "text" },
      },
      max_reservations_per_day: {
        rules: ["required"],
        api: "ae",
        label: "Máximo de reservas por día",
        list: false,
        form: { type: "number" },
      },
      max_reservations_per_week: {
        rules: ["required"],
        api: "ae",
        label: "Máximo de reservas por semana",
        list: false,
        form: { type: "number" },
      },
      penalty_or_debt_restriction: {
        rules: ["required"],
        api: "ae",
        label: "Restricción de penalización o deuda",
        list: false,
        form: { type: "text" },
      },
      requires_approval: {
        rules: ["required"],
        api: "ae",
        label: "Requiere aprobación",
        list: false,
        form: { type: "text" },
      },
      approval_response_hours: {
        rules: ["required"],
        api: "ae",
        label: "Horas de respuesta de aprobación",
        list: false,
        form: { type: "number" },
      },
      auto_approval_available: {
        rules: ["required"],
        api: "ae",
        label: "Aprobación automática disponible",
        list: false,
        form: { type: "text" },
      },
      cancellable: {
        rules: ["required"],
        api: "ae",
        label: "Cancelable",
        list: false,
        form: { type: "text" },
      },
      min_cancel_hours: {
        rules: ["required"],
        api: "ae",
        label: "Mínimo de horas para cancelar",
        list: false,
        form: { type: "number" },
      },
      late_cancellation_penalty: {
        rules: ["required"],
        api: "ae",
        label: "Penalización por cancelación tardía",
        list: false,
        form: { type: "text" },
      },
      cancellation_policy: {
        rules: ["required"],
        api: "ae",
        label: "Política de cancelación",
        list: false,
        form: { type: "text" },
      },
      penalty_fee: {
        rules: ["required"],
        api: "ae",
        label: "Tarifa de penalización",
        list: false,
        form: { type: "number" },
      },
      enable_survey: {
        rules: ["required"],
        api: "ae",
        label: "Habilitar encuesta",
        list: false,
        form: { type: "text" },
      },
      survey_template: {
        rules: ["required"],
        api: "ae",
        label: "Plantilla de encuesta",
        list: false,
        form: { type: "text" },
      },
      show_in_calendar: {
        rules: ["required"],
        api: "ae",
        label: "Mostrar en calendario",
        list: false,
        form: { type: "text" },
      },
      show_real_time_availability: {
        rules: ["required"],
        api: "ae",
        label: "Mostrar disponibilidad en tiempo real",
        list: false,
        form: { type: "text" },
      },
      status: {
        rules: [""],
        api: "",
        label: "Estado",
        list: {
          width: "220px",
        },
        onRender: (props: any) => {
          let status = "";
          if (props?.item?.status === "A") status = "Activa";
          if (props?.item?.status === "X") status = "Inactiva";
          if (props?.item?.status === "M") status = "En mantenimiento";

          return status;
        },
      },
    }),
    []
  );

  const extraButtons = [
    <Button
      variant="secondary"
      key={"Button"}
      onClick={() => setOpenMaintenance(true)}
    >
      Poner en mantenimiento
    </Button>,
  ];
  const { userCan, List, reLoad, data } = useCrud({
    paramsInitial,
    mod,
    fields,
    extraButtons,
  });

  if (!userCan(mod.permiso, "R")) return <NotAccess />;
  return (
    <div
    //  className={styles.style}
    >
      <List />
      {openMaintenance && (
        <MaintenanceModal
          open={openMaintenance}
          onClose={() => setOpenMaintenance(false)}
          areas={data?.data}
        />
      )}
    </div>
  );
};

export default Areas;
