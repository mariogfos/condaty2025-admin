/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import styles from "./Owners.module.css";
import useCrudUtils from "../shared/useCrudUtils";
import React, { useCallback, useMemo, useState } from "react";
import NotAccess from "@/components/layout/NotAccess/NotAccess";
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import { getFullName } from "@/mk/utils/string";
import { lStatusActive } from "@/mk/utils/utils";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import UnlinkModal from "../shared/UnlinkModal/UnlinkModal";
import {
  IconHome,
  IconHomePerson,
  IconHomePerson2,
  IconOwner,
} from "@/components/layout/icons/IconsBiblioteca";
import { WidgetDashCard } from "@/components/Widgets/WidgetsDashboard/WidgetDashCard/WidgetDashCard";
import KeyValue from "@/mk/components/ui/KeyValue/KeyValue";
import ProfileModal from "@/components/ProfileModal/ProfileModal";
import Select from "@/mk/components/forms/Select/Select";
import RenderForm from "../Owners/RenderForm/RenderForm";
import ActiveOwner from "@/components/ActiveOwner/ActiveOwner";
import RenderView from "./RenderView/RenderView";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { DptoStatus, OwnerStatus } from "@/modulos/Payments/Type/PaymentType";

const paramsInitial = {
  perPage: 20,
  page: 1,
  fullType: "L",
  searchBy: "",
};
const Owners = () => {
  const { user } = useAuth();
  const [unitsModalOpen, setUnitsModalOpen] = useState(false);
  const [selectedHomeowner, setSelectedHomeowner] = useState(null);

  const getTypefilter = () => [
    { id: "ALL", name: "Todos" },
    { id: "D", name: "Dependientes" },
    { id: "T", name: "Residentes" },
    { id: "H", name: "Propietarios" },
  ];

  const closeUnitsModal = () => {
    setUnitsModalOpen(false);
    setSelectedHomeowner(null);
  };

  const UnitsModal = ({
    open,
    onClose,
    homeowner,
  }: {
    open: boolean;
    onClose: () => void;
    homeowner: any;
  }) => {
    if (!homeowner) return null;

    return (
      <DataModal
        open={open}
        onClose={onClose}
        title={`Unidades de ${getFullName(homeowner)}`}
        buttonText=""
      >
        {/*
          🔴 2026-08-06: leía `dptos`, que trae sólo las unidades donde la
          persona es TITULAR. Un dependiente abría este modal y lo veía
          vacío, aunque su perfil mostrara el domicilio — porque el perfil
          leía otra relación. `unidades` lo arma `UnidadesDeLaPersona` en el
          back, con la misma regla que el reporte y que el perfil.
        */}
        <div className={styles.unitsContainer}>
          {homeowner.unidades &&
            homeowner.unidades.map((dpto: any, index: number) => (
              <div key={dpto.id} className={styles.unitCard}>
                <KeyValue title="Nro" value={dpto.nro} />
                <KeyValue title="Descripción" value={dpto.description} />
                <KeyValue title="Dimensión" value={`${dpto.dimension} m²`} />
                <KeyValue
                  title="Monto de gastos"
                  value={`$${dpto.expense_amount}`}
                />
                <KeyValue
                  title="Estado"
                  value={
                    dpto.status === DptoStatus.ACTIVE ? "Activo" : "Inactivo"
                  }
                />
                {index < homeowner.unidades.length - 1 && (
                  <hr className={styles.unitDivider} />
                )}
              </div>
            ))}
        </div>
      </DataModal>
    );
  };

  const mod: ModCrudType = {
    modulo: "v3/owners",
    singular: "Residente",
    plural: "Residentes",
    filter: true,
    // S61.5 (HALLAZGO-NEW-61): migrado al slot async S36.5.
    // - export: false → kill legacy IconExport (D-38-5 round 12 frontend).
    // - auto-pasa filterBy+searchBy del store actual (useCrud S36.5 D-36.5-2).
    export: false,
    exportAsync: {
      type: "owners",
      format: "pdf",
      label: "Exportar",
      // 🔴 `supportedFormats` y `endpoint` son UNA sola cosa: el interruptor
      // de la migración. Van juntos o no va ninguno.
      //
      // `useCrud` elige el botón mirando SÓLO `supportedFormats`: con el
      // array pineá el `DownloadButton` (ícono + menú PDF/XLSX/CSV) y le pasa
      // el `endpoint`; sin el array cae al `AsyncExportButton` legacy —dos
      // botones, "Exportar PDF" y "Historial"— que **no recibe `endpoint`
      // como prop**. O sea que sin esta línea el `endpoint` de abajo no se
      // ignora un poco: no llega nunca, y el export se va por
      // `POST /v3/reports/owners/export` al ReportType que ya no existe.
      //
      // Los tres formatos salen de `OwnersExportConfig::supportedFormats()`.
      supportedFormats: ["pdf", "xlsx", "csv"],
      // Fase 6 (2026-08-05): con `endpoint` el export sale por la LISTA
      // (`GET {endpoint}?_export={format}` → OwnersExportConfig → mPDF), así
      // que el reporte muestra exactamente los residentes que hay en
      // pantalla, con los mismos filtros.
      endpoint: "/v3/owners", // sin `/api/`: API_BASE_URL ya lo trae.
    },
    import: false,
    permiso: "owners",
    hideActions: {
      edit: true,
      del: true,
    },
    extraData: true,
    renderForm: (props: any) => <RenderForm {...props} />,
    renderView: (props: {
      open: boolean;
      onClose: any;
      item: Record<string, any>;
      onConfirm?: Function;
      extraData?: Record<string, any>;
      reLoad?: any;
    }) =>
      props?.item.status === OwnerStatus.WAITING &&
      props?.item.type_owner !== "Dependiente" ? (
        <RenderView {...props} />
      ) : (
        <ProfileModal
          open={props?.open}
          onClose={props?.onClose}
          dataID={props?.item?.id}
          type={"owner"}
          title="Perfil de Residente"
          edit={user?.fosrole_id ? true : false}
          reLoad={props?.reLoad}
        />
      ),
    renderDel: (props: {
      open: boolean;
      onClose: any;
      item: Record<string, any>;
    }) => {
      return (
        <UnlinkModal
          open={props.open}
          onClose={props.onClose}
          mod={mod}
          item={props.item}
          reLoad={reLoad}
        />
      );
    },
  };
  const onBlurCi = useCallback(async (e: any, props: any) => {
    if (e.target.value.trim() == "") return;
    const { data, error } = await execute(
      "/v3/owners",
      "GET",
      {
        fullType: "EXIST",
        type: "ci",
        searchBy: e.target.value,
      },
      false,
      true,
    );

    if (data?.success && data.data?.data?.id) {
      const filteredData = data.data.data;
      if (filteredData.existCondo) {
        showToast("El residente ya existe en este Condominio", "warning");
        props.setItem({});
        props.setError({ ci: "Ese CI ya esta en uso en este Condominio" });
        return;
      }
      props.setError({ ci: "" });
      props.setItem({
        ...props.item,
        ci: filteredData.ci,
        name: filteredData.name,
        middle_name: filteredData.middle_name,
        last_name: filteredData.last_name,
        mother_last_name: filteredData.mother_last_name,
        email: filteredData.email ?? "",
        phone: filteredData.phone,
        _disabled: true,
        _emailDisabled: true,
      });
      showToast(
        "El residente ya existe en Condaty, se va a vincular al Condominio",
        "warning",
      );
    } else {
      props.setError({ ci: "" });
      props.setItem({
        ...props.item,
        _disabled: false,
        _emailDisabled: false,
      });
    }
  }, []);

  const onDisbled = ({ item, field }: any) => {
    if (field?.name === "email") {
      return item._emailDisabled;
    }
    return item._disabled;
  };
  const fields = useMemo(() => {
    return {
      id: { rules: [], api: "e" },
      ci: {
        rules: ["required", "ci"],
        api: "ae",
        label: "Carnet de identidad",
        form: {
          type: "text",
          onBlur: onBlurCi,
          disabled: onDisbled,
          required: true,
        },
        list: false,
      },

      fullName: {
        api: "ae",
        label: "Nombre",
        form: false,
        onRender: (item: any) => {
          const residente = item?.item;
          const nombreCompleto = getFullName(residente);
          const cedulaIdentidad = residente?.ci;

          return (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Avatar src={residente?.url_avatar} name={nombreCompleto} />
              <div>
                {" "}
                <p
                  style={{
                    marginBottom: "2px",
                    fontWeight: 500,
                    color: "var(--cWhite, #fafafa)",
                  }}
                >
                  {nombreCompleto}
                </p>
                {/* CI (si existe) */}
                {cedulaIdentidad && (
                  <span
                    style={{
                      fontSize: "11px",
                      color: "var(--cWhiteV1, #a7a7a7)",
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    CI: {cedulaIdentidad}
                  </span>
                )}
                {/* Estado de Administrador Principal (si aplica) */}
                {residente?.is_main == "M" && (
                  <span
                    style={{
                      color: "var(--cSuccess)",
                      fontSize: 10,
                      backgroundColor: "#00af900D",
                      padding: "2px 4px",
                      borderRadius: 4,
                      display: "inline-block",
                    }}
                  >
                    Administrador principal
                  </span>
                )}
              </div>
            </div>
          );
        },
        list: true,
      },

      name: {
        openTag: { style: { display: "flex" } },
        rules: ["required", "alpha"],
        api: "ae",
        label: "Primer nombre",
        form: {
          type: "text",
          disabled: onDisbled,
          required: true,
        },
        list: false,
      },
      middle_name: {
        closeTag: true,
        rules: [],
        api: "ae",
        label: "Segundo nombre",
        form: {
          type: "text",
          disabled: onDisbled,
        },
        list: false,
      },
      last_name: {
        openTag: {
          style: {
            display: "flex",
          },
        },
        rules: ["required", "alpha"],
        api: "ae",
        label: "Apellido paterno",
        form: {
          type: "text",
          disabled: onDisbled,
          required: true,
        },
        list: false,
      },
      mother_last_name: {
        closeTag: true,
        rules: [""],
        api: "ae",
        label: "Apellido materno",
        form: {
          type: "text",
          disabled: onDisbled,
        },
        list: false,
      },
      type_owner: {
        rules: [""],
        api: "",
        label: "Tipo",
        list: {},
        filter: {
          label: "Tipo",
          width: "180px",

          options: getTypefilter,
        },
      },
      status: {
        rules: [""],
        api: "",
        label: "Estado",
        list: {
          onRender: ({ item }: any) => {
            const statusInfo = lStatusActive[item?.status];
            return (
              <span
                style={{
                  color:
                    item?.status === OwnerStatus.WAITING
                      ? "var(--cWarning)"
                      : "var(--cWhiteV1)",
                }}
              >
                {statusInfo?.name || "Desconocido"}
              </span>
            );
          },
        },
      },

      email: {
        rules: ["required", "email"],
        api: "a",
        label: "Correo electrónico",
        list: {},
      },
      phone: {
        rules: ["number", "max:10"],
        api: "ae",
        label: "Celular",
        form: {
          type: "text",
          disabled: onDisbled,
        },
        list: {
          onRender: ({ item }: any) => {
            return item?.phone || "-/-";
          },
        },
      },
    };
  }, []);

  const {
    userCan,
    List,
    setStore,
    onSearch,
    searchs,
    onEdit,
    onDel,
    reLoad,
    showToast,
    execute,
    data,
    extraData,
  } = useCrud({
    paramsInitial,
    mod,
    fields,
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
    <div className={styles.style}>
      <div style={{ display: "flex", gap: "12px" }}>
        {/*         <WidgetDashCard
          title="Residentes Totales"
          data={String(extraData?.totals ?? 0)}
          style={{ maxWidth: "250px" }}
          icon={
            <IconHomePerson2
              color={
                !extraData?.totals || extraData?.totals === 0
                  ? "var(--cWhiteV1)"
                  : "var(--cWhite)"
              }
              style={{
                backgroundColor:
                  !extraData?.totals || extraData?.totals === 0
                    ? "var(--cHover)"
                    : "var(--cHoverCompl1)",
              }}
              circle
              size={18}
            />
          }
        /> */}

        <WidgetDashCard
          title="Propietarios"
          data={String(extraData?.homeowners ?? extraData?.owners ?? 0)}
          style={{ maxWidth: "250px" }}
          icon={
            <IconOwner
              color={
                !extraData?.homeowners || (extraData?.homeowners ?? 0) === 0
                  ? "var(--cWhiteV1)"
                  : "var(--cSuccess)"
              }
              style={{
                backgroundColor:
                  !extraData?.homeowners || (extraData?.homeowners ?? 0) === 0
                    ? "var(--cHover)"
                    : "var(--cHoverCompl2)",
              }}
              circle
              size={18}
            />
          }
        />

        <WidgetDashCard
          title="Residentes"
          data={String(extraData?.tenants ?? 0)}
          style={{ maxWidth: "250px" }}
          icon={
            <IconHomePerson
              color={
                !extraData?.tenants || extraData?.tenants === 0
                  ? "var(--cWhiteV1)"
                  : "var(--cInfo)"
              }
              style={{
                backgroundColor:
                  !extraData?.tenants || extraData?.tenants === 0
                    ? "var(--cHover)"
                    : "var(--cHoverCompl3)",
              }}
              circle
              size={18}
            />
          }
        />

        <WidgetDashCard
          title="Dependientes"
          data={String(extraData?.dependents ?? 0)}
          style={{ maxWidth: "250px" }}
          icon={
            <IconHomePerson
              color={
                !extraData?.dependents || extraData?.dependents === 0
                  ? "var(--cWhiteV1)"
                  : "var(--cWarning)"
              }
              style={{
                backgroundColor:
                  !extraData?.dependents || extraData?.dependents === 0
                    ? "var(--cHover)"
                    : "var(--cHoverCompl4)",
              }}
              circle
              size={18}
            />
          }
        />

        <WidgetDashCard
          title="Por activar"
          data={String(extraData?.pendingOwnersCount ?? 0)}
          style={{ maxWidth: "250px" }}
          icon={
            <IconHomePerson
              color={"var(--cWhite)"}
              style={{
                backgroundColor: "var(--cHover)",
              }}
              circle
              size={18}
            />
          }
        />
      </div>
      <List
        height={"100%"}
        emptyMsg="Lista de residentes vacía. Aquí verás a todos los residentes"
        emptyLine2="del condominio una vez los registres."
        emptyIcon={<IconHomePerson2 size={80} color="var(--cWhiteV1)" />}
      />
      <UnitsModal
        open={unitsModalOpen}
        onClose={closeUnitsModal}
        homeowner={selectedHomeowner}
      />
    </div>
  );
};
export default Owners;
