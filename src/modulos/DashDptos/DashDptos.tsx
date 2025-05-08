"use client";
import { useEffect, useState } from "react";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import styles from "./DashDptos.module.css";
import { useRouter } from "next/navigation";
import HeadTitle from "@/components/HeadTitle/HeadTitle";
import {
  IconArrowDown,
  IconEdit,
  IconTrash,
} from "@/components/layout/icons/IconsBiblioteca";
import Button from "@/mk/components/forms/Button/Button";
import Select from "@/mk/components/forms/Select/Select";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import LoadingScreen from "@/mk/components/ui/LoadingScreen/LoadingScreen";
import { useAuth } from "@/mk/contexts/AuthProvider";
import useAxios from "@/mk/hooks/useAxios";
import EmptyData from "@/components/NoData/EmptyData";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import HistoryAccess from "./HistoryAccess/HistoryAccess";
import HistoryPayments from "./HistoryPayments/HistoryPayments";
import HistoryOwnership from "./HistoryOwnership/HistoryOwnership";
import { getDateStrMes, getDateTimeStrMes } from "@/mk/utils/date";
import RenderView from "../Payments/RenderView/RenderView";
import OwnersRenderView from "../Owners/RenderView/RenderView";
import Tooltip from "@/components/Tooltip/Tooltip";
import Table from "@/mk/components/ui/Table/Table";
import ItemList from "@/mk/components/ui/ItemList/ItemList";
import Switch from "@/mk/components/forms/Switch/Switch";
import WidgetBase from "@/components/Widgets/WidgetBase/WidgetBase";
import KeyValue from "@/mk/components/ui/KeyValue/KeyValue";
import RenderForm from "../Dptos/RenderForm";

interface DashDptosProps {
  id: string | number;
}

const getStatus = (status: string) => {
  const statusMap: Record<string, string> = {
    A: "Por Pagar",
    E: "Por subir comprobante",
    P: "Pagado",
    S: "Por confirmar",
    M: "Moroso",
    R: "Rechazado",
  };
  return statusMap[status] || status;
};

const DashDptos = ({ id }: DashDptosProps) => {
  const { user, showToast } = useAuth();
  const router = useRouter();
  const [tipoUnidad, setTipoUnidad] = useState("");
  const [openTitular, setOpenTitular] = useState(false);
  const [openPerfil, setOpenPerfil] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openComprobante, setOpenComprobante] = useState(false);
  const [formState, setFormState] = useState<any>({});
  const [errorsT, setErrorsT] = useState<any>({});
  const [openAccesos, setOpenAccesos] = useState(false);
  const [openPaymentsHist, setOpenPaymentsHist] = useState(false);
  const [openTitularHist, setOpenTitularHist] = useState(false);
  const [idPago, setIdPago] = useState<string | null>(null);
  const [idPerfil, setIdPerfil] = useState<string | null>(null);

  // Hooks y configuración
  const {
    data: dashData,
    reLoad,
    execute,
  } = useAxios("/dptos", "GET", {
    fullType: "DET",
    dpto_id: id,
  });

  const datas = dashData?.data || {};

  useEffect(() => {
    if (user?.clients) {
      const tipo = user.clients.find(
        (item: any) => item.id === user.client_id
      )?.type_dpto;
      const tipoMap: Record<string, string> = {
        D: "Departamento",
        C: "Casa",
        L: "Lote",
      };
      setTipoUnidad(tipoMap[tipo] || "");
    }
  }, [user]);

  const onSave = async () => {
    if (!formState.owner_id) {
      setErrorsT({ owner_id: "Este campo es obligatorio" });
      return;
    }

    try {
      const { data: response } = await execute(
        "/dptos-change-titular",
        "POST",
        {
          owner_id: formState.owner_id,
          dpto_id: id,
        }
      );

      if (response?.success) {
        showToast("Titular actualizado", "success");
        setOpenTitular(false);
        setErrorsT({});
        reLoad();
      } else {
        showToast(response?.message || "Error al actualizar titular", "error");
      }
    } catch (error) {
      showToast("Error al actualizar titular", "error");
    }
  };

  const handleOpenPerfil = (owner_id: string) => {
    setIdPerfil(owner_id);
    setOpenPerfil(true);
  };

  const header = [
    {
      key: "paid_at",
      label: "Fecha de pago",
      responsive: "desktop",
      onRender: ({ item }: any) => {
        return getDateStrMes(item?.paid_at) || "-";
      },
    },
    {
      key: "categorie",
      label: "Categoría",
      responsive: "desktop",
      onRender: ({ item }: any) => {
        return item?.payment?.categoryP?.name || "-";
      },
    },
    {
      key: "sub_categorie",
      label: "Sub Categoría",
      responsive: "desktop",
      onRender: ({ item }: any) => {
        return item?.payment?.category?.name || "-";
      },
    },
    {
      key: "amount",
      label: "Monto",
      responsive: "desktop",

      onRender: ({ item }: any) => {
        return item?.amount && item?.penalty_amount
          ? `Bs ${parseFloat(item?.amount) + parseFloat(item?.penalty_amount)}`
          : "-";
      },
    },
    // {
    //   key: "type",
    //   label: "Tipo de pago",
    //   responsive: "desktop",
    //   onRender: ({ item }: any) => {
    //     return item?.payment?.type === "Q"
    //       ? "Qr"
    //       : item?.payment?.type === "T"
    //       ? "Transferencia"
    //       : item?.payment?.type === "O"
    //       ? "Pago en oficina"
    //       : "Sin pago";
    //   },
    // },
    {
      key: "status",
      label: "Estado",
      responsive: "desktop",
      onRender: ({ item }: any) => {
        return (
          <span
            className={`${styles.status} ${styles[`status${item?.status}`]}`}
          >
            {getStatus(item?.status)}
          </span>
        );
      },
    },
  ];

  const Br = () => {
    return <div className={styles.br} />;
  };

  const LabelValue = ({ value, label, colorValue }: any) => {
    return (
      <div className={styles.LabelValue}>
        <p>{label}</p>
        <p
          style={{
            color: colorValue ? colorValue : "var(--cWhite)",
          }}
        >
          {value}
        </p>
      </div>
    );
  };
  return (
    <div className={styles.container}>
      <section
        style={{ display: "flex", justifyContent: "flex-start" }}
        onClick={() => router.push("/units")}
      >
        <HeadTitle
          className={styles.backButton}
          onBack={() => router.push("/units")}
          colorBack={"var(--accent)"}
        />

        <span> Volver a sección unidades </span>
      </section>
      <section>
        <div className={styles.firtsPanel}>
          <div className={styles.infoCard}>
            <div className={styles.cardHeader}>
              <div>
                <p className={styles.title}>
                  {tipoUnidad} {datas?.data?.nro}
                </p>
                <p className={styles.subtitle}> {datas?.data?.description}</p>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <div className={styles.iconActions}>
                  <IconEdit size={30} onClick={() => setOpenEdit(true)} />
                </div>
                <div className={styles.iconActions}>
                  <IconTrash size={30} />
                </div>
              </div>
            </div>

            <Br />

            <div style={{ display: "flex", marginBottom: "var(--spS)" }}>
              <ItemList
                title={getFullName(datas?.data?.homeowner)}
                subtitle={"Propietario"}
                left={
                  <Avatar
                    src={
                      datas?.data?.id
                        ? getUrlImages(
                            "/DPTO" +
                              "-" +
                              datas?.data?.id +
                              ".webp" +
                              (datas?.data?.updated_at
                                ? "?d=" + datas?.data?.updated_at
                                : "")
                          )
                        : ""
                    }
                    name={getFullName(datas?.data?.homeowner)}
                    w={48}
                    h={48}
                  />
                }
                right={
                  <div className={styles.SwitchContainer}>
                    <Switch
                      name="isTitular"
                      checked={datas?.data?.isTitular}
                      onChange={(e: any) => {
                        setFormState({
                          ...formState,
                          isTitular: e.target.checked,
                        });
                      }}
                      value={formState.isTitular}
                      label="A cargo de la unidad"
                    />
                  </div>
                }
              />
            </div>

            <div>
              {/* Info Grid */}
              <div
                style={{
                  display: "grid",
                  width: "100%",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 16,
                  marginBottom: "var(--spL)",
                }}
              >
                <LabelValue
                  value={datas?.titular ? "Habitada" : "Disponible"}
                  label="Estado"
                  colorValue={
                    datas?.titular ? "var(--cSuccess)" : "var(--cWhite)"
                  }
                />
                <LabelValue
                  value={datas?.data?.expense_amount}
                  label="Expensa"
                />
                <LabelValue
                  value={datas?.data?.dimension + " m²"}
                  label="Dimensiones"
                />

                <LabelValue
                  value={datas?.data?.dimension}
                  label="Dimensiones"
                />
              </div>

              <Br />

              <div style={{ width: "100%" }}>
                {/* Sección Titular */}
                {!datas?.titular ? (
                  <div className={styles.emptyTitular}>
                    <EmptyData
                      message="No existe titular registrado en esta casa"
                      centered={false}
                    />
                    <Button
                      className={styles.addButton}
                      onClick={() => setOpenTitular(true)}
                    >
                      Agregar Titular
                    </Button>
                  </div>
                ) : (
                  <div>
                    <ItemList
                      title={getFullName(datas?.titular)}
                      subtitle={"Titular"}
                      left={
                        <Avatar
                          src={
                            datas?.titular?.id
                              ? getUrlImages(
                                  "/OWNER" +
                                    "-" +
                                    datas?.titular?.id +
                                    ".webp" +
                                    (datas?.titular?.updated_at
                                      ? "?d=" + datas?.titular?.updated_at
                                      : "")
                                )
                              : ""
                          }
                          name={getFullName(datas?.titular)}
                          w={48}
                          h={48}
                        />
                      }
                      right={
                        <div className={styles.SwitchContainer}>
                          <Switch
                            name="isTitular"
                            checked={datas?.data?.isTitular}
                            onChange={(e: any) => {
                              setFormState({
                                ...formState,
                                isTitular: e.target.checked,
                              });
                            }}
                            value={formState.isTitular}
                            label="A cargo de la unidad"
                          />
                        </div>
                      }
                    />
                    <Button
                      onClick={() => setOpenTitular(true)}
                      variant="terciary"
                      style={{
                        padding: 0,
                        display: "flex",
                        justifyContent: "flex-start",
                        width: "fit-content",
                      }}
                      small
                    >
                      Cambiar titular
                    </Button>

                    {/* Dependientes */}
                    {datas?.titular?.dependientes && (
                      <div className={styles.dependentesSection}>
                        <p>Dependientes</p>
                        <div className={styles.dependentesGrid}>
                          {datas.titular.dependientes.length > 0 ? (
                            datas.titular.dependientes.map(
                              (dependiente: any, index: number) => (
                                <Tooltip
                                  key={index}
                                  title={getFullName(dependiente.owner)}
                                  position="top"
                                  className={styles.tooltip}
                                >
                                  <Avatar
                                    key={index}
                                    src={
                                      dependiente.owner?.id
                                        ? getUrlImages(
                                            "/OWNER" +
                                              "-" +
                                              dependiente.owner?.id +
                                              ".webp" +
                                              (datas?.titular?.updated_at
                                                ? "?d=" +
                                                  datas?.titular?.updated_at
                                                : "")
                                          )
                                        : ""
                                    }
                                    name={getFullName(dependiente.owner)}
                                    w={40}
                                    h={40}
                                    className={styles.dependentAvatar}
                                    onClick={() =>
                                      handleOpenPerfil(dependiente.owner_id)
                                    }
                                  />
                                </Tooltip>
                              )
                            )
                          ) : (
                            <p className={styles.emptyMessage}>
                              No tiene dependientes
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <Button
              variant="terciary"
              small
              style={{
                padding: 0,
                display: "flex",
                justifyContent: "flex-start",
                width: "fit-content",
              }}
              onClick={() => setOpenTitularHist(true)}
            >
              Ver historial de titulares
            </Button>
          </div>

          <WidgetBase
            title={
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <h3 className={styles.accountTitle}>Historial de pagos</h3>
                <span
                  className={styles.viewMore}
                  onClick={() => setOpenPaymentsHist(true)}
                >
                  Ver más
                </span>
              </div>
            }
            variant="V1"
          >
            <div className={styles.accountContent}>
              {!datas?.payments || datas.payments.length === 0 ? (
                <EmptyData
                  message="No existe historial de pagos para esta unidad"
                  centered={false}
                />
              ) : (
                <Table
                  header={header}
                  data={datas?.payments?.slice(0, 4)}
                  className="striped"
                  // onRowClick={(row) => {
                  //   if (row.status === "A") {
                  //     setOpenPagar(true);
                  //   } else {
                  //     setOpenComprobante(true);
                  //     setIdPago(row.payment_id);
                  //   }
                  // }}
                />
              )}
            </div>
          </WidgetBase>
        </div>

        <div className={styles.secondPanel}>
          {/* Historial de Visitas Mini Lista */}
          <WidgetBase
            title={
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <h3 className={styles.accountTitle}>Historial de accesos</h3>
                <span
                  className={styles.viewMore}
                  onClick={() => setOpenAccesos(true)}
                >
                  Ver más
                </span>
              </div>
            }
            variant="V1"
            style={{ width: "50%" }}
          >
            <div
              style={{
                display: "flex",
                overflowX: "auto",
                width: "100%",
                marginTop: 24,
              }}
            >
              {datas?.access && datas.access.length > 0 ? (
                <div
                  style={{
                    display: "flex",
                    gap: 16,
                  }}
                >
                  {datas.access.map((acc: any) => {
                    return (
                      <div
                        key={acc.id}
                        style={{
                          width: 468,
                          border: "1px solid var(--cWhiteV1)",
                          padding: 12,
                          borderRadius: 12,
                        }}
                      >
                        <ItemList
                          title={getFullName(acc.visit)}
                          subtitle={"CI: " + acc.visit?.ci}
                          left={
                            <Avatar
                              name={getFullName(acc.visit)}
                              w={40}
                              h={40}
                              className={styles.visitorAvatar}
                            />
                          }
                          right={
                            <p
                              style={{
                                width: 80,
                                fontSize: 12,
                                display: "flex",
                                justifyContent: "end",
                                color:
                                  acc.in_at && acc.out_at
                                    ? "var(--cSuccess)"
                                    : "var(--cError)",
                              }}
                            >
                              {acc.in_at && acc.out_at
                                ? "Completado"
                                : "Por salir"}
                            </p>
                          }
                        />
                        <KeyValue
                          title={"Tipo de visita"}
                          value={
                            acc.type === "P"
                              ? "Pedido"
                              : acc.type == "I"
                              ? "Individual"
                              : "Grupal"
                          }
                        />
                        <KeyValue
                          title={"Ingreso"}
                          value={getDateTimeStrMes(acc.in_at) || "Sin fecha"}
                        />
                        <KeyValue
                          title={"Salida"}
                          value={getDateTimeStrMes(acc.out_at) || "Sin fecha"}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyData
                  message="No existe historial de visitas para esta unidad"
                  centered={false}
                />
              )}
            </div>
          </WidgetBase>
          <WidgetBase
            title={
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <h3 className={styles.accountTitle}>Historial de reservas</h3>
                <span
                  className={styles.viewMore}
                  onClick={() => setOpenPaymentsHist(true)}
                >
                  Ver más
                </span>
              </div>
            }
            variant="V1"
            style={{ width: "50%" }}
          >
            <div
              style={{
                display: "flex",
                overflowX: "auto",
                width: "100%",
                marginTop: 24,
              }}
            >
              {datas?.reservations && datas?.reservations?.length > 0 ? (
                <div
                  style={{
                    display: "flex",
                    gap: 16,
                  }}
                >
                  {datas.reservations.map((res: any) => {
                    return (
                      <div
                        key={res.id}
                        style={{
                          width: 468,
                          border: "1px solid var(--cWhiteV1)",
                          padding: 12,
                          borderRadius: 12,
                        }}
                      >
                        <ItemList
                          title={res?.title}
                          // subtitle={"CI: " + res.visit?.ci}
                          left={
                            <Avatar
                              name={res.title}
                              src={getUrlImages(
                                "/AREA-" +
                                  res?.id +
                                  ".webp?d=" +
                                  res?.updated_at
                              )}
                              w={40}
                              h={40}
                            />
                          }
                          right={
                            <p>
                              {res.status === "A"
                                ? "Pendiente"
                                : res.status === "P"
                                ? "Pagado"
                                : "Cancelado"}
                            </p>
                          }
                        />
                        <KeyValue
                          title={"Fecha y hora de reserva"}
                          value={
                            res.start_time + " " + res.date_at || "Sin fecha"
                          }
                        />
                        <KeyValue
                          title={"Cantidad de personas"}
                          value={res.people_count || "Sin cantidad"}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyData
                  message="No existe historial de visitas para esta unidad"
                  centered={false}
                />
              )}
            </div>
          </WidgetBase>
        </div>

        {/* Modales */}
        <DataModal
          title="Cambiar de titular"
          open={openTitular}
          onSave={onSave}
          onClose={() => setOpenTitular(false)}
          buttonText="Guardar"
        >
          <div className={styles.modalContent}>
            <Select
              placeholder="Selecciona al nuevo titular"
              name="owner_id"
              error={errorsT.owner_id}
              required={true}
              value={formState.owner_id || ""}
              onChange={(e) =>
                setFormState({ ...formState, owner_id: e.target.value })
              }
              options={(datas?.owners || []).map((owner: any) => ({
                ...owner,
                name: `${getFullName(owner)}`,
              }))}
              optionLabel="name"
              optionValue="id"
              iconRight={<IconArrowDown />}
            />
          </div>
        </DataModal>
        {/* Modales de Historial */}
        {openTitularHist && (
          <HistoryOwnership
            ownershipData={datas?.titularHist || []}
            open={openTitularHist}
            close={() => setOpenTitularHist(false)}
          />
        )}

        {openPaymentsHist && (
          <HistoryPayments
            paymentsData={datas?.payments || []}
            open={openPaymentsHist}
            close={() => setOpenPaymentsHist(false)}
          />
        )}

        {openAccesos && (
          <HistoryAccess
            accessData={datas?.access || []}
            open={openAccesos}
            close={() => setOpenAccesos(false)}
          />
        )}

        {openComprobante && idPago && (
          <RenderView
            open={openComprobante}
            onClose={() => {
              setOpenComprobante(false);
              setIdPago(null);
            }}
            // item={datas.payments?.find(
            //   (pago: any) => pago?.payment?.id === idPago
            // )?.payment || {}}
            // id={idPago}
            extraData={datas}
            payment_id={idPago}
          />
        )}

        {openPerfil && idPerfil && (
          <OwnersRenderView
            open={openPerfil}
            onClose={() => {
              setOpenPerfil(false);
              setIdPerfil(null);
            }}
            item={
              idPerfil === datas?.titular?.id
                ? datas?.titular
                : datas?.titular?.dependientes?.find(
                    (dep: any) => dep.owner_id === idPerfil
                  )?.owner || {}
            }
            reLoad={reLoad}
          />
        )}

        {openEdit && (
          <RenderForm
            open={openEdit}
            onClose={() => setOpenEdit(false)}
            item={datas?.data}
          />
        )}
      </section>
    </div>
  );
};

export default DashDptos;
