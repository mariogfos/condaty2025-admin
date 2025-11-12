/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import styles from "./BankAccounts.module.css";
import useCrudUtils from "../shared/useCrudUtils";
import React, { useMemo } from "react";
import NotAccess from "@/components/layout/NotAccess/NotAccess";
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import UnlinkModal from "../shared/UnlinkModal/UnlinkModal";
import { IconHomePerson2 } from "@/components/layout/icons/IconsBiblioteca";

import RenderForm from "./RenderForm/RenderForm";
import RenderView from "./RenderView/RenderView";

const paramsInitial = {
  perPage: 20,
  page: 1,
  fullType: "L",
  searchBy: "",
};

const BankAccounts = () => {
  const getTypefilter = () => [
    { id: "ALL", name: "Todos" },
    { id: "D", name: "Dependientes" },
    { id: "T", name: "Residentes" },
    { id: "H", name: "Propietarios" },
  ];

  const mod: ModCrudType = {
    // modulo: "bank_accounts",
    modulo: "owners",
    singular: "cuenta bancaria",
    plural: "cuentas bancarias",
    filter: true,
    export: true,
    import: false,
    permiso: "owners",
    hideActions: {
      edit: true,
      del: true,
    },
    extraData: true,
    renderForm: (props: any) => <RenderForm {...props} />,
    renderView: (props: {
      open: boolean;
      onClose: any;
      item: Record<string, any>;
      onConfirm?: Function;
      extraData?: Record<string, any>;
      reLoad?: any;
    }) => <RenderView {...props} />,

    renderDel: (props: {
      open: boolean;
      onClose: any;
      item: Record<string, any>;
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

  const fields = useMemo(() => {
    return {
      id: { rules: [], api: "e" },
      alias: {
        rules: ["required", "ci"],
        api: "ae",
        label: "alias",
        form: {
          type: "text",
          required: true,
        },
        list: true,
      },

      assigned_to: {
        rules: ["required", "alpha"],
        api: "ae",
        label: "Asignado a",
        form: {
          type: "text",
          required: true,
        },
        list: true,
      },
      status: {
        rules: [],
        api: "ae",
        label: "Estado",
        form: {
          type: "text",
        },
        list: true,
      },
      banking_entity: {
        rules: ["required", "alpha"],
        api: "ae",
        label: "Entidad bancaria",
        form: {
          type: "text",
          required: true,
        },
        list: true,
      },
      titular: {
        closeTag: true,
        rules: [""],
        api: "ae",
        label: "Titular",
        form: {
          type: "text",
        },
        list: true,
      },
      account_number: {
        rules: [""],
        api: "",
        label: "Nº de cuenta",
        list: {},
        // filter: {
        //   label: "Tipo",
        //   width: "180px",

        //   options: getTypefilter,
        // },
      },

      currency: {
        rules: ["required", "alpha"],
        api: "a",
        label: "Moneda",
        list: {},
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
    data,
    extraData,
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

  if (!userCan(mod.permiso, "R")) return <NotAccess />;
  return (
    <div className={styles.style}>
      <List
        height={"calc(100vh - 465px)"}
        emptyMsg="Lista de residentes vacía. Aquí verás a todos los residentes"
        emptyLine2="del condominio una vez los registres."
        emptyIcon={<IconHomePerson2 size={80} color="var(--cWhiteV1)" />}
      />
    </div>
  );
};
export default BankAccounts;
