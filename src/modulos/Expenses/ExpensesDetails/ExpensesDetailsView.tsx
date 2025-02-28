'use client'
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
// import styles from "./Educations.module.css";
import ItemList from "@/mk/components/ui/ItemList/ItemList";

import { useMemo, useState } from "react";

import { MONTHS, MONTHS_S } from "@/mk/utils/date";
import { formatNumber } from "@/mk/utils/numbers";
import Check from "@/mk/components/forms/Check/Check";
import RenderItem from "@/modulos/shared/RenderItem";
import useCrudUtils from "@/modulos/shared/useCrudUtils";
import WidgetBase from "@/components/ Widgets/WidgetBase/WidgetBase";
import { IconArrowLeft } from "@/components/layout/icons/IconsBiblioteca";




const mod: ModCrudType = {
    modulo: "debts",
    singular: "Expensa",
    plural: "Expensas",
    // import: true,
    // importRequiredCols:"NAME",
    filter:true,

    permiso: "",
    extraData: true,

};

interface Assigned {
    id: number;
    debt_id: string;
    amount: number;
    penalty_amount: number;
    status: string;
}


type AssignedList = Assigned[];


  interface Debt {
    id: string;
    clientId: string;
    amount: number;
    asignados: AssignedList;
    begin_at: string | null;
    categoryId: number;
    created_at: string;
    deleted_at: string | null;
    description: string;
    due_at: string;
    month: number;
    status: string;
    updated_at: string;
    year: number;
  }
  


const ExpensesDetails = () => {
const [openDetail,setOpenDetail]:any= useState(false)
 
   



    const paramsInitial = {
        perPage: -1,
        page: 1,
        fullType: "L",
        searchBy: "",

    };

    const fields = useMemo(() => {
        return {
            id: { rules: [], api: "e" },
            period: {
                rules: [""],
                api: "",
                label: "Periodo",
                list: {
                    onRender: (props: any) => {
                        return <div>{MONTHS_S[props?.item?.month]}/{props?.item?.year}</div>
                    }
                },

            },
    
       

            
            
    }
    }, []);

    const { userCan, List, setStore, onSearch, searchs, onEdit, onDel } = useCrud(
        {
            paramsInitial,
            mod,
            fields,
        }
    );
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
            <RenderItem item={item} onClick={onClickDetail} onLongPress={onLongPress}>
                <ItemList
                    title={item?.name}
                    subtitle={item?.description}
                    variant="V1"
                    active={selItem && selItem.id == item.id}
                />
            </RenderItem>
        );
    };
    const onClickDetail = (row: any) => {
        // const url = `/detailSurveys?id=${row.id}`;
    
        // window.location.href = url;
        setOpenDetail(true)
      };

    if (!userCan(mod.permiso, "R")) return <NotAccess />;

return(
       <div>
        <div style={{display:'flex',alignItems:'center',cursor:'pointer'}}><IconArrowLeft/> <p>Volver</p></div>
        <WidgetBase>
          assaa
        </WidgetBase>
           <List 
           onTabletRow={renderItem}
           onRowClick={onClickDetail}  />
        </div>)
    
};

export default ExpensesDetails;
