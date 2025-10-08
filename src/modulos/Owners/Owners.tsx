/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import styles from "./Owners.module.css";
import RenderItem from "../shared/RenderItem";
import useCrudUtils from "../shared/useCrudUtils";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import ItemList from "@/mk/components/ui/ItemList/ItemList";
import NotAccess from "@/components/layout/NotAccess/NotAccess";
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import { getFullName, getUrlImages } from "@/mk/utils/string";
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

const paramsInitial = {
  perPage: 20,
  page: 1,
  fullType: "L",
  searchBy: "",
};

const Owners = () => {
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
        <div className={styles.unitsContainer}>
          {homeowner.dptos &&
            homeowner.dptos.map((dpto: any, index: number) => (
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
                  value={dpto.status === "A" ? "Activo" : "Inactivo"}
                />
                {index < homeowner.dptos.length - 1 && (
                  <hr className={styles.unitDivider} />
                )}
              </div>
            ))}
        </div>
      </DataModal>
    );
  };

  const mod: ModCrudType = {
    modulo: "owners",
    singular: "Residente",
    plural: "Residentes",
    filter: true,
    export: true,
    import: false,
    permiso: "",
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
      props?.item.status === "W" && props?.item.type_owner !== "Dependiente" ? (
        <RenderView {...props} />
      ) : (
        <ProfileModal
          open={props?.open}
          onClose={props?.onClose}
          dataID={props?.item?.id}
          type={"owner"}
          title="Perfil de Residente"
          edit={false}
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
      "/owners",
      "GET",
      {
        fullType: "EXIST",
        type: "ci",
        searchBy: e.target.value,
      },
      false,
      true
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
        "warning"
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
              <Avatar
                hasImage={residente?.has_image}
                src={getUrlImages(
                  "/OWNER-" + residente?.id + ".webp?d=" + residente?.updated_at
                )}
                name={nombreCompleto}
              />
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
            return (
              <span
                style={{
                  color:
                    item?.status === "W"
                      ? "var(--cWarning)"
                      : "var(--cWhiteV1)",
                }}
              >
                {item?.status === "W" ? "Por activar" : "Activo"}
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
        list: {},
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
      </div>
      <List
        height={"calc(100vh - 465px)"}
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
