'use client'
import Defaulters from '@/modulos/Defaulters/Defaulters'
import React, { useEffect, useState } from 'react'
import styles from './DefaultersView.module.css'
import WidgetDefaulterResume from '../ Widgets/WidgetDefaulterResume/WidgetDefaulterResume'
import useAxios from '@/mk/hooks/useAxios'
import GraphBase from '@/mk/components/ui/Graphs/GraphBase'
import { MONTHS_S } from '@/mk/utils/date'
import Table from '@/mk/components/ui/Table/Table'
import { getFullName } from '@/mk/utils/string'
import { formatNumber } from '@/mk/utils/numbers'
import { useAuth } from '@/mk/contexts/AuthProvider'
import DataSearch from '@/mk/components/forms/DataSearch/DataSearch'
import { IconExport } from '../layout/icons/IconsBiblioteca'
import LoadingScreen from '@/mk/components/ui/LoadingScreen/LoadingScreen'

const DefaultersView = () => {
    const { data: defaulters, reLoad } = useAxios("/defaulters", "GET", {
     
        fullType: "DET",
      });  
    //   console.log(defaulters,'defaltss')

      const [dataTable, setDataTable]: any = useState([]);
      const [searchState,setSearchState]:any= useState('')
      const {setStore} = useAuth();
  

      useEffect(() => {
        if (defaulters?.data) {
            setStore({title:'Morosos'})
          setDataTable(defaulters?.data?.defaulters);
        }
      }, [defaulters?.data]);

      const setSearch = async (v: String) => {
        let name = "search";
        const l: any = [];
        defaulters?.data?.defaulters?.map((moro:any) => {
          if (
            v == "" ||
            getFullName(moro?.titular?.owner)
              .toUpperCase()
              .indexOf(v.toUpperCase()) >= 0 ||
            moro.dpto.indexOf(v) >= 0
          ) {
            l.push(moro);
          }
        });
        setSearchState(v);
        setDataTable(l);
      };

 const header: any = [
    {
      key: "dpto",
      label: "Unidad",
      width: "170px",
    },
    {
      key: "titular",
      label: "Titular",
      onRender:(props:any)=>{
        console.log(props,'p[rososor')
        return getFullName(props?.item?.titular?.owner)}
    },
    {
        key: "count",
        label: "Expensa atrasada",
        onRender:(props:any)=> {
            const s = props?.item?.count > 1? "s":"";
            return props?.item?.count + " expensa" + s}
    },
    {
       key: "multa",
       label: "Multa",
       onRender: (props: any) => {
        return "Bs " + formatNumber(props?.item?.multa)
    }
},
  {
    key: "total",
    label: "Total",
    onRender: (props: any) => {
        return "Bs " + formatNumber(props?.item?.expensa + props?.item?.multa)
        }
  }
    
  ];
  const exportar = () => {
    reLoad({ exportar: 1, searchBy: searchState });
  };



  return (
    <LoadingScreen >    
      <div className={styles.defaultersView}>
        <div>
        En esta sección tendrás una visión clara y detallada del estado financiero. <br/>
        Podrás mantener un control sobre los pagos atrasados de los residentes y tomar medidas para garantizar la estabilidad financiera de tu condominio
        </div>
        <section>
        <GraphBase
            data={{
              labels: MONTHS_S.slice(1, 13),
              values: [
                {
                  name: "Expensas",
                  values: [defaulters?.data?.porCobrarExpensa],
                },
                {
                  name: "Multas",
                  values: [defaulters?.data?.porCobrarMulta],
                },
              ],
            }}
            chartTypes={["pie"]}
            background="darkv2"
            downloadPdf

            options={{
              title: "",
              subtitle: "",
              label: "",

              colors: ["#4C98DF", "#FF5B4D"],
              height: 350,
              width: 350,
            }}
          />
        <WidgetDefaulterResume
              title={"Expensas "}
              amount={defaulters?.data?.porCobrarExpensa}
              units={defaulters?.data?.defaulters?.length + ""}
              pointColor={"var(--cInfo)"}
            />
              <WidgetDefaulterResume
              title={"Multas "}
              amount={defaulters?.data.porCobrarMulta}
              units={
                defaulters?.data?.morososMultaCount +
                "/" +
                defaulters?.data?.defaulters?.length
              }
              pointColor={"var(--cError)"}
            />
              <WidgetDefaulterResume
              title={"Total de morosidad "}
              amount={defaulters?.data?.porCobrarExpensa + defaulters?.data?.porCobrarMulta}
               
            />
        </section>

      {/* <Defaulters />     */}
      <div style={{height:'var(--spL)'}}></div>
      <section>
        <div>
            <DataSearch
                    name='defaulterSearch'
                    setSearch={setSearch}
                    //   onClear={onClearSearch}
                    value={searchState}
                   className={styles.datasearch}
                    />
            <div>        
              <IconExport
                size={32}
                onClick={() => exportar()}
                />
           </div> 
        </div>    
        <Table
        data={dataTable} 
        header={header}
        className='striped'
        />

      </section>
    </div>
    </LoadingScreen>
 
  )
}

export default DefaultersView