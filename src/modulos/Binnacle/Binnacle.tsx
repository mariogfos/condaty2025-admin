"use client";
import useCrud from "@/mk/hooks/useCrud/useCrud";
import NotAccess from "@/components/auth/NotAccess/NotAccess";

import ItemList from "@/mk/components/ui/ItemList/ItemList";
import useCrudUtils from "../shared/useCrudUtils";
import { useMemo } from "react";
import RenderItem from "../shared/RenderItem";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import RenderView from "./RenderView/RenderView";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import { getDateTimeStrMesShort } from "@/mk/utils/date";
import { IconPencilPaper } from "@/components/layout/icons/IconsBiblioteca";

const mod = {
  modulo: "guardnews",
  singular: "Bitácora",
  plural: "Bitácoras",
  permiso: "",
  extraData: true,
  hideActions: { edit: true, del: true, add: true },
  renderView: (props: any) => <RenderView {...props} />,
  loadView: { fullType: "DET" }, // Esto cargará los detalles completos al hacer clic
};

const paramsInitial = {
  perPage: 20,
  page: 1,
  fullType: "L",
  searchBy: "",
};

const Binnacle = () => {
  const fields = useMemo(
    () => ({
      id: { rules: [], api: "e" },
      guardia: {
        rules: [""],
        api: "",
        label: "Guardia",
        list: {
          onRender: (props: any) => {
            return (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Avatar
                  hasImage={props?.item?.guardia.has_image}
                  src={getUrlImages(
                    "/GUARD-" +
                      props?.item?.guardia.id +
                      ".webp?d=" +
                      props?.item?.guardia.updated_at
                  )}
                  name={getFullName(props?.item.guardia)}
                  // square
                />
                <div>
                  <p>{getFullName(props?.item?.guardia)} </p>
                  <p>CI: {props?.item?.guardia?.ci}</p>
                </div>
              </div>
            );
          },
        },
      },
      descrip: {
        rules: ["required"],
        api: "ae",
        label: "Descripción",
        form: { type: "text" },
        list: {},
      },
      date: {
        rules: ["required"],
        api: "e",
        label: "Fecha",
        list: {
          onRender: (props: any) => {
            return <div>{getDateTimeStrMesShort(props?.item?.created_at)}</div>;
          },
        },
      },
      image: {},
    }),
    []
  );

  const {
    userCan,
    List,
    setStore,
    onSearch,
    searchs,
    onEdit,
    onDel,
    extraData,
    findOptions,
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
    <div>
      <List
        height={"calc(100vh - 330px)"}
        emptyMsg="Lista de bitácora vacía. Cuando los guardias registren"
        emptyLine2="sus reportes los verás aquí."
        emptyIcon={<IconPencilPaper size={80} color="var(--cWhiteV1)" />}
      />
    </div>
  );
};

export default Binnacle;
