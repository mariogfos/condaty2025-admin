"use client";
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import useCrudUtils from "../shared/useCrudUtils";
import { useMemo } from "react";
import { useAuth } from "@/mk/contexts/AuthProvider";

const baseMod: ModCrudType = {
  modulo: "v3/ability-categories",
  singular: "Categoría",
  plural: "Categorías",
  // import: true,
  // importRequiredCols:"NAME",
  permiso: "",
};

const RolesCategories = () => {
  // 🔴 El catálogo es de la plataforma: lo escribe sólo FOS (`fosrole_id > 0`)
  // y el API le contesta 403 a cualquier otro ADM. La pantalla no ofrece lo que
  // el API rechaza. (El `onHideActions` con `is_assigned` que había acá leía una
  // clave que el API no manda.)
  const { user } = useAuth();
  const isPlatform = Number(user?.fosrole_id ?? 0) > 0;
  const mod: ModCrudType = useMemo(
    () => ({
      ...baseMod,
      hideActions: { add: !isPlatform, edit: !isPlatform, del: !isPlatform },
    }),
    [isPlatform],
  );
  const paramsInitial = {
    perPage: 20,
    page: 1,
    fullType: "L",
    searchBy: "",
  };

  const fields = useMemo(() => {
    return {
      id: { rules: [], api: "e" },
      name: {
        rules: ["required"],
        api: "ae",
        label: "Nombre de Categoría",
        list: true,
        form: { type: "text" },
      },

      //   description: {
      //     rules: [],
      //     api: "ae",
      //     label:"Descripción",
      //     form: {type:"text"},
      //     list:true,
      //     default: client_id,
      //   },
    };
  }, []);

  const { userCan, List, setStore, onSearch, searchs, onEdit, onDel } = useCrud(
    {
      paramsInitial,
      mod,
      fields,
    }
  );
  useCrudUtils({
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
      <List />
    </div>
  );
};

export default RolesCategories;
