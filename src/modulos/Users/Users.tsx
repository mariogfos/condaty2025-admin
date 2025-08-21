"use client";
import styles from "./Users.module.css";
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
  IconAdmin,
  IconPersonElegant,
} from "@/components/layout/icons/IconsBiblioteca";
import UnlinkModal from "../shared/UnlinkModal/UnlinkModal";
import { WidgetDashCard } from "@/components/Widgets/WidgetsDashboard/WidgetDashCard/WidgetDashCard";
import ProfileModal from "@/components/ProfileModal/ProfileModal";
import Br from "@/components/Detail/Br";

const paramsInitial = {
  perPage: 20,
  page: 1,
  fullType: "L",
  searchBy: "",
};

const Users = () => {
  const { user, userCan } = useAuth();
  const mod: ModCrudType = {
    modulo: "users",
    singular: "personal",
    plural: "personal administrativo",
    filter: true,
    permiso: "",
    export: true,
    titleAdd: "Nuevo",
    // import: true,
    // search: { hide: true },
    hideActions: {
      edit: true,
      del: true,
      add: !userCan("users", "C"),
    },
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
        type={"admin"}
        title="Perfil de "
        titleBack="Volver a lista de personal administrativo"
        reLoad={reLoad}
        del={user.id === props?.item?.id ? false : true}
        edit={user.id === props?.item?.id ? false : true}
      />
    ),
    renderDel: (props: {
      open: boolean;
      onClose: any;
      mod: ModCrudType;
      item: Record<string, any>;
      onConfirm?: Function;
      extraData?: Record<string, any>;
      onDel: Function;
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

    extraData: true,
  };
  const onBlurEmail = useCallback(async (e: any, props: any) => {
    if (
      e.target.value.trim() == "" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.target.value)
    )
      return;

    const { data, error } = await execute(
      "/users",
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

  const onBlurCi = useCallback(async (e: any, props: any) => {
    if (e.target.value.trim() == "") return;
    const { data, error } = await execute(
      "/users",
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
        showToast("El administrador ya existe en este Condominio", "warning");
        props.setItem({});
        props.setError({ ci: "Ese CI ya esta en uso en este condominio" });
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
        "El administrador ya existe en Condaty, se va a vincular al Condominio",
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

  const onDisbled = ({ item, field }: any) => {
    if (field?.name === "email") {
      return item._emailDisabled;
    }
    return item._disabled;
  };

  const getListRoles = (extraData: any) => {
    const roles = extraData?.roles?.map((item: any) => {
      return {
        name: item.name,
        id: item.id,
      };
    });
    if (roles?.length) {
      return [
        {
          name: "Todos",
          id: "ALL",
        },
        ...roles,
      ];
    }
    return [];
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
          prefix: "ADM",
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
      role_id: {
        rules: ["required"],
        api: "ae",
        label: "Rol",
        form: {
          type: "select",
          optionsExtra: "roles",
          optionLabel: "name",
          optionValue: "id",
          required: true,
        },
        filter: {
          label: "Rol",
          width: "150px",

          options: getListRoles,
        },
      },
      fullName: {
        // rules: [],
        api: "",
        label: "Nombre ",
        form: {
          type: "fullName",
          disabled: onDisbled,
        },
        list: {
          onRender: (item: any) => {
            const administrador = item?.item;
            const nombreCompleto = getFullName(administrador);
            const cedulaIdentidad = administrador?.ci;

            return (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Avatar
                  hasImage={1}
                  src={getUrlImages(
                    "/ADM-" +
                      administrador?.id +
                      ".webp?d=" +
                      administrador?.updated_at
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
                        fontSize: "11px",
                        color: "var(--cWhiteV1)",
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
        },
      },

      name: {
        rules: ["required", "max:50", "alpha", "noSpaces"],
        api: "ae",
        label: "Primer nombre",
        form: false,

        list: false,
      },
      middle_name: {
        rules: ["alpha"],
        api: "ae",
        label: "Segundo nombre",
        form: false,
        list: false,
      },
      last_name: {
        rules: ["required", "max:50", "alpha"],
        api: "ae",
        label: "Apellido paterno",
        form: false,
        list: false,
      },
      mother_last_name: {
        rules: ["alpha"],
        api: "ae",
        label: "Apellido materno",
        form: false,
        list: false,
      },

      rol: {
        rules: [""],
        api: "",
        label: "Rol",
        form: false,
        list: {
          onRender: (props: any) => {
            const role = props?.extraData?.roles?.find(
              (r: any) => r.id === props?.item?.role_id
            );

            const roleName = role?.name || "Sin rol";

            const isAdmin = roleName.toLowerCase() === "administrador";
            const badgeClass = isAdmin
              ? styles.isAdminRole
              : styles.isDefaultRole;

            return (
              <div className={`${styles.roleBadge} ${badgeClass}`}>
                <span>{roleName}</span>
              </div>
            );
          },
        },
      },
      phone: {
        rules: ["number", "phone", "max:16"],
        api: "ae",
        label: "Celular",
        form: {
          type: "number",
          disabled: onDisbled,
        },
        list: true,
      },
      address: {
        rules: ["max:100"],
        api: "ae",
        label: "Dirección",
        form: {
          type: "text",
          disabled: onDisbled,
        },
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
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onImport = () => {
    setOpenImport(true);
  };

  const {
    List,
    setStore,
    onSearch,
    searchs,
    onEdit,
    onDel,
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
  const { onLongPress, selItem, searchState } = useCrudUtils({
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
  if (!userCan("users", "R")) return <NotAccess />;
  return (
    <div className={styles.users}>
      <WidgetDashCard
        title="Cantidad de personal"
        data={data?.message?.total || 0}
        icon={
          <IconAdmin
            color={"var(--cWhite)"}
            style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
            circle
            size={18}
          />
        }
        style={{ width: "290px" }}
      />

      <List
        height={"calc(100vh - 465px)"}
        onTabletRow={renderItem}
        emptyMsg="¡Sin personal registrados! Aquí verás la lista de todo"
        emptyLine2="tu personal administrativo."
        emptyIcon={<IconPersonElegant size={80} color="var(--cWhiteV1)" />}
      />
    </div>
  );
};

export default Users;
