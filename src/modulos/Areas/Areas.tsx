"use client";
import useCrud from "@/mk/hooks/useCrud/useCrud";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import { useEffect, useMemo, useState } from "react";
import RenderForm from "./RenderForm/RenderForm";
import RenderView from "./RenderView/RenderView";
import Button from "@/mk/components/forms/Button/Button";
import MaintenanceModal from "./MaintenanceModal/MaintenanceModal";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import { AreaStatus } from "@/modulos/Payments/Type/PaymentType";

const paramsInitial = {
  perPage: 20,
  page: 1,
  fullType: "L",
  searchBy: "",
  extraData: true,
};
const statusColor: any = {
  A: { color: "var(--cSuccess)", background: "var(--cHoverCompl2)" },
  X: { color: "var(--cError)", background: "var(--cHoverError)" },
};

const Areas = () => {
  const [openMaintenance, setOpenMaintenance] = useState(false);
  const { store, setStore } = useAuth();
  // S45 (D-38-5 round 2): mod literal migrado a async flow.
  // - export: false → kill legacy IconExport (D-38-5).
  // - exportAsync: { type: "areas", ... } → slot async pineado (S36.5
  //   pattern, idéntico a defaultersMod S38.5 + bankAccountsMod S41 +
  //   outlaysMod S43). matchea el AreasReportType pineado en S45 backend.
  // Areas NO usa factory pattern (S37.5/S38.5/S41/S43) porque el mod
  // tiene renderView/renderForm con closures internas (reLoad de useCrud).
  // El cambio es el mínimo: solo `export: true` → `export: false +
  // exportAsync: {...}`. La lógica de renderView/renderForm queda intacta.
  const mod = {
    modulo: "v3/areas",
    singular: "área social",
    plural: "áreas sociales",
    permiso: "areas",
    extraData: false,
    renderView: (props: {
      open: boolean;
      onClose: any;
      item: Record<string, any>;
      reLoad: any;
      setOpenList: any;
      openList: boolean;
      extraData: any;
    }) => <RenderView {...props} />,
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
    export: false,
    exportAsync: {
      type: "areas",
      format: "pdf",
      label: "Exportar PDF",
    },
    filter: true,
  };
  const fields = useMemo(
    () => ({
      id: { rules: [], api: "e" },
      title: {
        rules: ["required"],
        api: "ae",
        label: "Nombre",
        onRender: ({ item }: any) => (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Avatar w={40} h={40} name={item.title} src={item?.images?.[0]} />
            <p style={{ color: "var(--cWhite)", fontWeight: 500 }}>
              {item.title}
            </p>
          </div>
        ),
        list: {
          width: "400px",
        },
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
          width: "120px",
        },
        onRender: (props: any) => {
          let status = "";
          if ((props?.item?.status === AreaStatus.ACTIVE || props?.item?.status === 1 || props?.item?.status === "A")) status = "Activa";
          if ((props?.item?.status === 0 || props?.item?.status === "X")) status = "Inactiva";

          return (
            <StatusBadge
              backgroundColor={statusColor[props?.item?.status]?.background}
              color={statusColor[props?.item?.status]?.color}
            >
              {status}
            </StatusBadge>
          );
        },
        filter: {
          options: () => [
            { id: "ALL", name: "Todos" },
            { id: "A", name: "Activa" },
            { id: "X", name: "Inactiva" },
          ],
        },
      },
    }),
    [],
  );

  const extraButtons = [
    <Button
      variant="secondary"
      key={"Button"}
      onClick={() => setOpenMaintenance(true)}
      style={{
        height: 44,
        padding: "12px 16px",
        fontSize: 15,
        fontWeight: 600,
        color: "#878f9a",
        borderRadius: 12,
        border: "1px solid #d7fff014",
        backgroundColor: "#d7fff005",
        width: "auto",
      }}
    >
      Poner en mantenimiento
    </Button>,
  ];
  const { userCan, List, reLoad, data, extraData } = useCrud({
    paramsInitial,
    mod,
    fields,
    extraButtons,
  });
  useEffect(() => {
    setStore({ ...store, title: "Áreas sociales" });
  }, []);
  if (!userCan(mod.permiso, "R")) return <NotAccess />;
  return (
    <>
      <List
        height={"100%"}
        //   emptyMsg="¡Sin áreas sociales! Una vez registres las diferentes áreas"
        //   emptyLine2="del condominio las verás aquí."
        //   emptyIcon={<IconDepartment2 size={80} color="var(--cWhiteV1)"
        //    />
        // }
      />

      {openMaintenance && (
        <MaintenanceModal
          open={openMaintenance}
          onClose={() => setOpenMaintenance(false)}
          areas={extraData?.areas}
        />
      )}
    </>
  );
};

export default Areas;
