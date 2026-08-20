"use client";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import React, { useMemo } from "react";
import useCrudUtils from "../shared/useCrudUtils";
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import RenderForm from "./RenderForm/RenderForm";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import { getDateTimeStrMes } from "@/mk/utils/date";
import RenderDel from "./RenderDel/RenderDel";
import { ClientPrivacy, ClientStatus } from "@/modulos/Payments/Type/PaymentType";

const paramsInitial = {
  perPage: 20,
  page: 1,
  fullType: "L",
  searchBy: "",
};
const mod: ModCrudType = {
  modulo: "v3/clients",
  singular: "condominios",
  plural: "condominios",
  permiso: "condominios",
  renderDel: (props: any) => <RenderDel {...props} />,
  filter: true,
  extraData: true,
  onHideActions: (item: any) => {
    return {
      hideDel:
        item.privacy === ClientPrivacy.PUBLICO ||
        item.status === ClientStatus.INACTIVE,
    };
  },
  hideActions: {
    view: true,
  },
  renderForm: (props: any) => <RenderForm {...props} />,
};
/**
 * CDT-26: keyed by the numeric ClientStatus enum, not the legacy 'A'/'I' chars.
 *
 * `clients.status` became TINYINT UNSIGNED on 2026-07-18
 * (migration `migrate_clients_status_to_numeric`), so a char-keyed map returned
 * `undefined` and the list fell back to printing the raw value ("1").
 *
 * This map feeds two surfaces: the badge in the list AND the "Filtrar por
 * estado" dropdown, whose option ids come from `Object.keys` below. With char
 * keys the filter silently sent 'A'/'I' and matched no rows without erroring.
 */
const statusCondominios: Record<
  number,
  { text: string; bgColor: string; color: string }
> = {
  [ClientStatus.ACTIVE]: {
    text: "Activo",
    bgColor: "#15392B",
    color: "var(--cAccent)",
  },
  [ClientStatus.INACTIVE]: {
    text: "Inactivo",
    bgColor: "#3A2121",
    color: "var(--cError)",
  },
};
// Las claves son los valores del enum numérico, no los chars legacy 'P'/'T'.
const privacyCondominios: Record<number, string> = {
  [ClientPrivacy.PUBLICO]: "Público",
  [ClientPrivacy.PRUEBA]: "Prueba",
};
const Condominios = () => {
  const fields = useMemo(() => {
    return {
      id: { rules: [], api: "ae" },
      name: {
        rules: ["required"],
        api: "ae",
        label: "Nombre",
        list: {},
        form: { type: "text", label: "Nombre del rol" },
        hide: true,
      },
      status: {
        rules: ["required"],
        api: "ae",
        label: "Estado",
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
        list: {
          onRender: ({ item }: any) => (
            <StatusBadge
              backgroundColor={statusCondominios[item?.status]?.bgColor}
              color={statusCondominios[item?.status]?.color}
              style={{ fontSize: "12px" }}
            >
              {statusCondominios[item?.status]?.text || item?.status}
            </StatusBadge>
          ),
          // ,
        },
        form: { type: "text", label: "Código del rol" },
        filter: {
          label: "Filtrar por estado",
          width: "180px",
          options: () => [
            { id: "ALL", name: "Todos" },
            // Los ids van como STRING a propósito, y en orden explícito.
            //
            // 🔴 `ClientStatus.INACTIVE` vale 0, y `Select` decide qué opción
            // está seleccionada con `option[optionValue] == value` (`==`, flojo)
            // contra un "sin selección" que es `""`. En JavaScript `0 == ""` es
            // `true`, así que con un id numérico la opción "Inactivo" aparecía
            // seleccionada sola, con el filtro sin aplicar. `"0"` no colisiona.
            //
            // El orden es explícito porque `Object.entries` sobre claves
            // numéricas las devuelve en orden ascendente, y eso ponía "Inactivo"
            // antes que "Activo".
            ...[ClientStatus.ACTIVE, ClientStatus.INACTIVE].map((value) => ({
              id: String(value),
              name: statusCondominios[value].text,
            })),
          ],
        },
      },
      privacy: {
        rules: [""],
        api: "ae",
        label: "Privacidad",
        list: {
          onRender: ({ item }: any) =>
            privacyCondominios[item?.privacy] || item?.privacy,
        },
        form: { type: "text" },
        filter: {
          label: "Privacidad",
          width: "280px",
          options: () => [
            { id: "ALL", name: "Todos" },
            // `Object.keys` devuelve strings aunque las claves sean numéricas,
            // así que el id del filtro se manda como número: el backend ahora
            // compara contra un `tinyint` y un `'1'` de texto no matchea.
            ...Object.entries(privacyCondominios).map(([key, label]) => ({
              id: Number(key),
              name: label,
            })),
          ],
        },
      },

      created_at: {
        rules: [""],
        api: "ae",
        label: "Creado el",
        list: {
          onRender: ({ item }: any) =>
            getDateTimeStrMes(item?.created_at) || "",
        },
        form: { type: "text" },
      },
      updated_at: {
        rules: [""],
        api: "ae",
        label: "Actualizado el",
        list: {
          onRender: ({ item }: any) =>
            getDateTimeStrMes(item?.updated_at) || "",
        },
        form: { type: "text" },
      },
    };
  }, []);
  const { userCan, List, setStore, onSearch, searchs, onEdit, onDel } = useCrud(
    {
      paramsInitial,
      mod,
      fields,
    },
  );
  const { onLongPress, selItem } = useCrudUtils({
    onSearch,
    searchs,
    setStore,
    mod,
    onEdit,
    onDel,
  });

  if (!userCan(mod.permiso, "R")) return <NotAccess />;
  return <List height={"100%"} />;
};

export default Condominios;
