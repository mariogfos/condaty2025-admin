"use client";
import React, { useEffect, useMemo } from "react";
import useCrud from "@/mk/hooks/useCrud/useCrud";
import useCrudUtils from "../shared/useCrudUtils";
import NotAccess from "@/components/layout/NotAccess/NotAccess";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { BankEntityStatus, QrProviderStatus } from "../BankAccounts/Type/BankType";
import { getBankEntitiesMod } from "./config/bankEntitiesMod";

const paramsInitial = {
  perPage: 20,
  page: 1,
  fullType: "L",
  searchBy: "",
};

/**
 * Las dos opciones del estado, con los VALORES NUMÉRICOS del enum.
 *
 * 🔴 Nunca los chars legacy. `bank_entities.status` es `tinyint`: MariaDB
 * convierte un char a 0 y sigue sin quejarse, así que un filtro con `'A'`
 * devuelve las INACTIVAS y el usuario ve una lista equivocada sin ningún error.
 * Es el mismo bug que ya se midió en Áreas y en Egresos.
 */
const ESTADO_OPCIONES = [
  { id: BankEntityStatus.ACTIVE, name: "Activo" },
  { id: BankEntityStatus.INACTIVE, name: "Inactivo" },
];

/**
 * Las mismas dos opciones para el proveedor de QR dinámico.
 *
 * Va aparte de `ESTADO_OPCIONES` aunque hoy los valores coincidan: son dos
 * enums distintos del back (`BankEntityStatus` y `QrProviderStatus`) y
 * compartir la constante los ata a evolucionar juntos sin que nadie lo decida.
 */
const QR_OPCIONES = [
  { id: QrProviderStatus.ACTIVE, name: "Habilitado" },
  { id: QrProviderStatus.INACTIVE, name: "Deshabilitado" },
];

const renderQrEstado = ({ item }: Record<string, any>) => {
  const habilitado = Number(item.qr_status) === QrProviderStatus.ACTIVE;

  return (
    <StatusBadge
      color={habilitado ? "var(--cSuccess)" : "var(--cWhiteV2)"}
      backgroundColor={habilitado ? "var(--cHoverSuccess)" : "var(--cBlackV2)"}
    >
      {habilitado ? "Con QR" : "Sin QR"}
    </StatusBadge>
  );
};

const renderEstado = ({ item }: Record<string, any>) => {
  const activo = Number(item.status) === BankEntityStatus.ACTIVE;

  return (
    <StatusBadge
      color={activo ? "var(--cSuccess)" : "var(--cError)"}
      backgroundColor={activo ? "var(--cHoverSuccess)" : "var(--cHoverError)"}
    >
      {activo ? "Activo" : "Inactivo"}
    </StatusBadge>
  );
};

const BankEntities = () => {
  const mod = useMemo(() => getBankEntitiesMod(), []);
  const { setStore, store } = useAuth();

  useEffect(() => {
    setStore({ ...store, title: "Entidades bancarias" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fields = useMemo(
    () => ({
      id: { rules: [], api: "e" },
      name: {
        rules: ["required"],
        api: "ae",
        label: "Nombre",
        list: { width: "260px" },
        form: { type: "text", required: true },
      },
      bank_code: {
        rules: [],
        api: "ae",
        label: "Código",
        list: { width: "120px" },
        form: { type: "text" },
      },
      description: {
        rules: [],
        api: "ae",
        label: "Descripción",
        list: {},
        form: { type: "textArea" },
      },
      status: {
        rules: ["required"],
        api: "ae",
        label: "Estado",
        list: {
          width: "140px",
          onRender: renderEstado,
        },
        // 🔴 El estado va en el form aunque parezca de más: la columna es
        // nullable y sin default, y una entidad con `status` en NULL queda
        // INVISIBLE en el select del form de Cuentas Bancarias, que se arma
        // con `where('status', ACTIVE)`. El back también lo defaultea al crear.
        form: { type: "select", required: true, options: ESTADO_OPCIONES },
        filter: {
          label: "Estado",
          width: "160px",
          options: () => [{ id: "ALL", name: "Todos" }, ...ESTADO_OPCIONES],
          optionLabel: "name",
          optionValue: "id",
        },
      },

      // ── QR dinámico ────────────────────────────────────────────────────
      // La configuración del banco como proveedor de QR. El back la manda y la
      // acepta SÓLO del superadmin (`BankEntityPolicy::update`), que es el
      // mismo permiso con el que se entra a esta pantalla.
      qr_status: {
        rules: [],
        api: "ae",
        label: "QR dinámico",
        list: { width: "130px", onRender: renderQrEstado },
        form: { type: "select", options: QR_OPCIONES },
      },
      qr_base_url: {
        rules: [],
        api: "ae",
        label: "URL de producción (QR)",
        list: false,
        form: { type: "text" },
      },
      qr_sandbox_base_url: {
        rules: [],
        api: "ae",
        label: "URL de pruebas (QR)",
        list: false,
        form: { type: "text" },
      },
      qr_webhook_username: {
        rules: [],
        api: "ae",
        label: "Usuario del webhook",
        list: false,
        form: { type: "text" },
      },
      // 🔴 La clave viaja HASHEADA y el back NO la devuelve nunca, así que este
      // campo SIEMPRE se abre vacío — no es un dato que se perdió. Vacío
      // significa "dejala como está"; sólo se escribe lo que se tipea acá.
      qr_webhook_password: {
        rules: [],
        api: "ae",
        label: "Clave del webhook (vacío = no cambiar)",
        list: false,
        form: { type: "text" },
      },
    }),
    []
  );

  const { userCan, List, setStore: setCrudStore, onSearch, searchs, onEdit, onDel } =
    useCrud({
      paramsInitial,
      mod,
      fields,
    });

  const { onLongPress, selItem } = useCrudUtils({
    onSearch,
    searchs,
    setStore: setCrudStore,
    mod,
    onEdit,
    onDel,
  });

  if (!userCan(mod.permiso, "R")) return <NotAccess />;

  return (
    <List
      height={"100%"}
      emptyMsg="No hay entidades bancarias registradas."
      emptyLine2="Son el catálogo de bancos que después se elige al crear una cuenta."
    />
  );
};

export default BankEntities;
