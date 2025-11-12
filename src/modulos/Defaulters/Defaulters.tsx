"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./Defaulters.module.css";
import GraphBase from "@/mk/components/ui/Graphs/GraphBase";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import { formatNumber } from "@/mk/utils/numbers";
import { useAuth } from "@/mk/contexts/AuthProvider";
import {
  IconMultas,
  IconHandcoin,
  IconHousing,
  IconCategories,
} from "../../components/layout/icons/IconsBiblioteca";
import LoadingScreen from "@/mk/components/ui/LoadingScreen/LoadingScreen";
import useCrud from "@/mk/hooks/useCrud/useCrud";
import WidgetDefaulterResume from "@/components/Widgets/WidgetDefaulterResume/WidgetDefaulterResume";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import { WidgetDashCard } from "@/components/Widgets/WidgetsDashboard/WidgetDashCard/WidgetDashCard";
import FormatBsAlign from "@/mk/utils/FormatBsAlign";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import { useRouter } from "next/navigation";
import { getTitular } from "@/mk/utils/adapters";
import { hasMaintenanceValue } from '@/mk/utils/utils';

const Defaulters = () => {
  const router = useRouter();
  const onSearch = (items: any[], search: any) => {
    const d: any[] = [];

    items.map((item) => {
      const titular = getTitular(item);
      const name = getFullName(titular);
      if (
        item.dpto?.toLowerCase().includes(search.searchBy?.toLowerCase()) ||
        name.toLowerCase().includes(search.searchBy?.toLowerCase())
      ) {
        d.push(item);
      }
    });
    return d;
  };
  const mod = {
    modulo: "defaulters",
    singular: "Moroso",
    plural: "Morosos",
    permiso: "defaulters",
    pagination: false,
    extraData: true,
    export: true,
    hideActions: {
      view: true,
      add: true,
      edit: true,
      del: true,
    },
    filter: true,
    saveMsg: {
      add: "Moroso creado con éxito",
      edit: "Moroso actualizado con éxito",
      del: "Moroso eliminado con éxito",
    },
    onSearch: onSearch,
  };

  const paramsInitial = {
    fullType: "L",
    page: 1,
    perPage: -1,
  };
  const { setStore, store, user } = useAuth();
  useEffect(() => {
    setStore({ ...store, title: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const fields = useMemo(
    () => ({
      dpto: {
        rules: [],
        api: "ae",
        label: "Unidad",
        width: "170px",
        list: {
          width: "83px",
        },
      },
      titular: {
        rules: [],
        api: "ae",
        label: "Titular",
        list: {
          onRender: (props: { item: any }) => {
            const titular = getTitular(props.item);
            const titularId = titular?.id;

            return (
              <div>
                {titular ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <Avatar
                      hasImage={titular?.has_image}
                      src={
                        titularId
                          ? getUrlImages(
                              "/OWNER" +
                                "-" +
                                titularId +
                                ".webp" +
                                (titular?.updated_at
                                  ? "?d=" + titular?.updated_at
                                  : "")
                            )
                          : ""
                      }
                      name={getFullName(titular)}
                      w={32}
                      h={32}
                    />
                    {getFullName(titular)}
                  </div>
                ) : (
                  " Sin titular"
                )}
              </div>
            );
          },
        },
      },
      count: {
        rules: [],
        api: "ae",
        label: "Expensas atrasadas",
        width: "115px",
        list: {
          onRender: (props: { item: { count: number } }) => {
            const s = props?.item?.count > 1 ? "s" : "";
            return props?.item?.count + " expensa" + s;
          },
        },
      },
      expensa: {
        rules: [],
        api: "ae",
        label: (
          <span
            style={{ display: "block", textAlign: "right", width: "100%" }}
            title="Total de expensas"
          >
            Expensas
          </span>
        ),
        list: {
          onRender: (props: { item: { expensa: number } }) => (
            <FormatBsAlign value={props?.item?.expensa} alignRight />
          ),
        },
      },
      multa: {
        rules: [],
        api: "ae",
        label: (
          <span
            style={{ display: "block", textAlign: "right", width: "100%" }}
            title="Total de multas"
          >
            Multas
          </span>
        ),
        list: {
          onRender: (props: { item: { multa: number } }) => (
            <FormatBsAlign value={props?.item?.multa} alignRight />
          ),
        },
      },
      mv: {
        rules: [],
        api: "ae",
        label: (
          <span
            style={{ display: "block", textAlign: "right", width: "100%" }}
            title="Total de mantenimiento de valor"
          >
            Mant. Valor
          </span>
        ),
      list: hasMaintenanceValue(user) ? {
          onRender: (props: { item: { mv: number } }) => (
            <FormatBsAlign value={props?.item?.mv} alignRight />
          ),
      } : false,
      },
      total: {
        rules: [],
        api: "ae",
        label: (
          <span
            style={{ display: "block", textAlign: "right", width: "100%" }}
            title="Monto total"
          >
            Total
          </span>
        ),
        list: {
          onRender: (props: { item: { expensa: number; multa: number; mv: number } }) => (
            <FormatBsAlign
              value={props?.item?.expensa + props?.item?.multa + props?.item?.mv}
              alignRight
            />
          ),
        },
      },
    }),
    []
  );
  const { userCan, List, data, extraData } = useCrud({
    paramsInitial,
    mod,
    fields,
  });

  const [defaultersLength, setDefaultersLength] = useState(0);

  useEffect(() => {
    if (data?.data) {
      setDefaultersLength(data.data.length ?? 0);
    }
  }, [data]);

  interface Totals {
    porCobrarExpensa: number;
    porCobrarMulta: number;
    porCobrarMv: number;
  }

  const calculatedTotals = useMemo(() => {
    if (!data?.data || data.data.length === 0) {
      return { porCobrarExpensa: 0, porCobrarMulta: 0, porCobrarMv: 0 };
    }
    const totals = data.data.reduce(
      (acc: Totals, item: { expensa: number; multa: number; mv: number }) => {
        acc.porCobrarExpensa += item.expensa || 0;
        acc.porCobrarMulta += item.multa || 0;
        acc.porCobrarMv += item.mv || 0;
        return acc;
      },
      { porCobrarExpensa: 0, porCobrarMulta: 0, porCobrarMv: 0 }
    );
    return totals;
  }, [data?.data]);
  const finalTotals = useMemo(
    () => ({
      porCobrarExpensa:
        extraData?.porCobrarExpensa || calculatedTotals.porCobrarExpensa,
      porCobrarMulta:
        extraData?.porCobrarMulta || calculatedTotals.porCobrarMulta,
      porCobrarMv:
        extraData?.porCobrarMv || calculatedTotals.porCobrarMv,
    }),
    [
      extraData?.porCobrarExpensa,
      extraData?.porCobrarMulta,
      calculatedTotals.porCobrarExpensa,
      calculatedTotals.porCobrarMulta,
      calculatedTotals.porCobrarMv,
    ]
  );
  const handleRowClick = (item: any) => {
    router.push(`/units/${item.dpto_id}`);
  };

  const renderRightPanel = useCallback(() => {
    const expensaColor = "var(--cCompl5)";
    const multaColor = "var(--cCompl3)";
    const mvColor = "var(--cCompl4)";

    return (
      <div className={styles.rightPanel}>
        <div className={styles.subtitle}>
          Representación gráfica del estado general de morosos{" "}
        </div>
        <div className={styles.widgetlabelel}>
          <section>
            <WidgetDefaulterResume
              title={"Total de expensas"}
              amount={`Bs ${formatNumber(finalTotals.porCobrarExpensa)}`}
              pointColor={"var(--cCompl5)"}
              icon={
                <IconHandcoin
                  size={26}
                  color={"var(--cCompl5)"}
                  style={{ borderColor: "var(--cCompl5)", borderWidth: 1 }}
                />
              }
              iconBorderColor="var(--cCompl5)"
              backgroundColor={"var(--cHoverCompl8)"}
              textColor="white"
              style={{ width: "100%", borderColor: "var(--cCompl5)" }}
            />

            <WidgetDefaulterResume
              title={"Total de multas"}
              amount={`Bs ${formatNumber(finalTotals.porCobrarMulta)}`}
              pointColor={"var(--cCompl3)"}
              icon={<IconMultas size={26} color={"var(--cCompl3)"} />}
              iconBorderColor="var(--cCompl3)"
              backgroundColor={"var(--cHoverCompl6)"}
              textColor="white"
              style={{ width: "100%", borderColor: "var(--cCompl3)" }}
            />
            <WidgetDefaulterResume
              title={"Mantenimiento de valor"}
              amount={`Bs ${formatNumber(finalTotals.porCobrarMv)}`}
              pointColor={"var(--cCompl4)"}
              icon={<IconMultas size={26} color={"var(--cCompl4)"} />}
              iconBorderColor="var(--cCompl4)"
              backgroundColor={"var(--cHoverCompl7)"}
              textColor="white"
              style={{ width: "100%", borderColor: "var(--cCompl4)" }}
            />
          </section>
        </div>
        <div className={styles.graphPanel}>
          <GraphBase
            data={{
              labels: ["Expensas", "Multas", "Mant. Valor"],
              values: [
                {
                  name: "Expensas",
                  values: [finalTotals.porCobrarExpensa],
                },
                {
                  name: "Multas",
                  values: [finalTotals.porCobrarMulta],
                },
                {
                  name: "Mant. Valor",
                  values: [finalTotals.porCobrarMv],
                }
              ],
            }}
            chartTypes={["donut"]}
            background="darkv2"
            options={{
              subtitle: "",
              label: "Total de morosidad general entre expensas y multas",
              colors: [expensaColor, multaColor, mvColor],
              height: "380px",
              width: "100%",
              centerText: "Total",
            }}
          />
        </div>
      </div>
    );
  }, [finalTotals.porCobrarExpensa, finalTotals.porCobrarMulta]);
  if (!userCan(mod.permiso, "R")) return <NotAccess />;
  return (
    <LoadingScreen>
      <div className={`${styles.container} defaulters-view-container`}>
        <h1 className={styles.title}>Morosos</h1>
        <WidgetDashCard
          title="Total de unidades morosas"
          data={`${defaultersLength}`}
          onClick={() => undefined}
          tooltip={true}
          tooltipTitle="Lista de unidades que no han  pagado sus expensas a tiempo."
          tooltipWidth={348}
          icon={
            <IconHousing
              reverse
              size={32}
              color={
                !defaultersLength || defaultersLength === 0
                  ? "var(--cWhiteV1)"
                  : "var(--cInfo)"
              }
              style={{
                backgroundColor:
                  !defaultersLength || defaultersLength === 0
                    ? "var(--cHover)"
                    : "var(--cHoverCompl3)",
              }}
              circle
            />
          }
          className={styles.widgetResumeCard}
          style={{ maxWidth: 280 }}
        />
        <div className={styles.listContainer}>
          <List
            height={"calc(100vh - 390px)"}
            renderRight={
              data?.data && data.data.length > 0 ? renderRightPanel : undefined
            }
            emptyMsg="Lista de morosos vacía. Una vez las cuotas corran, los"
            emptyLine2="residentes con pagos atrasados los verás aquí."
            emptyIcon={<IconCategories size={80} color="var(--cWhiteV1)" />}
            emptyFullScreen={true}
            onRowClick={handleRowClick}
            paginationHide={true}
          />
        </div>
      </div>
    </LoadingScreen>
  );
};

export default Defaulters;
