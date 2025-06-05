"use client";
import styles from "./Users.module.css";
import RenderItem from "../shared/RenderItem";
import useCrudUtils from "../shared/useCrudUtils";
import { useCallback, useEffect, useMemo, useState } from "react";
import ItemList from "@/mk/components/ui/ItemList/ItemList";
import NotAccess from "@/components/layout/NotAccess/NotAccess";
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import RenderView from "./RenderView/RenderView";
import { useAuth } from "@/mk/contexts/AuthProvider";
import RenderForm from "./RenderForm/RenderForm";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import {
  IconAccess,
  IconAdd,
  IconAdmin,
} from "@/components/layout/icons/IconsBiblioteca";
import Input from "@/mk/components/forms/Input/Input";

import UnlinkModal from "../shared/UnlinkModal/UnlinkModal";
import { WidgetDashCard } from "@/components/Widgets/WidgetsDashboard/WidgetDashCard/WidgetDashCard";
import ProfileModal from "@/components/ProfileModal/ProfileModal";

const paramsInitial = {
  perPage: 20,
  page: 1,
  fullType: "L",
  searchBy: "",
};

const Users = () => {
  const { user } = useAuth();
  const mod: ModCrudType = {
    modulo: "users",
    singular: "Administrador",
    plural: "Administradores",
    filter: true,
    permiso: "",
    export: true,
    import: true,
    hideActions: {
      edit: true,
      del: true,
    },
    //export: true,
    // import: true,
    // noWaiting:true,
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
        title="Perfil de Administrador"
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
    // renderForm: (props: {
    //   item: any;
    //   setItem: any;
    //   extraData: any;
    //   open: boolean;
    //   onClose: any;
    //   user: any;
    //   execute: any;
    // }) => <RenderForm {...props} />,
    extraData: true,
    // hideActions: { add: true },
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
  }, []); // Agrega las dependencias del hook

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
        label: "Carnet de Identidad",
        form: {
          type: "text",
          disabled: onDisbled,
          onBlur: onBlurCi,
          required: true,
          // onTop: () => (
          //   <div style={{ display: "flex" }}>
          //     <div style={{ flexGrow: 1 }}>Información de acceso</div>
          //     <div>
          //       La contraseña sera enviada al correo que indiques en este campo
          //     </div>
          //   </div>
          // ),
        },
        list: false,
      },
      role_id: {
        rules: ["required"], // Reglas para el formulario
        api: "ae", // Se envía a la API al agregar/editar
        label: "Rol", // Etiqueta general
        form: {
          // Configuración para el formulario
          type: "select",
          optionsExtra: "roles", // Usa los datos extra 'roles' para las opciones
          optionLabel: "name", // Muestra el campo 'name' del rol
          optionValue: "id", // Usa el campo 'id' del rol como valor
          required: true,
        },

        // filter: { ... } // Tu configuración de filtro (comentada en tu código)
      },
      fullName: {
        rules: [],
        api: "ae",
        label: "Nombre del administrador",
        form: false,
        onRender: (item: any) => {
          // Asegúrate que 'item.item' contiene los datos del residente
          const administrador = item?.item;
          const nombreCompleto = getFullName(administrador);
          const cedulaIdentidad = administrador?.ci; // Obtener el CI

          return (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Avatar
                src={getUrlImages(
                  "/ADM-" +
                    administrador?.id + // Usar administrador?.id
                    ".webp?d=" +
                    administrador?.updated_at // Usar administrador?.updated_at
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
        list: true, // <-- Importante: Asegúrate que 'list: true' esté aquí para que se muestre en la lista
      },
      avatar: {
        api: "a*e*",
        label: "Suba una Imagen",
        list: false,
      },

      name: {
        rules: ["required", "max:50", "alpha", "noSpaces"],
        api: "ae",
        label: "Primer nombre",
        form: {
          type: "text",
          style: { width: "49%" },
          disabled: onDisbled,
          required: true,
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
        rules: ["required", "max:50", "alpha"],
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
        form: { type: "text", style: { width: "49%" }, disabled: onDisbled },
        list: false,
      },

      // rep_email: {

      //   api: "",
      //   label: "Repita el correo electrónico",
      //   form: { type: "text" },
      //   list: false,
      //   style: { width: "500px" },
      // },
      rol: {
        rules: [""],
        api: "",
        label: "Rol",
        form: false,
        list: {
          // Configuración para la lista/tabla

          onRender: (props: any) => {
            // Encontrar el objeto rol correspondiente al role_id del item
            const role = props?.extraData?.roles?.find(
              (r: any) => r.id === props?.item?.role_id
            );
            // Obtener el nombre del rol o un texto por defecto
            const roleName = role?.name || "Sin Rol";

            // Verificar si el rol es 'Administrador' (ignorando mayúsculas/minúsculas)
            const isAdmin = roleName.toLowerCase() === "administrador";

            // Asignar la clase CSS correspondiente
            const badgeClass = isAdmin
              ? styles.isAdminRole
              : styles.isDefaultRole;

            return (
              // Renderizar el div con la clase base y la clase específica
              <div className={`${styles.roleBadge} ${badgeClass}`}>
                <span>{roleName}</span> {/* Mostrar el nombre del rol */}
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
          type: "text",
          disabled: onDisbled,
        },
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
          type: "text", // Se recomienda 'text' en lugar de 'number' para emails
          disabled: onDisbled,
          onBlur: onBlurEmail,

          // required: true,
          // onRender: (props: any) => {
          //   return (
          //     <div className={styles.fieldSet}>
          //       <div>
          //         <div>Información de acceso</div>
          //         <div>
          //           La contraseña sera enviada al correo que indiques en este
          //           campo
          //         </div>
          //       </div>
          //       <div>
          //         <Input
          //           name="email"
          //           value={props?.item?.email || ""}
          //           onChange={props.onChange}
          //           label="Correo electrónico"
          //           error={props.error}
          //           disabled={onDisbled({
          //             item: props?.item,
          //             field: { name: "email" },
          //           })}
          //           // Línea que debes agregar/modificar
          //           onBlur={(e) => onBlurEmail(e, props)}
          //           required={true}
          //         />
          //       </div>
          //     </div>
          //   );
          // },
        },
        list: true,
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
      <WidgetDashCard
        title="Total de Administradores"
        data={data?.message?.total || 0}
        icon={
          <IconAdmin
            color={"var(--cWhite)"}
            style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
            circle
            size={38}
          />
        }
        style={{ width: "280px" }}
        // className={styles.widgetResumeCard}
      />

      <List height={"calc(100vh - 390px)"} onTabletRow={renderItem} />
    </div>
  );
};

export default Users;
