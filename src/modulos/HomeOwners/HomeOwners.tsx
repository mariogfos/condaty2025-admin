"use client";
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import styles from "./HomeOwners.module.css";
import { useMemo, useState, useCallback } from "react";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import KeyValue from "@/mk/components/ui/KeyValue/KeyValue";
import UnlinkModal from "../shared/UnlinkModal/UnlinkModal";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import { WidgetDashCard } from "@/components/Widgets/WidgetsDashboard/WidgetDashCard/WidgetDashCard";
import { IconHomeOwner } from "@/components/layout/icons/IconsBiblioteca";
import ProfileModal from "@/components/ProfileModal/ProfileModal";
import Input from "@/mk/components/forms/Input/Input";
import Select from "@/mk/components/forms/Select/Select";

const paramsInitial = {
  perPage: 20,
  page: 1,
  fullType: "L",
  searchBy: "",
};

const HomeOwners = () => {
  const [unitsModalOpen, setUnitsModalOpen] = useState(false);
  const [selectedHomeowner, setSelectedHomeowner] = useState(null);

  const openUnitsModal = (homeowner: any) => {
    setSelectedHomeowner(homeowner);
    setUnitsModalOpen(true);
  };

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
    modulo: "homeowners",
    singular: "Propietario",
    plural: "Propietarios",
    permiso: "",
    export: true,
    import: true,
    hideActions: {
      edit: true,
      del: true,
    },
    extraData: true,
    renderView: (props: {
      open: boolean;
      onClose: any;
      item: Record<string, any>;
      onConfirm?: Function;
      extraData?: Record<string, any>;
      noWaiting?: boolean;
      reLoad?: any;
    }) => (
      <ProfileModal
        open={props?.open}
        onClose={props?.onClose}
        dataID={props?.item?.id}
        type={"homeOwner"}
        title="Perfil de Propietario"
        reLoad={props?.reLoad}
      />
    ),
    renderDel: (props: {
      open: boolean;
      onClose: any;
      mod: ModCrudType;
      item: Record<string, any>;
      onConfirm?: Function;
      extraData?: Record<string, any>;
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
      "/homeowners",
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
        showToast("El propietario ya existe en este Condominio", "warning");
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
        "El propietario ya existe en Condaty, se va a vincular al Condominio",
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

  const onBlurEmail = useCallback(async (e: any, props: any) => {
    if (
      e.target.value.trim() == "" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.target.value)
    )
      return;

    const { data, error } = await execute(
      "/homeowners",
      "GET",
      {
        fullType: "EXIST",
        type: "email",
        searchBy: e.target.value,
      },
      false,
      true
    );

    if (data?.success && data.data?.data?.id) {
      showToast("El email ya esta en uso", "warning");
      props.setError({ email: "El email ya esta en uso" });
      props.setItem({ ...props.item, email: "" });
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
      dptos: {
        rules: ["required"],
        api: "ae",
        label: "Unidades",
        form: {
          type: "number",
          style: { width: "100%" },
          onRender: (renderProps: {
            item: any;
            onChange: (e: any) => void;
            error?: any;
            extraData?: { dptos?: any[] };
          }) => {
            const dptosOptions = renderProps.extraData?.dptos || [];
            const isLoadingOptions = dptosOptions.length === 0;

            return (
              <div style={{ width: "100%" }}>
                <Select
                  name="dptos"
                  options={dptosOptions}
                  value={renderProps?.item?.dptos}
                  onChange={renderProps.onChange}
                  filter={true}
                  optionLabel="nro"
                  optionValue="id"
                  multiSelect={true}
                  error={renderProps.error}
                  required={true}
                  placeholder={
                    isLoadingOptions
                      ? "Cargando unidades..."
                      : "Selecciona las unidades"
                  }
                  disabled={
                    (isLoadingOptions && !renderProps?.item?.dptos) ||
                    dptosOptions.length === 0
                  }
                />
              </div>
            );
          },
        },
        list: false,
      },
      name: {
        rules: ["required", "alpha"],
        api: "ae",
        label: "Nombre Completo",
        form: {
          type: "text",
          style: { width: "49%" },
          label: "Primer nombre",
          disabled: onDisbled,
          required: true,
        },
        onRender: (item: any) => {
          const propietario = item?.item;
          const nombreCompleto = getFullName(propietario);
          const cedulaIdentidad = propietario?.ci;

          return (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Avatar
                src={getUrlImages(
                  "/HOMEOWNER-" +
                    propietario?.id +
                    ".webp?d=" +
                    propietario?.updated_at
                )}
                name={nombreCompleto}
              />
              <div>
                <p
                  style={{
                    marginBottom: "2px",
                    fontWeight: 500,
                    color: "var(--cWhite, #fafafa)",
                  }}
                >
                  {nombreCompleto}
                </p>
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
              </div>
            </div>
          );
        },
        list: true,
      },
      middle_name: {
        rules: [""],
        api: "ae",
        label: "Segundo nombre",
        form: {
          type: "text",
          style: { width: "49%" },
          disabled: onDisbled,
          required: false,
        },
        list: false,
      },
      last_name: {
        rules: ["required", "alpha"],
        api: "ae",
        label: "Apellido paterno",
        form: {
          type: "text",
          style: { width: "49%" },
          disabled: onDisbled,
          required: true,
        },
        list: false,
      },
      mother_last_name: {
        rules: [""],
        api: "ae",
        label: "Apellido materno",
        form: {
          type: "text",
          style: { width: "49%" },
          disabled: onDisbled,
          required: false,
        },
        list: false,
      },
      ci: {
        rules: ["required", "ci"],
        api: "ae",
        label: "Cédula de identidad",
        form: {
          type: "number",
          onBlur: onBlurCi,
          disabled: onDisbled,
          required: true,
        },
      },
      phone: {
        rules: ["phone", "max:10"],
        api: "ae",
        label: "Teléfono",
        form: {
          type: "number",
          disabled: onDisbled,
        },
      },
      email: {
        rules: ["required", "email"],
        api: "ae",
        label: "Correo electrónico",
        form: {
          type: "email",
          label: "Correo electrónico",
          disabled: onDisbled,
          required: true,
          onRender: (props: any) => {
            return (
              <div className={styles.fieldSet}>
                <div>
                  <div>Información de acceso</div>
                  <div>
                    La contraseña sera enviada al correo que indiques en este
                    campo
                  </div>
                </div>
                <div>
                  <Input
                    name="email"
                    value={props?.item?.email}
                    onChange={props.onChange}
                    label="Correo electrónico"
                    error={props.error}
                    disabled={
                      props?.field?.action === "edit" || onDisbled(props)
                    }
                    required={true}
                    onBlur={(e) => onBlurEmail(e, props)}
                  />
                </div>
              </div>
            );
          },
        },
        list: {},
      },
      unidades: {
        rules: [],
        api: "",
        label: "Cantidad de Unidades",
        list: {
          onRender: (props: any) => {
            const dptosArray = props?.item?.dptos;

            if (Array.isArray(dptosArray) && dptosArray.length > 0) {
              const numerosDeUnidades = dptosArray
                .map((dpto) => dpto?.nro)
                .filter((nro) => nro);

              return numerosDeUnidades.join(", ");
            } else {
              return "Sin unidades";
            }
          },
        },
      },

      status: {
        rules: [""],
        api: "ae",
        label: "Estado",
        form: {
          type: "select",
          onHide: () => {
            return true;
          },
          options: [
            { id: "A", name: "Activo" },
            { id: "X", name: "Inactivo" },
          ],
        },
      },
    };
  }, [onBlurCi]);

  const {
    userCan,
    List,
    setStore,
    onSearch,
    searchs,
    onEdit,
    onDel,
    showToast,
    execute,
    reLoad,
    getExtraData,
    extraData,
    data,
  } = useCrud({
    paramsInitial,
    mod,
    fields,
  });

  if (!userCan(mod.permiso, "R")) return <NotAccess />;
  return (
    <div className={styles.style}>
      <WidgetDashCard
        title="Propietarios Registrados"
        data={data?.message?.total || 0}
        icon={
          <IconHomeOwner
            color={"var(--cWhite)"}
            style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
            circle
            size={38}
          />
        }
        style={{ width: "280px" }}
      />

      <List height={"calc(100vh - 400px)"} />
      <UnitsModal
        open={unitsModalOpen}
        onClose={closeUnitsModal}
        homeowner={selectedHomeowner}
      />
    </div>
  );
};

export default HomeOwners;
