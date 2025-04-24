/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import { useEffect, useState } from "react";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import styles from "./DashDptos.module.css";
import { useRouter } from "next/navigation";
import HeadTitle from "@/components/HeadTitle/HeadTitle";
import { IconArrowDown } from "@/components/layout/icons/IconsBiblioteca";
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
import { Categories } from "emoji-picker-react";

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

  // Estados
  const [tipoUnidad, setTipoUnidad] = useState("");
  const [openTitular, setOpenTitular] = useState(false);
  const [openPerfil, setOpenPerfil] = useState(false);
  const [openPagar, setOpenPagar] = useState(false);
  const [openComprobante, setOpenComprobante] = useState(false);
  const [formState, setFormState] = useState<any>({});
  const [errorsT, setErrorsT] = useState<any>({});
  const [openAccesos, setOpenAccesos] = useState(false);
  const [openPaymentsHist, setOpenPaymentsHist] = useState(false);
  const [openTitularHist, setOpenTitularHist] = useState(false);
  const [idPago, setIdPago] = useState<string | null>(null);
  const [idPerfil, setIdPerfil] = useState<string | null>(null);
  const [dataOw, setDataOw] = useState<any>(null);

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

  const mod = {
    modulo: "payments",
    singular: "Pago",
    permiso: "",
    plural: "Pagos",
    subtitle: "",
    avatarPrefix: "",
  };

  const modRe = {
    modulo: "owners",
    singular: "residente",
    permiso: "residentes",
    plural: "residentes",
    avatarPrefix: "OWN",
  };

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
    // Remove the console.log
    setIdPerfil(owner_id);
    setOpenPerfil(true);
    // Fetch the dependent's data to populate the modal
    const dependentData = datas.titular.dependientes.find(
      (dep: any) => dep.owner_id === owner_id
    );
    setDataOw(dependentData?.owner || {});
  };
  // console.log(datas,'datas')

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
        <div className={styles.leftPanel}>
          <LoadingScreen className={styles.loadingCard}>
            <div className={styles.infoCard}>
              {/* Cabecera */}
              <div className={styles.cardHeader}>
                <div className={styles.title}>
                  {/* <HeadTitle
                  className={styles.backButton}
                  onBack={() => router.push("/dptos")}
                /> */}
                  {tipoUnidad} {datas?.data?.nro}, {datas?.data?.description}
                </div>
              </div>

              <div style={{ display: "flex", marginBottom: "var(--spS)" }}>
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
                  w={40}
                  h={40}
                  square={true}
                />
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    marginLeft: 8,
                  }}
                >
                  <span className={styles.value}>
                    {datas?.data?.homeowner
                      ? getFullName(datas?.data?.homeowner)
                      : "Sin Propietario"}
                  </span>
                  <span className={styles.label}>Propietario</span>
                </div>
              </div>

              <div style={{ display: "flex" }}>
                {/* Info Grid */}
                <div className={styles.infoGrid}>
                  <div className={styles.infoRow}>
                    <span className={styles.label}>Estado</span>
                    <span className={styles.value}>
                      {datas?.data?.status
                        ? getStatus(datas?.data?.status)
                        : "Sin Estado"}
                    </span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.label}>Expensa</span>
                    <span className={styles.value}>
                      {datas?.data?.expense_amount} Bs
                    </span>
                  </div>

                  {/* campos extra 
             {datas?.data?.field_values?.map((item:any)=> 
              <div className={styles.infoRow}>
                <span className={styles.label}>{item.type_field?.name}</span>
                <span className={styles.value}>
                  {item?.value}
                </span>
              </div>)} */}

                  <div className={styles.infoRow}>
                    <span className={styles.label}>Dimensiones</span>
                    <span className={styles.value}>
                      {datas?.data?.dimension} m
                    </span>
                  </div>
                </div>

                {/* <div className={styles.divider} /> */}
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
                    <div className={styles.titularInfo}>
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
                        w={80}
                        h={80}
                        square={true}
                        onClick={() => {
                          setIdPerfil(datas?.titular?.id);
                          setOpenPerfil(true);
                          setDataOw(datas?.titular);
                        }}
                      />
                      <p className={styles.titularName}>
                        {getFullName(datas?.titular)}
                      </p>
                      <p className={styles.titularLabel}>Titular</p>
                      <Button
                        className={styles.changeButton}
                        onClick={() => setOpenTitular(true)}
                      >
                        Cambiar Titular
                      </Button>

                      <div className={styles.divider} />

                      {/* Info Titular */}
                      <div className={styles.titularData}>
                        <p className={styles.titularDataLabel}>
                          Carnet de identidad
                        </p>
                        <p className={styles.titularDataValue}>
                          {datas?.titular?.ci}
                        </p>

                        <p className={styles.titularDataLabel}>Celular</p>
                        <p className={styles.titularDataValue}>
                          {datas?.titular?.phone}
                        </p>

                        <p className={styles.titularDataLabel}>
                          Correo electrónico
                        </p>
                        <p className={styles.titularDataValue}>
                          {datas?.titular?.email}
                        </p>
                      </div>

                      {/* Dependientes */}
                      {datas?.titular?.dependientes && (
                        <div className={styles.dependentesSection}>
                          <p className={styles.titularDataLabel}>
                            Dependientes
                          </p>
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
                                      w={30}
                                      h={30}
                                      className={styles.dependentAvatar}
                                      onClick={() =>
                                        handleOpenPerfil(dependiente.owner_id)
                                      }
                                      square={true}
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
              <div
                className={styles.viewMore}
                onClick={() => setOpenTitularHist(true)}
              >
                Ver historial de titulares
              </div>
            </div>

            <div className={styles.accountSection}>
              <div className={styles.accountHeader}>
                <h3 className={styles.accountTitle}>Historial de pagos</h3>
                <span
                  className={styles.viewMore}
                  onClick={() => setOpenPaymentsHist(true)}
                >
                  Ver más
                </span>
              </div>
              <div className={styles.accountContent}>
                {!datas?.payments || datas.payments.length === 0 ? (
                  <EmptyData
                    message="No existe historial de pagos para esta unidad"
                    centered={false}
                  />
                ) : (
                  <Table
                    header={[
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
                        width: "100px",
                        onRender: ({ item }: any) => {
                          return item?.amount && item?.penalty_amount
                            ? `Bs ${
                                parseFloat(item?.amount) +
                                parseFloat(item?.penalty_amount)
                              }`
                            : "-";
                        },
                      },
                      {
                        key: "type",
                        label: "Tipo de pago",
                        responsive: "desktop",
                        onRender: ({ item }: any) => {
                          //  console.log(item,'props desde render de qr');
                          return item?.payment?.type === "Q"
                            ? "Qr"
                            : item?.payment?.type === "T"
                            ? "Transferencia"
                            : item?.payment?.type === "O"
                            ? "Pago en oficina"
                            : "Sin pago";
                        },
                      },
                      // { key: 'penalty_amount', label: 'Mora', responsive: "desktop", width: '100px' },
                      {
                        key: "status",
                        label: "Estado",
                        width: "100px",
                        responsive: "desktop",
                        onRender: ({ item }: any) => {
                          return (
                            <span
                              className={`${styles.status} ${
                                styles[`status${item?.status}`]
                              }`}
                            >
                              {getStatus(item?.status)}
                            </span>
                          );
                        },
                      },
                    ]}
                    data={datas?.payments?.slice(0, 4)}
                    className="striped"
                    onRowClick={(row) => {
                      // console.log(row, 'row');
                      // if (row.status.props.children === 'Por Pagar') {
                      //   setOpenPagar(true);
                      // } else {
                      //   setOpenComprobante(true);
                      //   setIdPago(row.payment_id);
                      // }

                      if (row.status === "A") {
                        setOpenPagar(true);
                      } else {
                        setOpenComprobante(true);
                        setIdPago(row.payment_id);
                      }
                    }}
                  />
                )}
              </div>
            </div>
          </LoadingScreen>

          {/* Historial de Titulares Mini Lista */}
          {/* <div className={styles.historySection}>
          <div className={styles.historyHeader}>
            <h3 className={styles.historyTitle}>Historial de Titulares</h3>
            <span
              className={styles.viewMore}
              onClick={() => setOpenTitularHist(true)}
            >
              Ver más
            </span>
          </div>
          <div className={styles.historySectionContent}>
            {!datas?.titularHist || datas.titularHist.length === 0 ? (
              <EmptyData
                message="No existe historial de titulares para esta unidad"
                centered={false}
              />
            ) : (
              datas.titularHist
                .slice(0, 4)
                .map((titular: any, index: number) => (
                  <div
                    key={index}
                    className={styles.historyItem}
                    onClick={() => handleOpenPerfil(titular.owner_id)}
                  >
                    <Avatar
                      src={
                   getUrlImages(
                              "/OWNER" +
                                "-" +
                                titular?.owner?.id +
                            ".webp" +
                            
                              "?d=" + titular?.owner?.updated_at
                                
                            )
                      }
                      name={getFullName(titular.owner)}
                      w={40}
                      h={40}
                    />
                    <div className={styles.historyItemInfo}>
                      <p className={styles.historyItemName}>
                        {getFullName(titular.owner)}
                      </p>
                      <div className={styles.historyItemDate}>
                        Desde {getDateStrMes(titular.date_in)}
                        {titular.date_out ? (
                          ` Hasta ${getDateStrMes(titular.date_out)}`
                        ) : (
                          <span className={styles.currentStatus}>
                            Titular actual
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div> */}
        </div>

        <div className={styles.rightPanel}>
          {/* Estado de Cuenta Mini Lista */}
          {/* <div className={styles.accountSection}>
          <div className={styles.accountHeader}>
            <h3 className={styles.accountTitle}>Historial de pagos</h3>
            <span
              className={styles.viewMore}
              onClick={() => setOpenPaymentsHist(true)}
            >
              Ver más
            </span>
          </div>
          <div className={styles.accountContent}>
            <div className={styles.accountGrid}>
              <div>Fecha</div>
              <div>Categoría</div>
              <div>Monto</div>
              <div>Medio de pago</div>
              <div>Estado</div>
            </div>
            <div className={styles.accountList}>
              {!datas?.payments || datas.payments.length === 0 ? (
                <EmptyData
                  message="No existe historial de pagos para esta unidad"
                  centered={false}
                />
              ) : (
                datas.payments.slice(0, 4).map((pago: any, index: number) => (
                  <div
                    key={index}
                    className={styles.accountRow}
                    onClick={() => {
                      if (pago.status === "A") {
                        setOpenPagar(true);
                      } else {
                        setOpenComprobante(true);
                        setIdPago(pago?.payment?.id);
                      }
                    }}
                  >
                    <div className={styles.cell}>
                      {getDateStrMes(pago?.paid_at) || "-"}
                    </div>
                    <div className={styles.cell}>Expensa</div>
                    <div className={styles.cell}>
                      {pago?.amount && pago?.penalty_amount
                        ? `Bs ${
                            parseFloat(pago?.amount) +
                            parseFloat(pago?.penalty_amount)
                          }`
                        : "-"}
                    </div>
                    <div className={styles.cell}>
                      {pago?.payment?.type === "Q"
                        ? "Qr"
                        : pago?.payment?.type === "T"
                        ? "Transferencia"
                        : pago?.payment?.type === "O"
                        ? "Pago en oficina"
                        : "Sin pago"}
                    </div>
                    <div className={styles.cell}>
                      <span
                        className={`${styles.status} ${
                          styles[`status${pago?.status}`]
                        }`}
                      >
                        {getStatus(pago?.status)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div> */}

          {/* Historial de Visitas Mini Lista */}
          <div className={styles.visitsSection}>
            <div className={styles.visitsHeader}>
              <h3 className={styles.visitsTitle}>Historial de accesos</h3>
              <span
                className={styles.viewMore}
                onClick={() => setOpenAccesos(true)}
              >
                Ver más
              </span>
            </div>

            {/*   modo cards para otro sprint
        
        {    !datas?.access || datas.access.length === 0 ? (
                <EmptyData
                  message="No existe historial de visitas para esta unidad"
                  centered={false}
                />
              ) : ( datas.access.slice(0, 4).map((visita: any, index: number) => (
          <div className={styles.accessCard}>
             <div className={styles.visitorInfo}>
                      <Avatar
                        name={getFullName(visita.visit)}
                        w={28}
                        h={28}
                        className={styles.visitorAvatar}
                        square={true}
                      />
                      <div>
                        <p className={styles.visitorName}>
                          {getFullName(visita.visit)}
                        </p>
                        <p className={styles.visitorCI}>
                          CI: {visita.visit?.ci}
                        </p>
                      </div>
                    </div>
          </div>
          )))} */}

            <div className={styles.visitsContent}>
              <div className={styles.visitsGrid}>
                <div>Nombre completo</div>
                <div>Tipo de visita</div>
                <div>Ingreso</div>
                <div>Salida</div>
              </div>
              <div className={styles.visitsList}>
                {!datas?.access || datas.access.length === 0 ? (
                  <EmptyData
                    message="No existe historial de visitas para esta unidad"
                    centered={false}
                  />
                ) : (
                  datas.access.slice(0, 4).map((visita: any, index: number) => (
                    <div key={index} className={styles.visitRow}>
                      <div className={styles.visitorInfo}>
                        <Avatar
                          name={getFullName(visita.visit)}
                          w={28}
                          h={28}
                          className={styles.visitorAvatar}
                          square={true}
                        />
                        <div>
                          <p className={styles.visitorName}>
                            {getFullName(visita.visit)}
                          </p>
                          <p className={styles.visitorCI}>
                            CI: {visita.visit?.ci}
                          </p>
                        </div>
                      </div>
                      <div>
                        {visita.type === "P" ? (
                          "Pedido"
                        ) : visita.type === "I" ? (
                          "Individual"
                        ) : visita.type === "G" ? (
                          "Grupal"
                        ) : visita.type === "C" ? (
                          "Sin Qr"
                        ) : (
                          <EmptyData />
                        )}
                      </div>
                      <div>
                        {getDateTimeStrMes(visita.in_at) || "Sin fecha"}
                      </div>
                      <div>
                        {getDateTimeStrMes(visita.out_at) || "Sin fecha"}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
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
      </section>
    </div>
  );
};

export default DashDptos;

// data={datas?.payments?.slice(0, 4).map((pago: any) =>

//   {    console.log(pago,'pago desde data con '); return ({
//   // fecha: getDateStrMes(pago?.paid_at) || '-',
//   categoria: 'Expensa',
//   subcategoria: pago?.category?.name || '-',
//   monto: pago?.amount && pago?.penalty_amount
//     ? `Bs ${parseFloat(pago?.amount) + parseFloat(pago?.penalty_amount)}`
//     : '-',
//   medio_pago: pago?.payment?.type === 'Q'
//     ? 'Qr'
//     : pago?.payment?.type === 'T'
//     ? 'Transferencia'
//     : pago?.payment?.type === 'O'
//     ? 'Pago en oficina'
//     : 'Sin pago',
//   estado: <span className={`${styles.status} ${styles[`status${pago?.status}`]}`}></span>
