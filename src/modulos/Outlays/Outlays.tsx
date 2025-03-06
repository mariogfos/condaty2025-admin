/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import styles from "./Outlays.module.css";
import RenderItem from "../shared/RenderItem";
import useCrudUtils from "../shared/useCrudUtils";
import { useEffect, useMemo, useState } from "react";
import ItemList from "@/mk/components/ui/ItemList/ItemList";
import NotAccess from "@/components/layout/NotAccess/NotAccess";
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import { IconAccess, IconAdd } from "@/components/layout/icons/IconsBiblioteca";
import Input from "@/mk/components/forms/Input/Input";
import InputPassword from "@/mk/components/forms/InputPassword/InputPassword";
import { formatNumber } from "@/mk/utils/numbers";


const paramsInitial = {
  perPage: 10,
  page: 1,
  fullType: "L",
  searchBy: "",
};

const Outlays = () => {
  const mod: ModCrudType = {
    modulo: "expenses",
    singular: "Egreso",
    plural: "Egresos",
    filter: true,
    permiso: "",
    extraData: true,
    // hideActions: { add: true },
  };

  const fields = useMemo(() => {
    return {
      id: { rules: [], api: "e" },
      date_at: { rules: ["required"], 
        api: "ae", 
        label: "Fecha",
         form: { type: "text" }, 
         list: { } }, 
      category_id: { rules: ["required"], 
        api: "ae",
         label: "Categoria",          
        form: {
            type: "select", 
            options: (items: any) => {
  
              let data: any = [];
              items?.extraData?.categories?.map((c: any) => {
                data.push({
                  id: c.id,
                  name: c.name,
                });
              });
              return data;
            },
          },
          list: {
            onRender: (props: any) => {
              return props.item.category?.name || `ID: ${props.item.category_id}`;
            }
           } }, 
      subcategory_id: { rules: [""], 
        api: "", 
        label: "Subcategoria", 
         list: { 
          onRender: (props: any) => {
            return props.item.category?.name || `ID: ${props.item.category_id}`;
          }
         } },    
      description: { rules: ["required"], 
        api: "ae", 
        label: "Descripción", 
        form: { type: "text" }, 
      },
      status: { rules: ["required"], 
        api: "ae",
         label: "Estado",
          
          list: { } },    

      amount: { rules: ["required"], 
        api: "ae", 
        label: "Monto",
        form: { type: "number" },
         list: { 
          onRender: (props: any) => {
            return "Bs " + formatNumber(props.item.amount);
          }
         } }, 

      client_id: { rules: ["required"], 
        api: "ae", 
        label: "Cliente", 
        form: { type: "text" }, 
       }, 
      user_id: { rules: ["required"], 
        api: "ae", 
        label: "Usuario", 
        form: { type: "text" },
        }, 
      file: {
        rules: ["required"],
        api: "ae*",
        label: "Archivo",
        form: {
            type: "fileUpload",
            ext: ["pdf", "doc", "docx", "xls", "xlsx", "jpg", "jpeg", "png"],
            style: { width: "100%" },
        },  
      },  
      ext: { rules: ["required"], 
        api: "ae",
         label: "Ext",
          form: { type: "text" }, 
        }, 
      
    };
  }, []);

  const onImport = () => {
    setOpenImport(true);
  };

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
    _onImport: onImport,
  });
  const { onLongPress, selItem, searchState, setSearchState } = useCrudUtils({
    onSearch,
    searchs,
    setStore,
    mod,
    onEdit,
    onDel,
  });

  const [openImport, setOpenImport] = useState(false);
  useEffect(() => {
    setOpenImport(searchState == 3);
  }, [searchState]);
  if (!userCan(mod.permiso, "R")) return <NotAccess />;
  return (
    <div className={styles.users}>
      <List />
    </div>
  );
};

export default Outlays;
