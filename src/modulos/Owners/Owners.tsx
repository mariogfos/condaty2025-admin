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
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import UnlinkModal from "../shared/UnlinkModal/UnlinkModal";
import { IconHome } from "@/components/layout/icons/IconsBiblioteca";
import { WidgetDashCard } from "@/components/Widgets/WidgetsDashboard/WidgetDashCard/WidgetDashCard";
import KeyValue from "@/mk/components/ui/KeyValue/KeyValue";
import ProfileModal from "@/components/ProfileModal/ProfileModal";

const paramsInitial = {
  perPage: 20,
  page: 1,
  fullType: "L",
  searchBy: "",
};

const Owners = () => {
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
    modulo: "owners",
    singular: "Residente",
    plural: "Residentes",
    filter: true,
    export: true,
    import: true,
    permiso: "",
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
    }) =><ProfileModal  
    open={props?.open} 
    onClose={props?.onClose} 
    dataID={props?.item?.id}
    type={'owner'}
    title="Perfil de Residente"
    edit={false}
    />,
    renderDel: (props: {
      open: boolean;
      onClose: any;
      mod: ModCrudType;
      item: Record<string, any>;
      onConfirm?: Function;
      extraData?: Record<string, any>;
    }) => {
      return (
        <UnlinkModal open={props.open} onClose={props.onClose}  mod={mod}  item={props.item} reLoad={reLoad} />

      );
    }
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
        label: "Nombre",
        form: false,
        // list: true, // Asegúrate que esta línea esté presente o descomentada si la quitaste
        onRender: (item: any) => {
          // Asegúrate que 'item.item' contiene los datos del residente
          const residente = item?.item; 
          const nombreCompleto = getFullName(residente);
          const cedulaIdentidad = residente?.ci; // Obtener el CI

          return (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Avatar
                src={getUrlImages(
                  "/OWNER-" +
                    residente?.id + // Usar residente?.id
                    ".webp?d=" +
                    residente?.updated_at // Usar residente?.updated_at
                )}
                name={nombreCompleto} // Usar nombreCompleto
              />
              <div> {/* Contenedor para Nombre, CI y Estado Admin */}
                {/* Nombre */}
                <p style={{ marginBottom: '2px', fontWeight: 500, color: 'var(--cWhite, #fafafa)' }}> 
                  {nombreCompleto} 
                </p>
                
                {/* CI (si existe) */}
                {cedulaIdentidad && (
                  <span style={{ fontSize: '11px', color: 'var(--cWhiteV1, #a7a7a7)', display: 'block', marginBottom: '4px' }}>
                    CI: {cedulaIdentidad}
                  </span>
                )}

                {/* Estado de Administrador Principal (si aplica) */}
                {residente?.is_main == "M" && ( 
                  <span
                    style={{
                      color: "var(--cSuccess)",
                      fontSize: 10,
                      backgroundColor: "#00af900D", // Fondo verde muy transparente
                      padding: '2px 4px', // Ajustar padding si es necesario
                      borderRadius: 4,
                      display: 'inline-block' // Para que el padding/fondo funcione bien
                    }}
                  >
                    Administrador principal
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
        label: "Unidad",
        form: false,
        list: {
          onRender: (props: any) => {
            return "Unidad " + props?.item?.dpto[0]?.nro || "Sin datos";
          },
          
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
        list: { },
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
        
      },
      type: { // Cambiamos el propósito de este campo para mostrar Titular/Dependiente
        rules: [""],
        api: "", // No se envía a la API
        label: "Tipo", // Etiqueta de la columna
        list: {
          width: "110px", // Ajusta el ancho si es necesario
          onRender: (props: any) => {
            const dptos = props?.item?.dpto; // Accede al array de departamentos/unidades
            let esTitular = false;

            // Verifica si el array dpto existe y si en ALGUNA de las relaciones es titular
            if (Array.isArray(dptos) && dptos.length > 0) {
              esTitular = dptos.some(d => d?.pivot?.is_titular === 'Y');
            }

            const texto = esTitular ? "Titular" : "Dependiente";
            // Asigna clases CSS diferentes según el tipo
            const badgeClass = esTitular ? styles.isTitular : styles.isDependiente;

            return (
              // Aplica la clase base y la clase específica (Titular/Dependiente)
              <div className={`${styles.residentTypeBadge} ${badgeClass}`}>
                <span>{texto}</span>
              </div>
            );
          },
        },
        // form: false, // Si no quieres que aparezca en el formulario
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
    errors,
    getExtraData,
    data,
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
    <div className={styles.style}>
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        <WidgetDashCard
          title="Residentes Totales"
          data={String(data?.extraData?.totals || 0)}
          icon={<IconHome color={'#007BFF'} style={{backgroundColor:'rgba(0, 123, 255, 0.1)'}} circle size={38}/>}
          className={styles.widgetResumeCard}
        />
        <WidgetDashCard
          title="Titulares"
          data={String(data?.extraData?.holders || 0)}
          icon={<IconHome color={'var(--cSuccess)'} style={{backgroundColor:'var(--cHoverSuccess)'}} circle size={38}/>}
          className={styles.widgetResumeCard}
        />
        <WidgetDashCard
          title="Dependientes"
          data={String(data?.extraData?.dependents || 0)}
          icon={<IconHome color={'var(--cWarning)'} style={{backgroundColor:'var(--cHoverWarning)'}} circle size={38}/>}
          className={styles.widgetResumeCard}
        />
      </div>
      <List />
      <UnitsModal
        open={unitsModalOpen}
        onClose={closeUnitsModal}
        homeowner={selectedHomeowner}
      />
    </div>
  );
};
export default Owners;
