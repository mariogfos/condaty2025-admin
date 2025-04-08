'use client'
import React, { useEffect, useMemo, useState } from 'react'
import styles from './DefaultersView.module.css'

import useAxios from '@/mk/hooks/useAxios'
import GraphBase from '@/mk/components/ui/Graphs/GraphBase'
import { getFullName } from '@/mk/utils/string'
import { formatNumber } from '@/mk/utils/numbers'
import { useAuth } from '@/mk/contexts/AuthProvider'
import { IconExport, IconBilletera, IconMultas, IconHandcoin } from '../../components/layout/icons/IconsBiblioteca'
import LoadingScreen from '@/mk/components/ui/LoadingScreen/LoadingScreen'
import useCrud from '@/mk/hooks/useCrud/useCrud'
import WidgetDefaulterResume from '@/components/ Widgets/WidgetDefaulterResume/WidgetDefaulterResume'



const DefaultersView = () => {
    const { setStore } = useAuth();
    
    // Definir opciones para los filtros
    const getUnidadOptions = () => [
        { id: "", name: "Todas" },
        { id: "A", name: "Bloque A" },
        { id: "B", name: "Bloque B" },
        { id: "C", name: "Bloque C" }
    ];
    
    const getExpensaOptions = () => [
        { id: "", name: "Todas" },
        { id: "1", name: "1 expensa" },
        { id: "2", name: "2 expensas" },
        { id: "3", name: "3 o más" }
    ];

    // Definir el módulo para useCrud
    const mod = {
        modulo: "defaulters",
        singular: "Moroso",
        plural: "Morosos",
        permiso: "",
        extraData: true,
        hideActions: {
            view: true,
            add: true,
            edit: false,
            del: false
        },
        filter: true,
        saveMsg: {
            add: "Moroso creado con éxito",
            edit: "Moroso actualizado con éxito",
            del: "Moroso eliminado con éxito"
        }
    };

    // Parámetros iniciales para la carga de datos
    const paramsInitial = {
       fullType: "L",
    };

    // Definición de campos para el CRUD con filtros
    const fields = useMemo(
        () => ({
            dpto: {
                rules: [],
                api: "ae",
                label: "Unidad",
                width: "170px",
                list: {
                    width: "170px"
                },
                /* filter: {
                    label: "Unidad",
                    width: "150px",
                    options: getUnidadOptions
                } */
            },
            titular: {
                rules: [],
                api: "ae",
                label: "Titular",
                list: { 
                    onRender: (props: any) => {
                        return getFullName(props?.item?.titular?.owner);
                    }
                }
            },
            count: {
                rules: [],
                api: "ae",
                label: "Expensa atrasada",
                list: { 
                    onRender: (props: any) => {
                        const s = props?.item?.count > 1 ? "s" : "";
                        return props?.item?.count + " expensa" + s;
                    }
                },
               /*  filter: {
                    label: "Expensas",
                    width: "150px",
                    options: getExpensaOptions
                } */
            },
            multa: {
                rules: [],
                api: "ae",
                label: "Multa",
                list: { 
                    onRender: (props: any) => {
                        return "Bs " + formatNumber(props?.item?.multa);
                    }
                }
            },
            total: {
                rules: [],
                api: "ae",
                label: "Total",
                list: { 
                    onRender: (props: any) => {
                        return "Bs " + formatNumber(props?.item?.expensa + props?.item?.multa);
                    }
                }
            },
        }),
        []
    );

    // Exportar función para el botón de exportar
    const exportar = () => {
        execute("/defaulters", "GET", { exportar: 1 }, false);
    };

    // Botones adicionales para la tabla
    const extraButtons = [
        <div key="export-button" onClick={exportar} className={styles.exportButton}>
            <IconExport size={32} />
        </div>
    ];

    // Uso del hook useCrud con la configuración definida
    const {
        userCan,
        List,
        onView,
        onEdit,
        onDel,
        reLoad,
        onAdd,
        execute,
        setParams,
        data,
        extraData
    } = useCrud({
        paramsInitial,
        mod,
        fields,
        extraButtons
    });

    // Estado para controlar el número total de defaulters
    const [defaultersLength, setDefaultersLength] = useState(0);
    
    // Actualizar datos cuando cambia extraData
    useEffect(() => {
        if (data?.data) {
            setDefaultersLength(data.data.length || 0);
        }
    }, [data]);

    useEffect(() => {
        setStore({ title: 'Morosos' });
        
        // Log para depuración
        console.log("Parámetros iniciales:", paramsInitial);
    }, []);

    // Calcular el total de morosidad
    const totalMorosidad = (extraData?.porCobrarExpensa || 0) + (extraData?.porCobrarMulta || 0);
    
    // Calcular porcentajes para la gráfica
    const porcentajeExpensas = totalMorosidad > 0 
        ? Math.round((extraData?.porCobrarExpensa || 0) / totalMorosidad * 100) 
        : 0;
    const porcentajeMultas = totalMorosidad > 0 
        ? Math.round((extraData?.porCobrarMulta || 0) / totalMorosidad * 100) 
        : 0;

    // Componente del panel derecho con gráfico y widgets
    const renderRightPanel = () => {
        return (
            <div className={styles.rightPanel}>
                <div className={styles.graphPanel}>
                    <GraphBase
                        data={{
                            labels: ["Expensas", "Multas"],
                            values: [
                                {
                                    name: "Morosidad",
                                    values: [
                                        extraData?.porCobrarExpensa || 0,
                                        extraData?.porCobrarMulta || 0
                                    ],
                                },
                            ],
                        }}
                        chartTypes={["donut"]}
                        background="darkv2"
                        downloadPdf
                        options={{
                            title: "Representación gráfica del estado general de morosos",
                            subtitle: "",
                            label: "Total de morosidad general entre expensas y multas",
                          /*   labelValue: `Bs ${formatNumber(totalMorosidad)}`,
                            showPercent: true,
                            percentValues: [porcentajeExpensas, porcentajeMultas], */
                            colors: ["#b996f6", "#f4be77"],
                            height: 400,
                            width: 400,
                        }}
                    />
                </div>
                
                <div className={styles.widgetsPanel}>
                <WidgetDefaulterResume
                    title={"Total de expensas"}
                    amount={`Bs ${formatNumber(extraData?.porCobrarExpensa || 0)}`}
                    pointColor={"var(--cInfo)"}
                    icon={<IconBilletera size={26} color="#f7b267" />}
                    backgroundColor="rgba(247, 178, 103, 0.2)"
                    textColor="white"
                />
                                    
                <WidgetDefaulterResume
                    title={"Total de multas"}
                    amount={`Bs ${formatNumber(extraData?.porCobrarMulta || 0)}`}
                    pointColor={"var(--cError)"}
                    icon={<IconMultas size={26}  color="#b996f6" />}
                    backgroundColor="rgba(185, 150, 246, 0.2)"
                    textColor="white"
                />
                                    
                <WidgetDefaulterResume
                    title={"Total de morosidad"}
                    amount={`Bs ${formatNumber(totalMorosidad)}`}
                    pointColor={"var(--cSuccess)"}
                    icon={<IconHandcoin size={26} color="#4ED58C" />}
                    backgroundColor="rgba(78, 213, 140, 0.2)"
                    textColor="white"
                />
                </div>
            </div>
        );
    };

    return (
        <LoadingScreen>    
            <div className={styles.container}>
                <h1 className={styles.title}>Morosos</h1>
                <p className={styles.subtitle}>
                    En esta sección tendrás una visión clara y detallada del estado financiero.<br/>
                    Podrás mantener un control sobre los pagos atrasados de los residentes y tomar medidas para garantizar la estabilidad financiera de tu condominio
                </p>
                
                <div className={styles.listContainer}>
                    <List renderRight={renderRightPanel} />
                </div>
            </div>
        </LoadingScreen>
    )
}

export default DefaultersView