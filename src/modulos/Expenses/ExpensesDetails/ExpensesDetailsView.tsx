'use client'
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import styles from "./ExpensesDetailsView.module.css";
import ItemList from "@/mk/components/ui/ItemList/ItemList";

import { useMemo, useState } from "react";

import { getDateStrMes, MONTHS, MONTHS_S } from "@/mk/utils/date";
import { formatNumber } from "@/mk/utils/numbers";
import Check from "@/mk/components/forms/Check/Check";
import RenderItem from "@/modulos/shared/RenderItem";
import useCrudUtils from "@/modulos/shared/useCrudUtils";
import WidgetBase from "@/components/ Widgets/WidgetBase/WidgetBase";
import { IconArrowLeft } from "@/components/layout/icons/IconsBiblioteca";
import { StatusDetailExpColor, sumExpenses, sumPenalty } from "@/mk/utils/utils";
import RenderView from "./RenderView";







const getStatus = (status:string) => {
  let _status;
  if (status == "A") _status = "Por cobrar";
  if (status == "E") _status = "En espera";
  if (status == "P") _status = "Cobrado";
  if (status == "S") _status = "Por confirmar";
  if (status == "M") _status = "Moroso";
  if (status == "R") _status = "Rechazado";
  return _status;
};
  


const ExpensesDetails = ({data,setOpenDetail}:any) => {
 console.log('first',data)
  const mod: ModCrudType = {
    modulo: "debt-dptos",
    singular: "Expensa",
    plural: "Expensas",
    // import: true,
    // importRequiredCols:"NAME",
    filter:true,
    hideActions:{
      add:true,
      edit: data?.status !== 'A',
      del: data?.status !== 'A',
    },
      renderView: (props: {
            open: boolean;
            onClose: any;
            item: Record<string, any>;
            onConfirm?: Function;
          }) => <RenderView {...props} />,

    permiso: "",
    extraData: true,

};
 
   



    const paramsInitial = {
        perPage: -1,
        page: 1,
        fullType: "L",
        debt_id: data.id,

    };

    const fields = useMemo(() => {
        return {
            id: { rules: [], api: "e" },
            unit: {
                rules: [""],
                api: "",
                label: "Unidad",
                list: {
                    onRender: (props: any) => {return <div>{props?.item?.dpto?.nro}</div>}
                },
            },
            address: {
              rules: [""],
              api: "",
              label: "Dirección",
              list: {
                  onRender: (props: any) => {return <div>{props?.item?.dpto?.description}</div>}
              }},
            paid_at:{
              rules: [""],
              api: "",
              label: "Fecha de pago",
              list: {
                onRender: (props: any) => {return <div>{getDateStrMes(props?.item?.dpto?.paid_at) || "En espera"}</div>
            }  
          }},
        due_at:{
          rules: [""],
          api:"",
          label: "Fecha de vencimiento",
          list: {
            onRender: (props: any) => {console.log(props,"props desde render detailsexp"); return <div>{getDateStrMes(props?.item?.debt?.due_at)}</div>}
        }},
        amount:{
          rules: ["required"],
          api:"e",
          label: "Monto",
          list: {
            onRender: (props: any) => {return <div>Bs {formatNumber(props?.item?.amount)}</div>}
              },
          form: {
            type:'text',
            label:'Monto'
          }  
            },
        obs:{
         rules:["required"],
         api:"e",
         label: "Motivo del cambio",
         form: {
          type:'text',
          label:'Motivo del cambio'
         }
        },    

        penalty_amount:{
          rules: [""],
          api:"",
          label: "Multa",
          list: {
            onRender: (props: any) => {return <div>Bs {formatNumber(props.item?.penalty_amount)}</div>}
              }},
        statusDetail:{
          rules: [""],
          api:"",
          label: "Estado",
          list: {
            onRender: (props: any) => {
              return <div style={{color:StatusDetailExpColor[props?.item?.status]}}>
            {getStatus(props?.item?.status)}
          </div>
        }   }},   
        
       

            
            
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
            <RenderItem item={item} onClick={onClick} onLongPress={onLongPress}>
                <ItemList
                    title={item?.name}
                    subtitle={item?.description}
                    variant="V1"
                    active={selItem && selItem.id == item.id}
                />
            </RenderItem>
        );
    };
  
    if (!userCan(mod.permiso, "R")) return <NotAccess />;
    console.log(data,'dataaa')

return(
       <div className={styles.ExpensesDetailsView}>
        <div style={{display:'flex',alignItems:'center',cursor:'pointer'}} onClick={()=>setOpenDetail(false)}><IconArrowLeft/> <p>Volver</p></div>
        <WidgetBase className={styles.header}>
          <section>
            <div>{
                 MONTHS[data?.month] +
                  " " +
                  data?.year
                || "Sin datos"}</div> 
            <div>Estas son las unidades asignadas de este periodo.</div>
            <div>{data?.description}</div>
          </section>
          <section>
          <div>Expensas: {formatNumber(sumExpenses(data?.asignados))} Bs</div>
          <div>Multas: {formatNumber(sumPenalty(data?.asignados))} Bs</div>
          </section>
        </WidgetBase>
           <List 
           onTabletRow={renderItem}/>
        </div>)
    
};

export default ExpensesDetails;
