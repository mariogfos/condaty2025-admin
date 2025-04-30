"use client";
import Table from "@/mk/components/ui/Table/Table";
import { formatNumber } from "@/mk/utils/numbers";
import React, { useEffect, useState } from "react";
import WidgetBase from "../WidgetBase/WidgetBase";
import Select from "@/mk/components/forms/Select/Select";
import styles from "./WidgetTableAffProv.module.css";

const colors = ["#F08080", "#F7B267", "#F8DDA4", "#A2D2BF", "#00AF90"];

const WidgetTableAffProv = ({ widget, data, type, filters }: any) => {
  const [orden, setOrden] = useState("name");
  // Formatear los datos de los departamentos
  const dataFormattedDpto = () => {
    let newData: any = [];

    data?.forEach((item: any, i: number) => {
      // console.log('itemid',item)
      // if(!item.id){

      // }
      const d = widget[item?.id];
      if (d) {
        newData.push({
          name: item?.name,
          afiliados: d[0],
          distribucion: d[1] ? (d[0] * 100) / d[1] : 0,
          habilitados: d[1],
        });
      }
    });
    const d = widget[0];
    newData.push({
      name: "Afiliados sin departamento",
      afiliados: d[0],
      distribucion: d[1] ? (d[0] * 100) / d[1] : 0,
      habilitados: d[1],
    });
    if (orden == "name") {
      newData.sort((a: any, b: any) => a[orden]?.localeCompare(b[orden]));
    }
    newData.sort((a: any, b: any) => b[orden] - a[orden]);
    // console.log(newData);
    return newData;
  };

  const dataFormattedMun = () => {
    let locals = data?.filter(
      (item: any) => item?.dpto_id === filters?.dpto_idV
    );
    let newData: any = [];

    locals?.forEach((item: any) => {
      const d = widget[item?.id];
      if (d) {
        newData.push({
          name: item?.name,
          afiliados: d[0],
          distribucion: d[1] ? (d[0] * 100) / d[1] : 0,
          habilitados: d[1],
        });
      }
    });

    if (orden == "name") {
      newData.sort((a: any, b: any) => a[orden]?.localeCompare(b[orden]));
    }
    newData.sort((a: any, b: any) => b[orden] - a[orden]);
    return newData;
  };
  useEffect(() => {
    if (type == "dpto") {
      dataFormattedDpto();
    }
    if (type == "mun") {
      dataFormattedMun();
    }
  }, [orden]);

  const getBackground = (value: any) => {
    if (value < 20) {
      return colors[0];
    } else if (value < 40) {
      return colors[1];
    }
    if (value < 60) {
      return colors[2];
    }
    if (value < 80) {
      return colors[3];
    }
    return colors[4];
  };

  const header: any = [
    {
      key: "index",
      label: "Nº",
      width: "50px",
      onRender: (item: any) => item.i,
    },
    {
      key: "name",
      label: type == "dpto" ? "Departamento" : "Municipio",
    },
    {
      key: "afiliados",
      label: "Afiliados",
      width: "90px",
      responsive: "onlyDesktop",
      style: { justifyContent: "flex-end", textAlign: "right" },
      onRender: (item: any) => formatNumber(item.value, 0),
      sumarize: true,
    },
    {
      key: "habilitados",
      label: "Habilitados",
      width: "100px",
      responsive: "onlyDesktop",
      style: { justifyContent: "flex-end", textAlign: "right" },
      onRender: (item: any) => formatNumber(item.value, 0),
      sumarize: true,
    },
    {
      key: "distribucion",
      label: "Distribución en %",
      width: "100px",
      style: {
        textAlign: "center",
        padding: 0,
      },
      onRender: (item: any) => (
        <div
          style={{
            backgroundColor: getBackground(item.value),
            flexGrow: 1,
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            color: "var(--cBlack)",
          }}
        >
          {formatNumber(item.value, 1) + "%"}
        </div>
      ),
    },
  ];
  return (
    <WidgetBase
      title={
        <div className={styles.containerTitle}>
          <p>Afiliados por {type == "dpto" ? "Departamento" : "Municipio"}</p>
          <div style={{ width: "200px" }}>
            <Select
              name="orden"
              value={orden}
              onChange={(e: any) => setOrden(e.target.value)}
              options={[
                { id: "name", name: "Nombre" },
                { id: "afiliados", name: "Afiliados" },
                { id: "distribucion", name: "Distribución" },
                { id: "habilitados", name: "Habilitados" },
              ]}
            />
          </div>
        </div>
      }
    >
      <Table
        data={type == "dpto" ? dataFormattedDpto() : dataFormattedMun()}
        header={header}
        className="striped"
        sumarize={true}
        // height="340px"
      />
    </WidgetBase>
  );
};

export default WidgetTableAffProv;
