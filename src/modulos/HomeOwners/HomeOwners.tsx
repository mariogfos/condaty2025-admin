"use client";
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import styles from "./HomeOwners.module.css";
import { useMemo, useState } from "react";
import RenderItem from "../shared/RenderItem";
import { getFullName } from "@/mk/utils/string";
import useCrudUtils from "../shared/useCrudUtils";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import KeyValue from "@/mk/components/ui/KeyValue/KeyValue";

const paramsInitial = {
  perPage: 10,
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
    // extraData: true,
    export: true,
    import: true,
  };

  const fields = useMemo(() => {
    return {
      id: { rules: [], api: "e" },
      ci: {
        rules: ["required"],
        api: "ae",
        label: "Cédula de identidad",
        form: { type: "number" },
        list: { width: "120px" },
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
        label: "Unidades",
        list: {
          width: "150px",
          onRender: (props: any) => {
            const { item } = props;
            if (!item.dptos || item.dptos.length === 0) {
              return "Sin unidades";
            }

            if (item.dptos.length === 1) {
              const dpto = item.dptos[0];
              return (
                <div className={styles.singleUnit}>
                  <span>
                    {dpto.nro} - {dpto.description}
                  </span>
                </div>
              );
            }

            return (
              <button
                className={styles.viewUnitsButton}
                onClick={(e) => {
                  e.stopPropagation(); // Prevent row click
                  openUnitsModal(item);
                }}
              >
                Ver unidades ({item.dptos.length})
              </button>
            );
          },
        },
      },
      name: {
        rules: ["required"],
        api: "ae",
        label: "Nombre Completo",
        form: {
          type: "text",
          style: { width: "49%" },
          label: "Primer nombre",
        },
        list: {
          onRender: (props: any) => {
            return getFullName(props.item);
          },
        },
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
        list: { width: "80px" },
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
  } = useCrud({
    paramsInitial,
    mod,
    fields,
  });

  const { onLongPress, selItem, searchState, setSearchState } = useCrudUtils({
    onSearch,
    searchs,
    setStore,
    mod,
    onEdit,
    onDel,
  });

  if (!userCan(mod.permiso, "R")) return <NotAccess />;

  return (
    <div className={styles.style}>
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
