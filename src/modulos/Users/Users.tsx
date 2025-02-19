/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import styles from "./Users.module.css";
import RenderItem from "../shared/RenderItem";
import useCrudUtils from "../shared/useCrudUtils";
import { useEffect, useMemo, useState } from "react";
import ItemList from "@/mk/components/ui/ItemList/ItemList";
import NotAccess from "@/components/layout/NotAccess/NotAccess";
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import RenderView from "./RenderView";
import { useAuth } from "@/mk/contexts/AuthProvider";
import RenderForm from "./RenderForm";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";

const validate = (item: any, user: any) => {
  if (user.datos.status === "M" && user.role.level > item.level) {
    return true;
  }

  if (user.datos.status === "A" && user.role.level >= item.level) {
    return true;
  }
  if (item.is_main == "M" && user.datos.status === "A") {
    return true;
  }

  return false;
};

const paramsInitial = {
  perPage: 10,
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
    // import: true,
    renderView: (props: {
      open: boolean;
      onClose: any;
      item: Record<string, any>;
      onConfirm?: Function;
      extraData?: Record<string, any>;
    }) => <RenderView {...props} />,
    renderForm: (props: {
      item: any;
      setItem: any;
      extraData: any;
      open: boolean;
      onClose: any;
      user: any;
      execute: any;
    }) => <RenderForm {...props} />,
    extraData: true,
    hideActions: { add: true },
    onHideActions: (item: any) => {
      return {
        hideEdit: validate(item, user) || user.id == item.id,

        hideDel: validate(item, user) || user.id == item.id,
      };
    },
  };

  // const _onBlur = async (
  //   e: any,
  //   item: any,
  //   setItem: any,
  //   error: any,
  //   setError: any
  // ) => {
  //   if (item.email == user?.email) {
  //     return;
  //   }
  //   const { data: response } = await execute("/adm-exist", "GET", {
  //     searchBy: item.email,
  //     type: "email",
  //     cols: "id",
  //   });

  //   if (response?.data != null) {
  //     setError({ ...error, email: "El correo electrónico ya existe" });
  //     showToast("El correo electrónico ya existe", "error");
  //   }
  // };

  const fields = useMemo(() => {
    return {
      id: { rules: [], api: "e" },

      fullName: {
        // rules: ["required"],
        api: "ae",
        label: "Nombre del administrador",
        form: false,
        onRender: (item: any) => {
          return (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Avatar
                src={getUrlImages(
                  "/ADM-" + item?.item?.id + ".webp?d=" + item?.item?.updated_at
                )}
                name={getFullName(item.item)}
              />
              <div>
                <p>{getFullName(item?.item)} </p>
                {item.item.is_main == "M" && (
                  <span
                    style={{
                      color: "var(--cSuccess)",
                      fontSize: 10,
                      backgroundColor: "#00af900D",
                      padding: 4,
                      borderRadius: 4,
                    }}
                  >
                    {item.item.is_main == "M"
                      ? "Administrador principal"
                      : null}
                  </span>
                )}
              </div>
            </div>
          );
        },
        list: true,
      },

      name: {
        rules: ["required"],
        api: "ae",
        label: "Primer nombre",
        form: {
          type: "text",
        },
        list: false,
      },
      middle_name: {
        rules: [""],
        api: "ae",
        label: "Segundo nombre",
        form: { type: "text" },
        list: false,
      },
      last_name: {
        rules: ["required"],
        api: "ae",
        label: "Apellido paterno",
        form: { type: "text" },
        list: false,
      },
      mother_last_name: {
        rules: [""],
        api: "ae",
        label: "Apellido materno",
        form: { type: "text" },
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
        },
        list: { width: "150px" },
        filter: {
          label: "Filtrar por Rol",
          width: "200px",
          options: (extraData: any) => {
            // console.log(extraData, "extraData");
            let data: any = [{ id: "T", name: "Todos" }];
            extraData?.roles?.map((c: any) => {
              data.push({
                id: c.id,
                name: c.name,
              });
            });
            return data;
          },
        },
      },

      ci: {
        rules: ["required"],
        api: "a",
        label: "Cédula de identidad",
        form: { type: "text", disabled: true, label: "2222" },
        list: { width: "120px" },
      },
      email: {
        rules: ["required"],
        api: "ae",
        label: "Correo electrónico",
        form: {
          type: "text",
          // onBlur: (e: any, { item, setItem, error, setError }: any) =>
          //   _onBlur(e, item, setItem, error, setError),
        },
        list: { width: "160px" },
      },
      rep_email: {
        // rules: ["required"],
        api: "",
        label: "Repita el correo electrónico",
        form: { type: "text" },
        list: false,
        style: { width: "500px" },
      },
      status: {
        rules: ["required"],
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
        list: { width: "80px" },
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
      <List onTabletRow={renderItem} />
    </div>
  );
};

export default Users;
