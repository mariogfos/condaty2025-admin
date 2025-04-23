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
import Input from "@/mk/components/forms/Input/Input";
import InputPassword from "@/mk/components/forms/InputPassword/InputPassword";
import RenderView from "./RenderView/RenderView";

const paramsInitial = {
  perPage: 20,
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
    export: true,
    import: true,
    permiso: "",
    renderView: (props: {
      open: boolean;
      onClose: any;
      item: Record<string, any>;
      onConfirm?: Function;
      extraData?: Record<string, any>;
    }) => <RenderView {...props} />,
    // extraData: true,
  };
  const onBlurCi = useCallback(async (e: any, props: any) => {
    if (e.target.value.trim() == "") return;
    const { data, error } = await execute(
      "/owners",
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
        api: "a*e*",
        label: "Suba una Imagen",
        list: false,
        form: {
          type: "imageUpload",
          prefix: "OWNER",
          style: { width: "100%" },
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
                    onBlur={(e: any) => onBlurCi(e, props)}
                    disabled={props?.field?.action === "edit"}
                  />
                  {props?.field?.action === "add" && !props.item._disabled && (
                    <InputPassword
                      name="password"
                      value={props?.item?.password}
                      onChange={props.onChange}
                      label="Contraseña"
                      error={props.error}
                      // disabled={
                      //   props?.field?.action === "edit" ||
                      //   props.item._disabled === true
                      // }
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
          disabled: onDisbled,
        },

        list: false,
      },
      middle_name: {
        closeTag: true,
        rules: [""],
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
        rules: ["required"],
        api: "ae",
        label: "Apellido paterno",
        form: {
          type: "text",
          disabled: onDisbled,
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
      units: {
        rules: [""],
        api: "",
        label: "Unidades",
        form: false,
        list: {
          onRender: (props: any) => {
            return props?.item?.dpto[0]?.nro || "Sin datos";
          },
          width: "90px",
        },
      },
      email: {
        rules: ["required"],
        api: "ae",
        label: "Correo electrónico",
        form: {
          type: "text",
          disabled: onDisbled,
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
          disabled: onDisbled,
        },
        list: { width: "180px" },
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
    showToast,
    execute,
    errors,
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
