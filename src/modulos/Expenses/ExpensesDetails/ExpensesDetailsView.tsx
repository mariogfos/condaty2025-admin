'use client'
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import useAxios from "@/mk/hooks/useAxios";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import styles from "./ExpensesDetailsView.module.css";
import ItemList from "@/mk/components/ui/ItemList/ItemList";

import { useMemo, useState, useEffect } from "react";

import { getDateStrMes, MONTHS, MONTHS_S } from "@/mk/utils/date";
import { formatNumber } from "@/mk/utils/numbers";
import Check from "@/mk/components/forms/Check/Check";
import RenderItem from "@/modulos/shared/RenderItem";
import useCrudUtils from "@/modulos/shared/useCrudUtils";
import WidgetBase from "@/components/ Widgets/WidgetBase/WidgetBase";
import { IconArrowLeft, IconBilletera, IconHandcoin, IconHome, IconMonedas, IconMultas, IconUnidades } from "@/components/layout/icons/IconsBiblioteca";
import { StatusDetailExpColor, sumExpenses, sumPenalty } from "@/mk/utils/utils";
import RenderView from "./RenderView/RenderView";
import LoadingScreen from "@/mk/components/ui/LoadingScreen/LoadingScreen";

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

const ExpensesDetails = ({data, setOpenDetail}:any) => {
  // Estado para estadísticas
  const [statsData, setStatsData] = useState({
    totalUnits: 0,
    paidUnits: 0,
    overdueUnits: 0,
    totalAmount: 0,
    paidAmount: 0,
    penaltyAmount: 0,
    pendingAmount: 0
  });

  // Obtener datos de detalles de expensas directamente con useAxios
  const { data: expenseDetails } = useAxios(
    "/debt-dptos",
    "GET", 
    {
      perPage: -1,
      page: 1,
      fullType: "L",
      debt_id: data?.id,
    }
  );
  
  // Actualizar estadísticas cuando se cargan los datos
  useEffect(() => {
    if (expenseDetails?.data && expenseDetails.data.length > 0) {
      const expensesData = expenseDetails.data;
      
      // Calcular estadísticas
      const totalUnits = expensesData.length;
      const paidUnits = expensesData.filter((item: any) => item.status === 'P').length;
      const overdueUnits = expensesData.filter((item: any) => item.status === 'M').length;
      
      const totalAmount = expensesData.reduce((sum: number, item: any) => 
        sum + parseFloat(item.amount || 0), 0);
      const paidAmount = expensesData.filter((item: any) => item.status === 'P')
        .reduce((sum: number, item: any) => sum + parseFloat(item.amount || 0), 0);
      const penaltyAmount = expensesData.reduce((sum: number, item: any) => 
        sum + parseFloat(item.penalty_amount || 0), 0);
      const pendingAmount = totalAmount - paidAmount;
      
      setStatsData({
        totalUnits,
        paidUnits,
        overdueUnits,
        totalAmount,
        paidAmount,
        penaltyAmount,
        pendingAmount
      });
    }
  }, [expenseDetails]);
  
  const mod: ModCrudType = {
    modulo: "debt-dptos",
    singular: "Expensa",
    plural: "Expensas",
    filter: true,
    hideActions: {
      add: true,
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
          onRender: (props: any) => {return <div>{getDateStrMes(props?.item?.paid_at) || "En espera"}</div>}
        }},
      due_at:{
        rules: [""],
        api:"",
        label: "Fecha de vencimiento",
        list: {
          onRender: (props: any) => {return <div>{getDateStrMes(props?.item?.debt?.due_at)}</div>}
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
            const statusClass = `${styles.statusBadge} ${styles[`status${props?.item?.status}`]}`;
            return (
              <div className={statusClass}>
                {getStatus(props?.item?.status)}
              </div>
            );
          }
        }
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
    <div className={styles.ExpensesDetailsView}>
      <div className={styles.backButton} onClick={() => setOpenDetail(false)}>
        <IconArrowLeft />
        <p>Volver a sección expensas</p>
      </div>
      
      <LoadingScreen>
      <div className={styles.dashboardContainer}>
           <h1 className={styles.dashboardTitle}>
             Expensas de {MONTHS[data?.month]} {data?.year}
           </h1>
           
           <div className={styles.allStatsRow}> {/* Contenedor principal flex */}
            {/* NUEVO: Grupo Izquierdo (3 tarjetas) */}
          <div className={styles.statGroupLeft}> 
               <div className={styles.statCard}>
                 <div className={styles.statContent}>
                   <span className={styles.statValue}>{statsData.totalUnits}</span>
                   <span className={styles.statLabel}>Unidades asignadas</span>
                 </div>
                 <div className={styles.statIconContainer}>
                   <IconUnidades className={styles.iconDefault} />
                 </div>
               </div>
               
               <div className={styles.statCard}>
                 <div className={styles.statContent}>
                   <span className={styles.statValue}>{statsData.paidUnits}</span>
                   <span className={styles.statLabel}>Unidades al día</span>
                 </div>
                 <div className={`${styles.statIconContainer} ${styles.iconPaid}`}>
                   <IconUnidades className={styles.iconPaidColor} />
                 </div>
               </div>
               
               <div className={styles.statCard}>
                 <div className={styles.statContent}>
                   <span className={styles.statValue}>{statsData.overdueUnits}</span>
                   <span className={styles.statLabel}>Unidades morosas</span>
                 </div>
                 <div className={`${styles.statIconContainer} ${styles.iconOverdue}`}>
                   <IconUnidades className={styles.iconOverdueColor} />
                 </div>
               </div>
           </div> {/* Fin Grupo Izquierdo */}
           <div className={styles.divider}></div>

           {/* NUEVO: Grupo Derecho (4 tarjetas) */}
            <div className={styles.statGroupRight}>
               <div className={styles.statCard}>
                 <div className={styles.statContent}>
                   <span className={styles.statValue}>{formatNumber(statsData.totalAmount)}</span>
                   <span className={styles.statLabel}>Monto total de expensa</span>
                 </div>
                 <div className={styles.statIconContainer}>
                   <IconMonedas className={styles.iconDefault} />
                 </div>
               </div>
               
               <div className={styles.statCard}>
                 <div className={styles.statContent}>
                   <span className={styles.statValue}>{formatNumber(statsData.paidAmount)}</span>
                   <span className={styles.statLabel}>Monto cobrado</span>
                 </div>
                 <div className={`${styles.statIconContainer} ${styles.iconPaid}`}>
                   <IconBilletera className={styles.iconPaidColor} />
                 </div>
               </div>
               
               <div className={styles.statCard}>
                 <div className={styles.statContent}>
                   <span className={styles.statValue}>{formatNumber(statsData.penaltyAmount)}</span>
                   <span className={styles.statLabel}>Monto por multas</span>
                 </div>
                 <div className={`${styles.statIconContainer} ${styles.iconPenalty}`}>
                   <IconMultas className={styles.iconPenaltyColor} />
                 </div>
               </div>
               
               <div className={styles.statCard}>
                 <div className={styles.statContent}>
                   <span className={styles.statValue}>{formatNumber(statsData.pendingAmount)}</span>
                   <span className={styles.statLabel}>Monto por cobrar</span>
                 </div>
                 <div className={`${styles.statIconContainer} ${styles.iconOverdue}`}>
                   <IconHandcoin className={styles.iconOverdueColor} />
                 </div>
               </div>
           </div> {/* Fin Grupo Derecho */}
           </div>
         </div>
        
        <List onTabletRow={renderItem} />
      </LoadingScreen>
    </div>
  );
};

export default ExpensesDetails;