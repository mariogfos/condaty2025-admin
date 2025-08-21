"use client";
import styles from "./Guards.module.css";
import RenderItem from "../shared/RenderItem";
import useCrudUtils from "../shared/useCrudUtils";
import { useCallback, useEffect, useMemo, useState } from "react";
import ItemList from "@/mk/components/ui/ItemList/ItemList";
import NotAccess from "@/components/layout/NotAccess/NotAccess";
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import {
  IconGuardShield,
  IconSecurity,
} from "@/components/layout/icons/IconsBiblioteca";
import UnlinkModal from "../shared/UnlinkModal/UnlinkModal";
import ProfileModal from "@/components/ProfileModal/ProfileModal";
import { WidgetDashCard } from "@/components/Widgets/WidgetsDashboard/WidgetDashCard/WidgetDashCard";
import Br from "@/components/Detail/Br";
const paramsInitial = {
  perPage: 20,
  page: 1,
  fullType: "L",
  searchBy: "",
  extraData: true,
};

const Guards = () => {
  const mod: ModCrudType = {
    modulo: "guards",
    singular: "guardia",
    plural: "Guardias",
    filter: true,
    permiso: "",
    export: true,
    titleAdd: "Nuevo",
    //import: true,
    hideActions: {
      edit: true,
      del: true,
    },
    renderView: (props: {
      open: boolean;
      onClose: any;
      item: Record<string, any>;
      onConfirm?: Function;
      extraData?: Record<string, any>;
      reLoad?: any;
    }) => {
      return (
        <ProfileModal
          open={props?.open}
          onClose={props?.onClose}
          dataID={props?.item?.id}
          type={"guard"}
          title="Perfil de guardia"
          reLoad={props?.reLoad}
          titleBack="Volver a lista de guardias"
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
  };

  const onBlurCi = useCallback(async (e: any, props: any) => {
    if (e.target.value.trim() == "") return;
    const { data, error } = await execute(
      "/guards",
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
        showToast("El guardia ya existe en este condominio", "warning");
        props.setItem({});
        props.setError({ ci: " Ese CI ya esta en uso en este condominio." });
        return;
      }
      props.setError({ ci: "" });
      props.setItem({
        ...props.item,
        ci: filteredData.ci,
        name: filteredData.name,
        password: "12345678",
        middle_name: filteredData.middle_name,
        last_name: filteredData.last_name,
        mother_last_name: filteredData.mother_last_name,
        email: filteredData.email ?? "",
        phone: filteredData.phone,
        _disabled: true,
        _emailDisabled: true,
      });
      showToast(
        "El guardia ya existe en condaty, se va a vincular al condominio",
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onBlurEmail = useCallback(async (e: any, props: any) => {
    if (
      e.target.value.trim() == "" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.target.value)
    )
      return;

    const { data, error } = await execute(
      "/guards",
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      avatar: {
        api: "a*e*",
        label: "Suba una Imagen",
        list: false,
        form: {
          type: "imageUpload",
          prefix: "GUARD",
          style: { width: "100%" },
        },
      },
      ci: {
        rules: ["required", "ci"],
        api: "ae",
        label: "Carnet de Identidad",
        form: {
          type: "number",
          disabled: onDisbled,
          onBlur: onBlurCi,
          required: true,
        },
        list: false,
      },
      fullName: {
        // rules: ["required"],
        api: "ae",
        label: "Nombre",
        form: {
          type: "fullName",
          disabled: onDisbled,
        },
        onRender: (item: any) => {
          const guardia = item?.item;
          const nombreCompleto = getFullName(guardia);
          const cedulaIdentidad = guardia?.ci;
          return (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Avatar
                hasImage={guardia?.has_image}
                src={getUrlImages(
                  "/GUARD-" +
                    guardia?.id +
                    ".webp?d=" +
                    (guardia?.updated_at || new Date().toISOString())
                )}
                name={nombreCompleto}
              />
              <div>
                <p
                  style={{
                    marginBottom: "2px",
                    fontWeight: 500,
                    color: "var(--cWhite)",
                  }}
                >
                  {nombreCompleto}
                </p>
                {cedulaIdentidad && (
                  <span
                    style={{
                      fontSize: "14px",
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
      // password: {
      //   rules: ["required*add"],
      //   api: "a",
      //   label: "Contraseña",
      //   form: false,
      //   list: false,
      // },
      name: {
        rules: ["required", "alpha", "max:20"],
        api: "ae",
        label: "Primer nombre",
        form: false,

        list: false,
      },
      middle_name: {
        rules: [""],
        api: "ae",
        label: "Segundo nombre",
        form: false,
        list: false,
      },
      last_name: {
        rules: ["required", "alpha", "max:20"],
        api: "ae",
        label: "Apellido paterno",
        form: false,
        list: false,
      },
      mother_last_name: {
        rules: [""],
        api: "ae",
        label: "Apellido materno",
        form: false,
        list: false,
      },
      email: {
        rules: ["required", "email"],
        api: "a",
        label: "Correo electrónico",

        form: {
          type: "text",
          disabled: onDisbled,
          onBlur: onBlurEmail,
          onTop: () => {
            return (
              <div style={{ width: "100%" }}>
                <Br style={{ marginBottom: "12px" }} />
                <p>
                  La contraseña será enviada al correo que indiques en este
                  campo
                </p>
              </div>
            );
          },
        },
        list: true,
      },
      phone: {
        rules: ["number", "max:10"],
        api: "ae",
        label: "Celular",
        form: { type: "number", disabled: onDisbled },
        list: {},
      },

      address: {
        rules: [""],
        api: "ae",
        label: "Dirección del domicilio",
        form: {
          type: "textArea",
          // disabled: onDisbled,
        },
        list: {},
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    errors,
    showToast,
    execute,
    reLoad,
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
  console.log(errors);
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
          title="Guardias totales"
          data={String(data?.message?.total || 0)}
          icon={
            <IconGuardShield
              color={
                !data?.message?.total || data?.message?.total === 0
                  ? "var(--cWhiteV1)"
                  : "#B382D9"
              }
              style={{
                backgroundColor:
                  !data?.message?.total || data?.message?.total === 0
                    ? "var(--cHover)"
                    : "rgba(179, 130, 217, 0.1)",
              }}
              circle
              size={18}
            />
          }
          style={{ width: "280px" }}
        />
      </div>
      <List
        onTabletRow={renderItem}
        height={"calc(100vh - 430px)"}
        emptyMsg="Lista de guardias vacía. Aquí verás a todos los guardias"
        emptyLine2="del condominio una vez los registres."
        emptyIcon={<IconSecurity size={80} color="var(--cWhiteV1)" />}
      />
    </div>
  );
};

export default Guards;
