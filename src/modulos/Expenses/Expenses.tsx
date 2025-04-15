"use client";
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
// import styles from "./Educations.module.css";
import ItemList from "@/mk/components/ui/ItemList/ItemList";
import useCrudUtils from "../shared/useCrudUtils";
import { useMemo, useState } from "react";
import RenderItem from "../shared/RenderItem";
import { MONTHS, MONTHS_S } from "@/mk/utils/date";
import { formatNumber } from "@/mk/utils/numbers";
import RenderForm from "./RenderForm/RenderForm";
import { isUnitInDefault, paidUnits, sumExpenses, sumPaidUnits, sumPenalty, units, unitsPayable } from "@/mk/utils/utils";
import styles from "./Expenses.module.css";
import ExpensesDetails from "./ExpensesDetails/ExpensesDetailsView";


const mod: ModCrudType = {
    modulo: "debts",
    singular: "Expensa",
    plural: "Expensas",
    export: true,
    // import: true,
    // importRequiredCols:"NAME",
    filter:true,

    permiso: "",
    extraData: true,
    hideActions:{
        view:true,
        edit:true,
        del:true,
     },
    onHideActions: (item: any) => {
        return {
          hideEdit: paidUnits(item?.asignados) > 0,
          hideDel:  paidUnits(item?.asignados) > 0,
        };
      },
    renderForm: (props: {
        item: any;
        setItem: any;
        errors: any;
        extraData: any;
        open: boolean;
        onClose: any;
        user: any;
        execute: any;
        setErrors: any;
        action: any;
        openList: any;
        setOpenList: any;
        reLoad:any;
      }) => {
        return (
          <RenderForm
            onClose={props.onClose}
            open={props.open}
            item={props.item}
            setItem={props.setItem}
            errors={props.errors}
            extraData={props.extraData}
            user={props.user}
            execute={props.execute}
            setErrors={props.setErrors}
            reLoad={props.reLoad}
            action={props.action}
            openList={props.openList}
            setOpenList={props.setOpenList}
          />
        );},
        // renderView: (props: {
        //     open: boolean;
        //     onClose: any;
        //     item: Record<string, any>;
        //     onConfirm?: Function;
        //   }) => <RenderView {...props} />,

};

const Expenses = () => {
  const [openDetail, setOpenDetail]: any = useState(false);
  const [detailItem, setDetailItem]: any = useState({});

  const getYearOptions = () => {
    const lAnios: any = [{ id: "", name: "Todos" }];
    const lastYear = new Date().getFullYear();
    for (let i = lastYear; i >= 2000; i--) {
      lAnios.push({ id: i, name: i.toString() });
    }
    return lAnios;
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
                    options: getYearOptions,
                    optionLabel:'name'
                  },

            },
            month: {
                rules: ["required"],
                api: "ae",
                label: "Mes",
                form: {
                    type: "select",
                    options: MONTHS.map((month, index) => ({
                        id: index,
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
                        return(<div>{paidUnits(props?.item?.asignados)} U</div>)}}
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
                              const isInDefault = isUnitInDefault(props?.item);
                              const statusClass = `${styles.statusBadge} ${isInDefault ? styles.statusMora : styles.statusDefault}`;
                              
                              // Primero verificamos si es Pagado
                              if (props.item.status === "P") {
                                  return (
                                      <div className={styles.statusPay}>
                                          Pagado
                                      </div>
                                  );
                              }
                              
                              // Lógica normal para otros estados
                              return (
                                  <div className={statusClass}>
                                      {isInDefault ? "En mora" : "Vigente"}
                                  </div>
                              );
                          }
                      }
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
    setDetailItem(row);
    setOpenDetail(true);
  };

  if (!userCan(mod.permiso, "R")) return <NotAccess />;

  if (openDetail)
    return <ExpensesDetails data={detailItem} setOpenDetail={setOpenDetail} />;
  else
    return (
      <div>
        <List onTabletRow={renderItem} onRowClick={onClickDetail} />
      </div>
    );
};

export default Expenses;
