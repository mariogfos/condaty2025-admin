import React, { useEffect, useState } from "react";
import styles from "./DashboardMap.module.css";
import Image from "next/image";
import { Card } from "@/mk/components/ui/Card/Card";
import { formatNumber } from "@/mk/utils/numbers";
import Maps from "@/components/Maps/Maps";
import Switch from "@/mk/components/forms/Switch/Switch";

type TypeProps = {
  data: any;
  params: any;
  onClick?: any;
  entidadData?: any;
  itemSelected: any;
  setPoblacion?: any;
};

export const DashboardMap = ({
  data,
  params,
  onClick,
  entidadData,
  itemSelected,
  setPoblacion,
}: TypeProps) => {
  const totalAfiliados = data?.entidad?.reduce(
    (acc: number, current: any) => acc + current.affiliate_count,
    0
  );

  const [isMontevideoLevel2, setIsMontevideoLevel2] = useState(false);
  const [showBarrios, setShowBarrios] = useState("N");

  // UseEffect para sincronizar el estado de isMontevideoLevel2 según params y itemSelected
  useEffect(() => {
    const shouldShowBarrios =
      params[0]?.level === 2 &&
      (params[0]?.code === "Montevideo" || params[0]?.name === "Montevideo");
    // if (shouldShowBarrios !== isMontevideoLevel2) {
    setIsMontevideoLevel2(shouldShowBarrios);
    // }
    console.log(
      "useeffect",
      params,
      shouldShowBarrios,
      isMontevideoLevel2,
      itemSelected
    );
  }, []);

  // Maneja el cambio del switch
  const handleSwitchChange = (value: any) => {
    // console.log("handleSwitchChange", value);
    setShowBarrios(value?.target.checked ? "Y" : "N"); // Sincroniza el estado con el Switch
  };

  return (
    <div className={styles.WidgetMaps}>
      <div
        style={{
          display: "flex",
          justifyContent:
            params[0]?.level === 2 && params[0]?.code === "Montevideo"
              ? "space-between"
              : "normal",
          alignItems: "center",
        }}
      >
        <div>
          Resumen de afiliados a nivel{" "}
          {params[0]?.level === 1
            ? "Nacional"
            : params[0]?.level === 2
            ? "Departamento"
            : "Municipio"}
        </div>
        {isMontevideoLevel2 && (
          <Switch
            name="showBarrios"
            optionValue={["Y", "N"]}
            value={showBarrios}
            onChange={handleSwitchChange}
            label={"Ver barrios"}
          />
        )}
      </div>

      <div className={styles.stats}>
        <Card style={{ textAlign: "right", fontSize: 16 }}>
          <p>
            Población Censo <br />
            2023
          </p>
          {params[0]?.level === entidadData?.role?.level ? (
            <p style={{ fontSize: 20 }}>
              {formatNumber(entidadData?.entidad?.habitantes, 0)}
            </p>
          ) : (
            <p style={{ fontSize: 20 }}>
              {formatNumber(data?.population?.habitantes, 0)}
            </p>
          )}
        </Card>
        <Card
          style={{ textAlign: "right", fontSize: 16, cursor: "pointer" }}
          onClick={() =>
            setPoblacion({
              total:
                params[0]?.level === entidadData?.role?.level
                  ? entidadData?.entidad?.habilitados
                  : data?.population?.habilitados,
              label: "Habilitados",
            })
          }
        >
          <p>
            Votantes habilitados <br />
            2024
          </p>
          {params[0]?.level === entidadData?.role?.level ? (
            <p style={{ fontSize: 20 }}>
              {formatNumber(entidadData?.entidad?.habilitados, 0)}
            </p>
          ) : (
            <p style={{ fontSize: 20 }}>
              {formatNumber(data?.population?.habilitados, 0)}
            </p>
          )}
        </Card>

        <Card style={{ textAlign: "right", fontSize: 16 }}>
          <p>
            Afiliados registrados en <br />
            Elekta
          </p>
          <p style={{ fontSize: 20 }}>{formatNumber(totalAfiliados, 0)}</p>
        </Card>
      </div>

      <div className={styles.ecuador}>
        <Maps
          data={data?.entidad}
          params={params}
          onClick={onClick}
          itemSelected={itemSelected}
          showBarrios={showBarrios != "Y"}
        />
        {params[0]?.level === 1 && (
          <div>
            <Image
              src="/images/uruguayBandera.png"
              alt="Uruguay"
              width={190}
              height={40}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardMap;
