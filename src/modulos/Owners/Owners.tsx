/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import styles from "./Owners.module.css";
import RenderItem from "../shared/RenderItem";
import useCrudUtils from "../shared/useCrudUtils";
import { useEffect, useMemo, useState } from "react";
import ItemList from "@/mk/components/ui/ItemList/ItemList";
import NotAccess from "@/components/layout/NotAccess/NotAccess";
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import Input from "@/mk/components/forms/Input/Input";
import InputPassword from "@/mk/components/forms/InputPassword/InputPassword";
import RenderView from "./RenderView";

const paramsInitial = {
  perPage: 10,
  page: 1,
  fullType: "L",
  searchBy: "",
};

const Owners = () => {
  const mod: ModCrudType = {
    modulo: "owners",
    singular: "Residente",
    plural: "Residentes",
    filter: true,
    permiso: "",
    renderView: (props: {
      open: boolean;
      onClose: any;
      item: Record<string, any>;
      onConfirm?: Function;
      extraData?: Record<string, any>;
    }) => <RenderView {...props} />,
    extraData: true,
  };

  const fields = useMemo(() => {
    return {
      id: { rules: [], api: "e" },

      fullName: {
        // rules: ["required"],
        api: "ae",
        label: "Nombre del residente",
        form: false,
        onRender: (item: any) => {
          return (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Avatar
                src={getUrlImages(
                  "/OWNER-" +
                    item?.item?.id +
                    ".webp?d=" +
                    item?.item?.updated_at
                )}
                name={getFullName(item.item)}
                square
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
      avatar: {
        rules: ["requiredFile*a"],
        api: "a*e*",
        label: "Suba una Imagen",
        list: false,
        form: {
          type: "imageUpload",
          prefix: "OWNER",
          style: { width: "100%" },
          // onRigth: rigthAvatar,
        },
      },
      password: {
        rules: ["required*add"],
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
            return (
              <fieldset className={styles.fieldSet}>
                <div>
                  <div>Información de acceso</div>
                  <div>
                    Ingrese el número de carnet y haga click fuera del campo
                    para que el sistema busque automáticamente al residente si
                    el carnet no existe ,continúa con el proceso de registro
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
                  />
                  {props?.field?.action === "add" && (
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
        openTag: { style: { display: "flex" } },
        rules: ["required"],
        api: "ae",
        label: "Primer nombre",
        form: {
          type: "text",
        },

        list: false,
      },
      middle_name: {
        closeTag: true,
        rules: [""],
        api: "ae",
        label: "Segundo nombre",
        form: { type: "text" },
        list: false,
      },
      last_name: {
        openTag: {
          style: {
            display: "flex",
          },
        },
        rules: ["required"],
        api: "ae",
        label: "Apellido paterno",
        form: { type: "text" },
        list: false,
      },
      mother_last_name: {
        closeTag: true,
        rules: [""],
        api: "ae",
        label: "Apellido materno",
        form: { type: "text" },
        list: false,
      },

      email: {
        rules: ["required"],
        api: "ae",
        label: "Correo electrónico",
        form: {
          type: "text",
        },
        list: { width: "180px" },
      },
      // rep_email: {

      //   api: "",
      //   label: "Repita el correo electrónico",
      //   form: { type: "text" },
      //   list: false,
      //   style: { width: "500px" },
      // },
      phone: {
        rules: ["number"],
        api: "ae",
        label: "Celular (Opcional)",
        form: {
          type: "text",
        },
        list: { width: "180px" },
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

export default Owners;
