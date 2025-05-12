"use client";
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import styles from "./HomeOwners.module.css";
import { useMemo, useState } from "react";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import KeyValue from "@/mk/components/ui/KeyValue/KeyValue";
import UnlinkModal from "../shared/UnlinkModal/UnlinkModal";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import { WidgetDashCard } from "@/components/Widgets/WidgetsDashboard/WidgetDashCard/WidgetDashCard";
import { IconHomeOwner } from "@/components/layout/icons/IconsBiblioteca";
import ProfileModal from "@/components/ProfileModal/ProfileModal";

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
    hideActions:{
      edit:true,
      del:true,
    },
    renderView: (props: {
      open: boolean;
      onClose: any;
      item: Record<string, any>;
      onConfirm?: Function;
      extraData?: Record<string, any>;
      noWaiting?: boolean;
      reLoad?: any;
    }) => <ProfileModal  
    open={props?.open} 
    onClose={props?.onClose} 
    dataID={props?.item?.id}
    type={'homeOwner'}
    title="Perfil de Propietario"
    reLoad={props?.reLoad}
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
  };

  const fields = useMemo(() => {
    return {
      id: { rules: [], api: "e" },
      name: {
        rules: ["required"],
        api: "ae",
        label: "Nombre Completo",
        form: {
          type: "text",
          style: { width: "49%" },
          label: "Primer nombre",
        },
        onRender: (item: any) => {
          const propietario = item?.item; 
          const nombreCompleto = getFullName(propietario);
          const cedulaIdentidad = propietario?.ci;

          return (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Avatar
                src={getUrlImages("/HOMEOWNER-" + propietario?.id + ".webp?d=" + propietario?.updated_at)}
                name={nombreCompleto}
              />
              <div>
                <p style={{ marginBottom: '2px', fontWeight: 500, color: 'var(--cWhite, #fafafa)' }}> 
                  {nombreCompleto} 
                </p>
                {cedulaIdentidad && (
                  <span style={{ fontSize: '11px', color: 'var(--cWhiteV1, #a7a7a7)', display: 'block', marginBottom: '4px' }}>
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
        form: { type: "text", style: { width: "49%" } },
        list: false,
      },
      last_name: {
        rules: [""],
        api: "ae",
        label: "Apellido paterno",
        form: { type: "text", style: { width: "49%" } },
        list: false,
      },
      mother_last_name: {
        rules: [""],
        api: "ae",
        label: "Apellido materno",
        form: { type: "text", style: { width: "49%" } },
        list: false,
      },
      ci: {
        rules: ["required"],
        api: "ae",
        label: "Cédula de identidad",
        form: { type: "number" },
        
      },
      email: {
        rules: ["required"],
        api: "ae",
        label: "Correo electrónico",
        form: {
          type: "text",
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
                .map(dpto => dpto?.nro)
                .filter(nro => nro);

              return numerosDeUnidades.join(', ');

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
    reLoad,
    getExtraData,
    data,
  } = useCrud({
    paramsInitial,
    mod,
    fields,
  });

  if (!userCan(mod.permiso, "R")) return <NotAccess />;
  return (
    <div className={styles.style}>
      <div style={{ marginBottom: '20px' }}>
        <WidgetDashCard
          title="Propietarios Registrados"
          data={data?.message?.total || 0}
          icon={<IconHomeOwner color={'var(--cWhite)'} style={{backgroundColor:'rgba(255, 255, 255, 0.1)'}} circle size={38}/>}
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

export default HomeOwners;
