/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import styles from "./Guards.module.css";
import RenderItem from "../shared/RenderItem";
import useCrudUtils from "../shared/useCrudUtils";
import { useCallback, useEffect, useMemo, useState } from "react";
import ItemList from "@/mk/components/ui/ItemList/ItemList";
import NotAccess from "@/components/layout/NotAccess/NotAccess";
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import {
  IconAccess,
  IconAdd,
  IconGuardShield,
  IconSecurity,
} from "@/components/layout/icons/IconsBiblioteca";
import Input from "@/mk/components/forms/Input/Input";
import InputPassword from "@/mk/components/forms/InputPassword/InputPassword";
import RenderView from "./RenderView/RenderView";
import UnlinkModal from "../shared/UnlinkModal/UnlinkModal";
import ProfileModal from "@/components/ProfileModal/ProfileModal";
import { WidgetDashCard } from "@/components/Widgets/WidgetsDashboard/WidgetDashCard/WidgetDashCard";

const paramsInitial = {
  perPage: 20,
  page: 1,
  fullType: "L",
  searchBy: "",
};

const Guards = () => {
  const mod: ModCrudType = {
    modulo: "guards",
    singular: "Guardia",
    plural: "Guardias",
    filter: true,
    permiso: "",
    export: true,
    import: true,
    hideActions: {
      edit: true,
      del: true,
    },
    // noWaiting: true,
    // import: true,
    renderView: (props: {
      open: boolean;
      onClose: any;
      item: Record<string, any>;
      onConfirm?: Function;
      extraData?: Record<string, any>;
      reLoad?: any;
      // noWaiting?: boolean;
    }) => {
      return (
        <ProfileModal
          open={props?.open}
          onClose={props?.onClose}
          dataID={props?.item?.id}
          type={"guard"}
          title="Perfil de Guardia"
          reLoad={props?.reLoad}
        />
      );
    },
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
    // renderForm: (props: {
    //   item: any;
    //   setItem: any;
    //   extraData: any;
    //   open: boolean;
    //   onClose: any;
    //   user: any;
    //   execute: any;
    // }) => <RenderForm {...props} />,
    // extraData: true,
    // hideActions: { add: true },
  };

  const onBlurCi = useCallback(async (e: any, props: any) => {
    if (e.target.value.trim() == "") return;
    const { data, error } = await execute(
      "/guards",
      "GET",
      {
        _exist: 1,
        ci: e.target.value,
      },
      false,
      true
    );

    if (data?.success && data?.data?.length > 0) {
      const filteredData = data.data;
      props.setItem({
        ...props.item,
        ci: filteredData[0].ci,
        name: filteredData[0].name,
        middle_name: filteredData[0].middle_name,
        last_name: filteredData[0].last_name,
        mother_last_name: filteredData[0].mother_last_name,
        email: filteredData[0].email,
        phone: filteredData[0].phone,
        _disabled: true,
      });
      showToast(
        "El residente ya existe en Condaty, se va a vincular al Condominio",
        "warning"
      );
    } else {
      props.setItem({
        ...props.item,
        _disabled: false,
      });
      //no existe
    }
  }, []);
  const onDisbled = ({ item }: any) => {
    return item._disabled;
  };
  const fields = useMemo(() => {
    return {
      id: { rules: [], api: "e" },

      fullName: {
        // rules: ["required"],
        api: "ae",
        label: "Nombre del guardia",
        form: false,
        onRender: (item: any) => {
          // Asegúrate que 'item.item' contiene los datos del residente
          const guardia = item?.item;
          const nombreCompleto = getFullName(guardia);
          const cedulaIdentidad = guardia?.ci; // Obtener el CI

          return (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Avatar
                src={getUrlImages(
                  "/GUARD-" +
                    guardia?.id + // Usar residente?.id
                    ".webp?d=" +
                    guardia?.updated_at // Usar residente?.updated_at
                )}
                name={nombreCompleto} // Usar nombreCompleto
              />
              <div>
                {" "}
                {/* Contenedor para Nombre, CI y Estado Admin */}
                {/* Nombre */}
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
              </div>
            </div>
          );
        },

        list: true,
      },
      avatar: {
        api: "a*e*",
        label: "Suba una Imagen",
        list: false,
        form: {
          type: "imageUpload",
          prefix: "GUARD",
          style: { width: "100%" },
          // onRigth: rigthAvatar,
        },
      },
      password: {
        rules: ["_disabled_", "required*add"],
        api: "a",
        label: "Contraseña",
        form: false,
        list: false,
      },
      ci: {
        rules: ["required*add"],
        api: "a",
        label: "Cédula de identidad",
        // form: { type: "text", disabled: true, label: "2222" },
        form: {
          type: "number",
          label: "Cédula de identidad",
          onRender: (props: any) => {
            // console.log(props, "propsval");
            return (
              <fieldset className={styles.fieldSet}>
                <div>
                  <div>Información de acceso</div>
                  <div>
                    Ingrese el número de carnet y haga click fuera del campo
                    para que el sistema busque automáticamente al guardia si el
                    carnet no existe ,continúa con el proceso de registro
                  </div>
                </div>
                <div>
                  <Input
                    name="ci"
                    value={props?.item?.ci}
                    onChange={props.onChange}
                    label="Carnet de Identidad"
                    error={props.error}
                    disabled={props?.field?.action === "edit"}
                    onBlur={(e: any) => onBlurCi(e, props)}
                  />
                  {props?.field?.action === "add" && !props.item._disabled && (
                    <InputPassword
                      name="password"
                      value={props?.item?.password}
                      onChange={props.onChange}
                      label="Contraseña"
                      error={props.error}
                    />
                  )}
                </div>
              </fieldset>
            );
          },
        },

        list: false,
      },
      name: {
        rules: ["required"],
        api: "ae",
        label: "Primer nombre",
        form: {
          type: "text",
          style: { width: "49%" },
          disabled: onDisbled,
        },

        list: false,
      },
      middle_name: {
        rules: [""],
        api: "ae",
        label: "Segundo nombre",
        form: { type: "text", style: { maxWidth: "49%" }, disabled: onDisbled },
        list: false,
      },
      last_name: {
        rules: ["required"],
        api: "ae",
        label: "Apellido paterno",
        form: { type: "text", style: { width: "49%" }, disabled: onDisbled },
        list: false,
      },
      mother_last_name: {
        rules: [""],
        api: "ae",
        label: "Apellido materno",
        form: { type: "text", style: { width: "49%" }, disabled: onDisbled },
        list: false,
      },
      phone: {
        api: "ae",
        label: "Celular",
        form: { type: "text", disabled: onDisbled },
        list: false,
      },
      email: {
        rules: ["required", "email"],
        api: "ae",
        label: "Correo electrónico",
        form: {
          type: "text",
          disabled: onDisbled,
        },
        list: {},
      },

      address: {
        rules: [""],
        api: "ae",
        label: "Domicilio",
        form: {
          type: "text",
          disabled: onDisbled,
        },
        list: {},
      },
    };
  }, []);

  const onImport = () => {
    setOpenImport(true);
  };

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
    data,
  } = useCrud({
    paramsInitial,
    mod,
    fields,
    _onImport: onImport,
  });
  const { onLongPress, selItem, searchState, setSearchState } = useCrudUtils({
    onSearch,
    searchs,
    setStore,
    mod,
    onEdit,
    onDel,
  });

  const [openImport, setOpenImport] = useState(false);
  useEffect(() => {
    setOpenImport(searchState == 3);
  }, [searchState]);

  const renderItem = (
    item: Record<string, any>,
    i: number,
    onClick: Function
  ) => {
    return (
      <RenderItem item={item} onClick={onClick} onLongPress={onLongPress}>
        <ItemList
          title={item?.name}
          subtitle={item?.description}
          variant="V1"
          active={selItem && selItem.id == item.id}
        />
      </RenderItem>
    );
  };

  if (!userCan(mod.permiso, "R")) return <NotAccess />;
  return (
    <div className={styles.users}>
      <div style={{ marginBottom: "20px" }}>
        <WidgetDashCard
          title="Total de Guardias"
          data={String(data?.message?.total || 0)}
          icon={
            <IconGuardShield
              color={"#B382D9"}
              style={{ backgroundColor: "rgba(179, 130, 217, 0.1)" }}
              circle
              size={38}
            />
          }
          style={{ width: "280px" }}
          // className={styles.widgetResumeCard}
        />
      </div>
      <List onTabletRow={renderItem} />
    </div>
  );
};

export default Guards;
