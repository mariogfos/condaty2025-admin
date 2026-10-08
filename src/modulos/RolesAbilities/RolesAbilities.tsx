"use client";
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import useCrudUtils from "../shared/useCrudUtils";
import { useMemo } from "react";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { isPlatform as isPlatformAdmin } from "@/components/ProfileModal/adminRolePolicy";

const baseMod: ModCrudType = {
  // 🔴 `v3/abilities`, no `abilities`. El catálogo de permisos vivía en
  // `/api/abilities` —`routes/api.php`, sin prefijo— y se mudó a
  // `/api/v3/abilities` con el módulo el 2026-08-30. La ruta vieja ya no
  // existe: sin este cambio la pantalla de Permisos come 404.
  modulo: "v3/abilities",
  singular: "permiso",
  plural: "permisos",
  // import: true,
  // importRequiredCols: "NAME",
  permiso: "",
  extraData: true,
};

const RolesAbilities = () => {
  // 🔴 El catálogo es de la plataforma: lo escribe sólo FOS (`fosrole_id > 0`)
  // y el API le contesta 403 a cualquier otro ADM. La pantalla no ofrece lo que
  // el API rechaza. (El `onHideActions` con `is_assigned` que había acá leía una
  // clave que el API no manda.)
  const { user } = useAuth();
  const isPlatform = isPlatformAdmin(user);
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
        label: "Código",
        list: true,
        form: { type: "text" },
      },

      description: {
        rules: [],
        api: "ae",
        label: "Nombre del permiso",
        form: { type: "text" },
        list: true,
      },
      ability_category_id: {
        rules: [],
        api: "ae",
        label: "Categoría",
        width: "200px",
        // options: (extraData: any) => {
        //   let data: any = [];
        //   // let data: any = [{ id: "T", name: "Todas" }];
        //   extraData?.ability_categories?.map((c: any) => {
        //     data.push({
        //       id: c.id,
        //       name: c.name,
        //     });
        //   });
        //   return data;
        // },
        form: {
          type: "select",
          optionsExtra: "ability_categories",
          label: "Seleccionar Categoría",
          optionValue: "id",
        },
        list: true,
      },
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

export default RolesAbilities;
