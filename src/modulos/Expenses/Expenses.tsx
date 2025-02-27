'use client'
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
// import styles from "./Educations.module.css";
import ItemList from "@/mk/components/ui/ItemList/ItemList";
import useCrudUtils from "../shared/useCrudUtils";
import { useMemo } from "react";
import RenderItem from "../shared/RenderItem";
import { MONTHS, MONTHS_S } from "@/mk/utils/date";
import { formatNumber } from "@/mk/utils/numbers";

const mod: ModCrudType = {
    modulo: "debts",
    singular: "Expensa",
    plural: "Expensas",
    // import: true,
    // importRequiredCols:"NAME",
    filter:true,
    permiso: "",

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
  


const Expenses = () => {

        const lAnios: any = [{ id: "", name: "Todos" }];
        const lastYear = new Date().getFullYear();
        for (let i = lastYear; i >= 2000; i--) {
        lAnios.push({ id: i, name: i });
        }


    const today = new Date();
    const units = (unidades: AssignedList) => {
        return unidades.length;
    };
    const sumExpenses = (unidades: AssignedList) => {
        let sum = 0;
        unidades.map((uni) => {
            sum = sum + Number(uni.amount);
        });
        return sum;
    };
    const paidUnits= (unidades:AssignedList) => {
        let cont = 0;
        unidades.map((uni) => {
                 // && uni.status != "X"
          if (uni.status == "P") {
            cont = cont + 1;
          }
        });
  
        return cont;
      };
      const sumPaidUnits = (unidades:AssignedList) => {
        let sum = 0;
        unidades.map((uni) => {
          if (uni.status == "P") {
            sum += Number(uni.amount) + Number(uni.penalty_amount);
          }
        });
        return sum;
      };
   
    const unitsPayable = (unidades:AssignedList) => {
        let cont = 0;
        // let c = "";
        unidades.map((uni) => {
          if (uni.status != "P" && uni.status != "X") {
            cont = cont + 1;
          }
        });
        // return c;
        return cont;
      };  
    const isUnitInDefault = (props:Debt)=>{
       return  unitsPayable(props?.asignados) > 0 && new Date(props?.due_at) < today 
    }
    const sumPenalty = (unidades:AssignedList) => {
        let sum: number = 0;
        unidades.map((uni) => {
          sum = sum + Number(uni.penalty_amount);
        });
        return sum;
      };  

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
            year: {
                rules: ["required"],
                api: "ae",
                label: "Año",
                form: { type: "text" },
                filter: {
                    label: 'Año',
                    width: '200px',
                    options: ()=>lAnios,
                  },

            },
            month: {
                rules: ["required"],
                api: "ae",
                label: "Mes",
                form: {
                    type: "select",
                    options: MONTHS.map((month, index) => ({
                        id: index + 1,
                        name: month,
                    })),
                },
                filter:{
                    label: "Meses",
                    width: "200px",
                  
                    options:()=> MONTHS.map((month, index) => ({
                        id: index ,
                        name: month,
                        })),
                }
            },
            due_at: {
                rules: ["required"],
                api: "ae",
                label: "Fecha de vencimiento",
                form: { type: "date" },
            },
            category_id: {
                rules: ["required"],
                api: "ae",
                label: "Categoría",
                form: {
                    type: "select",
                    options: [
                        { id: 1, name: 'Expensas' }
                    ]
                },

            },
            description: {
                rules: [""],
                api: "ae",
                label: "Descripción (Opcional)",
                form: { type: "textArea" },
            },
            asignar: {
                rules: ["required"],
                api: "ae",
                label: "Asignar a",
                form: {
                    type: "check",

                }
            },
            dpto_id: {
                rules: ["required"],
                api: "ae",
                label: "Departamento",
                form: {
                    type: "select",
                    options: [
                        { id: 1, name: 'Ventas' }
                    ]
                },

            },
            assignedUnits: {
                rules: [""],
                api: "",
                label: "Unidades asignadas",
                list: {
                    onRender: (props: any) => {
                        return ( units(props?.item?.asignados) + " U")
                    }
                }
            },
            totalExpensesSum: {
                rules: [""],
                api: "",
                label: "Monto total de expensas",
                list: {
                    onRender: (props: any) => {
                        return (<div>{"Bs " + formatNumber(sumExpenses(props?.item?.asignados))}</div>)
                    }
                }
            },
            paidUnits: {
                rules:[""],
                api:"",
                label:"Unidades pagadas",
                list:{
                    onRender:(props:any)=>{
                        return(<div>Bs. {formatNumber(paidUnits(props?.item?.asignados))}</div>)}}
        },
            ammountsCollected: {
                rules: [""],
                api: "",
                label: "Monto cobrado",
                list: {
                    onRender: (props: any) => {
                        return (<div>{"Bs " + formatNumber(sumPaidUnits(props?.item?.asignados))}</div>)
                    }
                }
            },
            unitsPayable:{
                rules:[""],
                api:"",
                label:"Unidades a pagar",
                list:{
                    onRender:(props:any)=>{
                        return(<div style={{color:isUnitInDefault(props?.item)?'var(--cError)':''}}>{unitsPayable(props?.item?.asignados)}  U</div>)}}
                    },
            payStatus: {
                rules: [""],
                api: "",
                label: "Estado",
                list: { 
                    onRender: (props: any) => {
                        return (isUnitInDefault(props?.item)? <div style={{color:'var(--cError)'}}>En mora</div> : <div>Vigente</div>)
                } }
            },
           sumPenalty: {
            rules: [""],
            api: "",
            label: "Multa total de mora",
            list: {
                onRender: (props: any) => {
                    return (<div>{"Bs " + formatNumber(sumPenalty(props?.item?.asignados))}</div>)
           }}
        },
        totalAmmountCollected: {
            rules:[""],
            api:"",
            label:"Monto total a cobrar",
            list:{
                onRender:(props:any)=>{
                    return(<div>{"Bs. " +
                        formatNumber(
                          sumExpenses(props?.item?.asignados) +
                            sumPenalty(props?.item?.asignados) -
                            sumPaidUnits(props?.item?.asignados)
                        )}</div>)
        }}
    }        


            
            
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
    return (
        <div >
            <List onTabletRow={renderItem} />
        </div>
    );
};

export default Expenses;
