import React, {
  memo,
  useState,
  useEffect,
  useCallback,
  CSSProperties,
  useRef,
} from "react";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import Button from "@/mk/components/forms/Button/Button";
import {
  formatToDayFdMYH,
  formatToDayDDMMYYYYHHMM,
  MONTHS_ES,
  formatToDayDDMMYYYY,
} from "@/mk/utils/date";
import styles from "./RenderView.module.css";
import useAxios from "@/mk/hooks/useAxios";
import { useAuth } from "@/mk/contexts/AuthProvider";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import { formatBs } from "@/mk/utils/numbers";
import Input from "@/mk/components/forms/Input/Input";
import { hasMaintenanceValue } from "@/mk/utils/utils";
import Table from "@/mk/components/ui/Table/Table";
import { generateWhatsAppLink } from "@/mk/utils/phone";
import Loading from "@/mk/components/ui/LoadingScreen/Loading/Loading";
import { paymentsApi } from "../api";
interface PaymentDetail {
  id: string | number;
  status: string;
  __openRejectModal?: boolean;
  user?: any;
  confirm_obs?: string;
  confirmed_by?: any;
  canceled_by?: any;
  canceled_obs?: string;
  owner?: any;
  details?: any[];
  dptos?: string;
  dpto_id?: string | number;
  amount?: number;
  paid_at?: string;
  concept?: string[];
  category?: { padre?: { name?: string } };
  obs?: string;
  type?: string;
  method?: string;
  voucher?: string;
  ext?: string;
  url_file?: (string | null)[];
  bank_account?: any;
  updated_at?: string;
}

interface DetailPaymentProps {
  open: boolean;
  onClose: () => void;
  extraData?: { dptos?: any[] };
  reLoad?: () => void;
  item?: PaymentDetail;
  payment_id?: string | number;
  onDel?: (item?: PaymentDetail) => void;
  style?: CSSProperties;
  noWaiting?: boolean;
  setItem?: (next: PaymentDetail) => void;
}

const RenderView: React.FC<DetailPaymentProps> = memo((props) => {
  const {
    open,
    onClose,
    extraData,
    reLoad,
    item: propItem,
    onDel,
    payment_id,
    style,
    noWaiting = false,
  } = props;
  const [formState, setFormState] = useState<{ confirm_obs?: string }>({});
  const [onRechazar, setOnRechazar] = useState(false);
  const [errors, setErrors] = useState<{ confirm_obs?: string }>({});
  const [item, setItem] = useState<PaymentDetail | null>(propItem || null);
  const { execute } = useAxios();
  const executeRef = useRef(execute);
  const { user, showToast } = useAuth();
  const [openVoucherModal, setOpenVoucherModal] = useState(false);
  const [voucherValue, setVoucherValue] = useState("");
  const [voucherErrors, setVoucherErrors] = useState<{ voucher?: string }>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    executeRef.current = execute;
  }, [execute]);

  useEffect(() => {
    if (open) {
      setItem(propItem || null);
      setOnRechazar(Boolean(propItem?.__openRejectModal));
      setErrors({});
      setFormState({ confirm_obs: "" });
    }
  }, [propItem, open]);

  useEffect(() => {
    const idToFetch = propItem?.id || payment_id;

    if (!open || !idToFetch) {
      return;
    }

    let cancelled = false;

    const fetchPaymentData = async () => {
      setLoading(true);

      try {
        const { data } = await executeRef.current(
          paymentsApi.detail(idToFetch),
          "GET",
          {},
          false,
          true,
        );

        if (cancelled) return;

        if (data?.data) {
          setItem(data.data);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchPaymentData();

    return () => {
      cancelled = true;
    };
  }, [open, payment_id, propItem?.id]);

  const handleGenerateReceipt = async (item: any) => {
    const paymentId = item?.id;
    if (paymentId == null) {
      showToast("No se encontró el pago para generar el recibo.", "error");
      return;
    }

    showToast("Generando recibo...", "info");

    const { data: file, error } = await execute(
      paymentsApi.receipt(paymentId),
      "POST",
      {},
      false,
      true,
    );

    if (file?.success === true && file?.data?.path) {
      const receiptUrl = getUrlImages("/" + file.data.path);
      window.open(receiptUrl, "_blank");
      showToast("Recibo generado con éxito.", "success");
    } else {
      showToast(
        error?.data?.message || "No se pudo generar el recibo.",
        "error",
      );
    }
  };

  const handleShareReceiptWhatsApp = async () => {
    const paymentId = item?.id;
    if (paymentId == null) {
      showToast("No se encontró el pago para compartir el recibo.", "error");
      return;
    }

    const phone = String(item?.owner?.phone || "");
    const waLinkBase = generateWhatsAppLink(phone);
    if (!waLinkBase) {
      showToast("Número de teléfono no disponible", "error");
      return;
    }
    showToast("Generando recibo...", "info");
    const { data: file, error } = await execute(
      paymentsApi.receipt(paymentId),
      "POST",
      {},
      false,
      true,
    );
    if (file?.success === true && file?.data?.path) {
      const receiptUrl = getUrlImages("/" + file.data.path);
      const waLink = generateWhatsAppLink(
        phone,
        `Recibo de pago: ${receiptUrl}`,
      );
      window.open(waLink, "_blank");
      showToast("Recibo generado con éxito.", "success");
    } else {
      showToast(
        error?.data?.message || "No se pudo generar el recibo.",
        "error",
      );
    }
  };

  const handleChangeInput = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    let value = e.target.value;
    if ((e.target as HTMLInputElement).type === "checkbox") {
      value = (e.target as HTMLInputElement).checked ? "P" : "N";
    }
    setFormState({ ...formState, [e.target.name]: value });
  };

  const onConfirm = async (rechazado = true) => {
    setErrors({});
    if (!rechazado) {
      if (!formState.confirm_obs || formState.confirm_obs.trim() === "") {
        setErrors({
          confirm_obs: "La observación es obligatoria para rechazar un pago",
        });
        return;
      }
    }

    const paymentId = item?.id ?? payment_id;
    if (paymentId == null) {
      showToast("No se encontró el pago para confirmar la operación.", "error");
      return;
    }

    const { data: payment, error } = await execute(
      paymentsApi.confirm(paymentId),
      "POST",
      {
        confirm: rechazado ? "P" : "R",
        confirm_obs: formState.confirm_obs,
      },
      false,
      noWaiting,
    );

    if (payment?.success === true) {
      showToast(payment?.message, "success");
      if (reLoad) reLoad();
      setFormState({ confirm_obs: "" });
      onClose();
      setOnRechazar(false);
    } else {
      showToast(error?.data?.message || error?.message, "error");
    }
  };

  const openVoucherEditor = () => {
    setVoucherErrors({});
    setVoucherValue(item?.voucher || "");
    setOpenVoucherModal(true);
  };

  const refreshPayment = async () => {
    const idToFetch = item?.id || payment_id;
    if (!idToFetch) return null;
    const { data } = await execute(
      paymentsApi.detail(idToFetch),
      "GET",
      {},
      false,
      true,
    );
    if (data?.data) {
      setItem(data.data);
      return data.data;
    }
    return null;
  };
  const onSaveVoucher = async () => {
    setVoucherErrors({});

    const paymentId = item?.id || payment_id;
    if (!paymentId) {
      showToast("No se pudo identificar el pago", "error");
      return;
    }

    const body: any = { voucher: String(voucherValue || "") };

    const { data, error } = await execute(
      paymentsApi.voucher(paymentId),
      "POST",
      body,
      false,
      true,
    );

    if (data?.success === true) {
      showToast(data?.message || "Número de respaldo actualizado", "success");
      const updated = await refreshPayment(); // <-- obtenemos el detalle actualizado
      setOpenVoucherModal(false);
      setVoucherErrors({});
      if (updated) {
        props.setItem?.(updated);
      } else if (item) {
        props.setItem?.({ ...item, voucher: voucherValue });
      }
      if (reLoad) reLoad();
    } else {
      showToast(
        error?.data?.message ||
          error?.message ||
          "No se pudo actualizar el número de respaldo",
        "error",
      );
    }
  };

  const getPaymentType = (type: string) => {
    const typeMap: Record<string, string> = {
      T: "Transferencia bancaria",
      E: "Efectivo",
      C: "Cheque",
      Q: "Pago QR",
      //O: 'Pago en oficina',
    };
    return typeMap[type] || type;
  };

  const getStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      P: "Cobrado",
      S: "Por confirmar",
      R: "Rechazado",
      A: "Por pagar",
      M: "Moroso",
      X: "Anulado",
    };
    return statusMap[status] || status;
  };

  const getDptoName = () => {
    if (!extraData?.dptos) return (item?.dptos || "-/-").replace(/,/g, "");

    const dpto = extraData.dptos.find(
      (d: any) => d.id === item?.dpto_id || d.id === item?.dptos,
    );

    if (dpto) {
      const nroSinComa = dpto.nro ? dpto.nro.replace(/,/g, "") : "";
      const descSinComa = dpto.description
        ? dpto.description.replace(/,/g, "")
        : "";
      return `${nroSinComa} - ${descSinComa}`;
    } else {
      return (item?.dptos || "-/-").replace(/,/g, "");
    }
  };
  const getTotalAmount = () => {
    if (!item?.details?.length) return item?.amount || 0;
    return item.amount;
  };

  // Nov 20, 2025: Comentado para eliminar el campo concepto del detalle de pago
  // const getUniqueConcepts = () => {
  //   if (!item) return <div>-/-</div>;

  //   if (item.details?.length) {
  //     const uniqueCategories = Array.from(
  //       new Set(
  //         item.details
  //           .map((detail) => detail?.subcategory?.padre?.name)
  //           .filter(Boolean)
  //       )
  //     );

  //     return uniqueCategories.length > 0 ? (
  //       uniqueCategories.map((name, i) => (
  //         <div key={`category-${i}`}>- {name}</div>
  //       ))
  //     ) : (
  //       <div>-/-</div>
  //     );
  //   }

  //   return <div>-/-</div>;
  // };

  const handleAnularClick = () => {
    if (item && onDel) {
      onDel(item);
    }
  };

  if (!item) {
    return (
      <DataModal
        open={open}
        onClose={onClose}
        title="Detalle de Ingreso"
        buttonText=""
        buttonCancel=""
        minWidth={860}
        maxWidth={980}
      >
        {/* Necesario por lo childres solicitados por le datamodal, manejo del null exeption en item */}
        <></>
      </DataModal>
    );
  }

  let aprobadoLabel;
  if (item.status === "P") {
    aprobadoLabel = "Aprobado por";
  } else if (item.status === "R") {
    aprobadoLabel = "Rechazado por";
  } else if (item.status === "S") {
    aprobadoLabel = "Por confirmar por";
  } else {
    aprobadoLabel = "Aprobado por";
  }

  let statusClass = "";
  if (item.status === "P") {
    statusClass = styles.statusPaid;
  } else if (item.status === "S") {
    statusClass = styles.statusPending;
  } else if (item.status === "R") {
    statusClass = styles.statusRejected;
  } else if (item.status === "X") {
    statusClass = styles.statusCanceled;
  } else if (item.status === "E") {
    statusClass = styles.statusVoucher;
  }

  let tenantDisplay = "-/-";
  if (typeof item.details?.[0]?.debt_dpto?.dpto?.tenant === "object") {
    tenantDisplay = getFullName(item.details[0].debt_dpto.dpto.tenant);
  }

  let propietarioDisplay = "-/-";
  if (typeof item.details?.[0]?.debt_dpto?.dpto?.homeowner === "object") {
    propietarioDisplay = getFullName(item.details[0].debt_dpto.dpto.homeowner);
  }

  let registradoPorDisplay = "-/-";
  if (item.user && typeof item.user === "object") {
    registradoPorDisplay = getFullName(item.user);
  }

  const confirmedBy = (item as any)?.confirmed_by || (item as any)?.confirmedBy;
  const canceledBy = (item as any)?.canceled_by || (item as any)?.canceledBy;
  const bankAccount = (item as any)?.bank_account || (item as any)?.bankAccount;

  let aprobadoPorDisplay = "-/-";
  if (confirmedBy && typeof confirmedBy === "object") {
    aprobadoPorDisplay = getFullName(confirmedBy);
  }

  let anuladoPorDisplay = "-/-";
  if (canceledBy && typeof canceledBy === "object") {
    anuladoPorDisplay = getFullName(canceledBy);
  }

  let infoBlockContent = null;

  const voucherUrls = Array.isArray(item.url_file)
    ? item.url_file
        .map((u: any) =>
          String(u || "")
            .replace(/[`'"\s]/g, "")
            .trim(),
        )
        .filter((u: string) => !!u)
    : [];

  // Si no hay url_file pero existe ext, agregar la URL legacy
  if (voucherUrls.length === 0 && item.ext) {
    const ext = item.ext || "webp";
    const legacyUrl = getUrlImages(
      "/PAYMENT-" + item.id + "." + ext + "?d=" + item.updated_at,
    );
    voucherUrls.push(legacyUrl);
  }

  const hasVoucherUrls = voucherUrls.length > 0;
  const showBankAccount = !!bankAccount;
  const paymentDetails = Array.isArray(item?.details)
    ? item.details.filter((detail: any) => detail?.debt_dpto)
    : [];
  const showMaintenanceColumn = hasMaintenanceValue(user);
  const paymentDetailsTableHeight = `${Math.min(
    Math.max(paymentDetails.length || 1, 1),
    4,
  ) * 56}`;
  const paymentDetailsHeader = [
    {
      key: "type",
      label: "Tipo",
      width: "160px",
      onRender: ({ item: detail }: any) => getDebtType(detail?.debt_dpto?.type),
    },
    {
      key: "concept",
      label: "Concepto",
      width: "100%",
      onRender: ({ item: detail }: any) => getConceptByType(detail),
    },
    {
      key: "amount",
      label: "Monto",
      width: "124px",
      className: styles.amountColumn,
      onRender: ({ item: detail }: any) =>
        formatBs(getDetailAmount(detail, "amount")),
    },
    {
      key: "penalty_amount",
      label: "Multa",
      width: "124px",
      className: styles.amountColumn,
      onRender: ({ item: detail }: any) =>
        formatBs(getDetailAmount(detail, "penalty_amount")),
    },
    ...(showMaintenanceColumn
      ? [
          {
            key: "maintenance_amount",
            label: "Mant. Valor",
            width: "140px",
            className: styles.amountColumn,
            onRender: ({ item: detail }: any) =>
              formatBs(getDetailAmount(detail, "maintenance_amount")),
          },
        ]
      : []),
    {
      key: "subtotal",
      label: "Subtotal",
      width: "132px",
      className: styles.amountColumn,
      onRender: ({ item: detail }: any) => formatBs(getSubtotal(detail)),
    },
  ];

  const handleDownloadVouchers = async () => {
    if (!hasVoucherUrls) return;
    try {
      showToast("Descargando comprobantes...", "info");
      const container = document.createElement("div");
      container.style.display = "none";
      document.body.appendChild(container);
      for (let i = 0; i < voucherUrls.length; i++) {
        const url = voucherUrls[i];
        try {
          const res = await fetch(url, { mode: "cors" });
          if (!res.ok) continue;
          const blob = await res.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          let name = "voucher-" + (i + 1);
          try {
            const u = new URL(url);
            const last = u.pathname.split("/").pop() || "";
            if (last) name = last;
          } catch {}
          if (!/\.[a-zA-Z0-9]+$/.test(name)) {
            const ext = (blob.type.split("/")[1] || "file").replace(
              /[^a-zA-Z0-9]/g,
              "",
            );
            name = name + "." + ext;
          }
          const a = document.createElement("a");
          a.href = blobUrl;
          a.download = name;
          container.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(blobUrl);
          a.remove();
        } catch {}
      }
      setTimeout(() => {
        container.remove();
      }, 500);
      showToast("Descarga finalizada", "success");
    } catch (e: any) {
      showToast("No se pudieron descargar los comprobantes", "error");
    }
  };

  const handleViewOrDownloadVouchers = () => {
    if (!hasVoucherUrls) return;
    if (voucherUrls.length === 1) {
      const u = voucherUrls[0];
      const a = document.createElement("a");
      a.href = u;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } else {
      handleDownloadVouchers();
    }
  };
  const canReviewPayment = item?.status === "S";

  return (
    <>
      <DataModal
        open={open}
        title="Detalle del ingreso"
        buttonText=""
        buttonCancel={""}
        onClose={onClose}
        variant={"mini"}
        style={style}
        headerDivider={false}
        minWidth={860}
        maxWidth={980}
      >
        {loading ? (
          <Loading />
        ) : (
          <>
            <div className={styles.container}>
              <div className={styles.headerSection}>
                <div className={styles.amountDisplay}>
                  {formatBs(item.amount ?? 0)}
                </div>
                <div className={styles.dateDisplay}>
                  {formatToDayFdMYH(item.paid_at, true, false, true)}
                </div>
              </div>
            </div>

            <div className={styles.container}>
              <section className={styles.detailsSection}>
                {/* Columna Izquierda */}
                <div className={styles.detailsColumn}>
                  <div className={styles.infoBlock}>
                    <span className={styles.infoLabel}>Unidad</span>
                    <span className={styles.infoValue}>{getDptoName()}</span>
                  </div>
                  <div className={styles.infoBlock}>
                    <span className={styles.infoLabel}>Propietario </span>
                    <span className={styles.infoValue}>
                      {propietarioDisplay}
                    </span>
                  </div>
                  <div className={styles.infoBlock}>
                    <span className={styles.infoLabel}>Titular</span>
                    <span className={styles.infoValue}>
                      {item.details?.[0]?.debt_dpto?.dpto?.holder === "H"
                        ? propietarioDisplay
                        : tenantDisplay}
                    </span>
                  </div>
                  {showBankAccount &&
                    item.status !== "R" &&
                    item.status !== "X" && (
                      <div className={styles.infoBlock}>
                        <span className={styles.infoLabel}>Observación</span>
                        <span className={styles.infoValue}>
                          {item.obs || "-/-"}
                        </span>
                      </div>
                    )}
                </div>
                {/* Columna Central */}
                <div className={styles.detailsColumn}>
                  <div className={styles.infoBlock}>
                    <span className={styles.infoLabel}>Pagado por</span>
                    <span className={styles.infoValue}>
                      {getFullName(item.owner) || "-/-"}
                    </span>
                  </div>
                  <div className={styles.infoBlock}>
                    <span className={styles.infoLabel}>Método de pago</span>
                    <span className={styles.infoValue}>
                      {getPaymentType(item.method || "")}
                    </span>
                  </div>

                  {showBankAccount && (
                    <div className={styles.infoBlock}>
                      <span className={styles.infoLabel}>Cuenta bancaria</span>
                      <span className={styles.infoValue}>
                        {(bankAccount?.bank_entity?.name ||
                          bankAccount?.bankEntity?.name ||
                          "-/-") +
                          " - " +
                          (bankAccount?.account_number || "-/-")}
                      </span>
                    </div>
                  )}

                  {confirmedBy && item.status === "R" && (
                    <div className={styles.infoBlock}>
                      <span className={styles.infoLabel}>{aprobadoLabel}</span>
                      <span className={styles.infoValue}>
                        {aprobadoPorDisplay}
                      </span>
                    </div>
                  )}
                  {!showBankAccount &&
                    item.status !== "R" &&
                    item.status !== "X" && (
                      <div className={styles.infoBlock}>
                        <span className={styles.infoLabel}>Observación</span>
                        <span className={styles.infoValue}>
                          {item.obs || "-/-"}
                        </span>
                      </div>
                    )}
                  {item.status === "X" && (
                    <>
                      <div className={styles.infoBlock}>
                        <span className={styles.infoLabel}>Anulado por</span>
                        <span className={styles.infoValue}>
                          {anuladoPorDisplay}
                        </span>
                      </div>
                      {item.user && (
                        <div className={styles.infoBlock}>
                          <span className={styles.infoLabel}>
                            Registrado por
                          </span>
                          <span className={styles.infoValue}>
                            {registradoPorDisplay}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
                {/* Columna Derecha */}
                <div className={styles.detailsColumn}>
                  <div className={styles.infoBlock}>
                    <span className={styles.infoLabel}>Estado</span>
                    <span className={`${styles.infoValue} ${statusClass}`}>
                      {getStatus(item.status)}
                    </span>
                  </div>

                  {item.status === "R" && (
                    <>
                      <div className={styles.infoBlock}>
                        <span className={styles.infoLabel}>
                          Motivo de rechazo
                        </span>
                        <span
                          className={`${styles.infoValue} ${styles.rechazedReason}`}
                        >
                          {item.confirm_obs || "-/-"}
                        </span>
                      </div>
                      <div className={styles.infoBlock}>
                        <span className={styles.infoLabel}>Observación</span>
                        <span className={styles.infoValue}>
                          {item.obs || "-/-"}
                        </span>
                      </div>
                    </>
                  )}
                  {item.status === "X" ? (
                    <div className={styles.infoBlock}>
                      <span className={styles.infoLabel}>
                        Motivo de rechazo
                      </span>
                      <span
                        className={`${styles.infoValue} ${styles.canceledReason}`}
                      >
                        {item.canceled_obs || "-/-"}
                      </span>
                    </div>
                  ) : (
                    <>
                      {confirmedBy && item.status !== "R" && (
                        <div className={styles.infoBlock}>
                          <span className={styles.infoLabel}>
                            {aprobadoLabel}
                          </span>
                          <span className={styles.infoValue}>
                            {aprobadoPorDisplay}
                          </span>
                        </div>
                      )}
                      {item.user && (
                        <div className={styles.infoBlock}>
                          <span className={styles.infoLabel}>
                            Registrado por
                          </span>
                          <span className={styles.infoValue}>
                            {registradoPorDisplay}
                          </span>
                        </div>
                      )}
                    </>
                  )}

                  {/* Ocultar completamente el bloque de respaldo si está rechazado */}
                  {item.status !== "R" && (
                    <div className={styles.infoBlock}>
                      <span className={styles.infoLabel}>
                        Nro. de respaldo de pago
                      </span>
                      <span className={styles.infoValue}>
                        {item.voucher ? (
                          <>
                            {item.voucher + " "}
                            <button
                              type="button"
                              className={styles.textButtonAccent}
                              onClick={openVoucherEditor}
                            >
                              Editar
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className={styles.textButtonAccent}
                            onClick={openVoucherEditor}
                          >
                            Añadir número
                          </button>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </section>
            </div>

            {paymentDetails.length > 0 && (
                <div
                  style={{ marginBottom: 12 }}
                  // className={styles.container}
                >
                  <div className={styles.periodsDetailsSection}>
                    <div className={styles.periodsDetailsHeader}>
                      <h3 className={styles.periodsDetailsTitle}>
                        Detalles del pago
                      </h3>
                    </div>

                    <div className={styles.periodsTableWrapper}>
                      <Table
                        className="striped"
                        height={paymentDetailsTableHeight}
                        data={paymentDetails}
                        header={paymentDetailsHeader as any}
                      />
                    </div>
                  </div>
                </div>
              )}

            <div className={styles.voucherButtonContainer}>
              {item && onDel && item.status === "P" && item.user && (
                <Button
                  onClick={handleAnularClick}
                  className={styles.textButtonDanger}
                  // style={{ marginRight: 8 }}
                  variant="danger"
                >
                  Anular ingreso
                </Button>
              )}

              {item.status === "P" && (
                <Button
                  variant="secondary"
                  className={styles.voucherButton}
                  // style={hasVoucherUrls ? { marginRight: 8 } : {}}
                  onClick={() => handleGenerateReceipt(item)}
                >
                  Ver Recibo
                </Button>
              )}
              {item.status === "P" && (
                <Button
                  variant="secondary"
                  className={styles.voucherButton}
                  // style={{ marginRight: 8 }}
                  onClick={handleShareReceiptWhatsApp}
                >
                  Compartir por WhatsApp
                </Button>
              )}
              {hasVoucherUrls && (
                <Button
                  variant="secondary"
                  className={styles.voucherButton}
                  onClick={handleViewOrDownloadVouchers}
                >
                  Ver comprobante
                </Button>
              )}
              {canReviewPayment && (
                <Button
                  variant="secondary"
                  className={styles.voucherButton}
                  onClick={() => {
                    setOnRechazar(true);
                  }}
                >
                  Rechazar pago
                </Button>
              )}
              {canReviewPayment && (
                <Button
                  variant="primary"
                  className={styles.voucherButton}
                  onClick={() => onConfirm(true)}
                >
                  Aprobar pago
                </Button>
              )}
            </div>
          </>
        )}
      </DataModal>

      {/* Modal para añadir/editar número de respaldo de pago */}
      <DataModal
        open={openVoucherModal}
        onClose={() => {
          setOpenVoucherModal(false);
          setVoucherErrors({});
        }}
        title={
          item?.voucher
            ? "Editar número de respaldo de pago"
            : "Añadir número de respaldo de pago"
        }
        buttonText={"Guardar"}
        buttonCancel={"Cancelar"}
        onSave={onSaveVoucher}
        style={style}
        minWidth={720}
        maxWidth={860}
      >
        <Input
          label={"Número de respaldo de pago"}
          name={"voucher"}
          value={voucherValue}
          onChange={(e: any) => {
            const alnum = String(e.target.value || "")
              .replace(/[^a-zA-Z0-9]/g, "")
              .substring(0, 50);
            setVoucherValue(alnum);
          }}
          error={voucherErrors}
          maxLength={50}
        />
      </DataModal>

      <DataModal
        title="Rechazar pago"
        buttonText="Rechazar"
        buttonCancel="Cancelar"
        onSave={() => onConfirm(false)}
        open={onRechazar}
        onClose={() => setOnRechazar(false)}
        style={style}
        minWidth={720}
        maxWidth={860}
      >
        <TextArea
          label="Observaciones"
          required
          error={errors}
          name="confirm_obs"
          onChange={handleChangeInput}
          value={formState?.confirm_obs || ""}
        />
      </DataModal>
    </>
  );
});

RenderView.displayName = "RenderViewPayment";

export default RenderView;

// Función para obtener el tipo de deuda
const getDebtType = (type: number) => {
  switch (Number(type)) {
    case 0:
      return "Individual";
    case 1:
      return "Expensas";
    case 2:
      return "Reservas";
    case 3:
      return "Multa por Cancelación";
    case 4:
      return "Compartida";
    case 5:
      return "Condonación";
    default:
      return "Desconocido";
  }
};

// Función para obtener el concepto basado en el tipo
const getConceptByType = (periodo: any) => {
  const type = Number(periodo?.debt_dpto?.type);

  switch (type) {
    case 0: // Individual
    case 4: // Compartida
      return periodo?.subcategory?.name || "-/-";
    case 1: {
      // Expensas: mostrar periodo (MES y AÑO)
      const monthNumRaw =
        periodo?.debt_dpto?.debt?.month ?? periodo?.debt_dpto?.shared?.month;
      const yearNumRaw =
        periodo?.debt_dpto?.debt?.year ?? periodo?.debt_dpto?.shared?.year;

      const monthIndex =
        typeof monthNumRaw === "number"
          ? monthNumRaw
          : parseInt(String(monthNumRaw), 10);
      const yearNum =
        typeof yearNumRaw === "number"
          ? yearNumRaw
          : parseInt(String(yearNumRaw), 10);

      if (
        Number.isFinite(monthIndex) &&
        Number.isFinite(yearNum) &&
        monthIndex >= 1 &&
        monthIndex <= 12
      ) {
        return `${MONTHS_ES[monthIndex - 1]} ${yearNum}`;
      }
      return periodo?.subcategory?.name || "-/-";
    }
    case 2: {
      // Reservas
      const penaltyAmount = getDetailAmount(periodo, "penalty_amount");
      const areaTitle =
        periodo?.debt_dpto?.reservation?.area?.title ||
        periodo?.debt_dpto?.debt?.reservation?.area?.title ||
        "-/-";

      if (penaltyAmount > 0) {
        return `Multa: ${areaTitle}`;
      } else {
        return `Reserva: ${areaTitle}`;
      }
    }
    case 3: // Multa por Cancelación
      return `Multa por Cancelación: ${
        periodo?.debt_dpto?.penaltyReservation?.area?.title ||
        periodo?.debt_dpto?.debt?.reservation_penalty?.area?.title ||
        "-/-"
      }`;
    default:
      return periodo?.subcategory?.name || "-/-";
  }
};

const getDetailAmount = (
  periodo: any,
  field: "amount" | "penalty_amount" | "maintenance_amount",
) => {
  const debtDptoValue = parseFloat(String(periodo?.debt_dpto?.[field] ?? ""));
  if (Number.isFinite(debtDptoValue)) {
    return debtDptoValue;
  }

  const detailValue = parseFloat(String(periodo?.[field] ?? ""));
  return Number.isFinite(detailValue) ? detailValue : 0;
};

// Función para calcular el subtotal incluyendo mantenimiento de valor
const getSubtotal = (periodo: any) => {
  const amount = getDetailAmount(periodo, "amount");
  const penaltyAmount = getDetailAmount(periodo, "penalty_amount");
  const maintenanceAmount = getDetailAmount(periodo, "maintenance_amount");
  return amount + penaltyAmount + maintenanceAmount;
};
