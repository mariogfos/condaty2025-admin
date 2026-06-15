"use client";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import styles from "../BankAccounts.module.css";
import Button from "@/mk/components/forms/Button/Button";
import { useEffect, useState } from "react";
import { formatNumber } from "@/mk/utils/numbers";
import RenderForm from "../RenderForm/RenderForm";
import SkeletonAdapterComponent from "@/mk/components/ui/LoadingScreen/SkeletonAdapter";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import { BankAccountStatus } from "../Type/BankType";
import { bankAccountsApi } from "../api";

const RenderView = (props: any) => {
  const {
    open,
    onClose,
    item: data,
    reLoad,
    execute,
    showToast,
    extraData,
  } = props;
  const [openForm, setOpenForm] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [item, setItem]: any = useState({});
  const [loading, setLoading] = useState(false);
  const qrImage =
    item?.images?.[0] ||
    item?.images?.url ||
    item?.image ||
    item?.url_image ||
    "";
  const isActive = Number(item?.status_v3) === BankAccountStatus.ACTIVE;

  const getDetail = async () => {
    if (data?.id) {
      setLoading(true);
      const { data: res } = await execute(
        bankAccountsApi.base,
        "GET",
        {
          fullType: "DET",
          searchBy: data?.id,
        },
        false,
        true
      );

      if (res?.success) {
        setItem({ ...res?.data?.data, isInUse: res?.data?.isInUse });
      } else {
        showToast("Error al obtener los datos", "error");
      }
      setLoading(false);
    }
  };
  useEffect(() => {
    getDetail();
  }, [data?.id]);

  const handleUpdateStatus = async () => {
    setLoading(true);
    const { data: res } = await execute(
      bankAccountsApi.availability(item?.id),
      "PUT",
      {
        status: isActive ? BankAccountStatus.INACTIVE : BankAccountStatus.ACTIVE,
      },
      false,
      true
    );

    if (res?.success) {
      showToast("Estado actualizado", "success");
      getDetail();
      reLoad();
    } else {
      showToast("Error al actualizar el estado", "error");
    }
    setLoading(false);
  };

  return (
    <>
      <DataModal
        open={open}
        onClose={onClose}
        title={"Detalle de la cuenta"}
        buttonText=""
        buttonCancel=""
        buttonExtra={
          <div className={styles.detailActionsRow}>
            <Button variant="secondary" onClick={() => setOpenForm(true)}>
              Editar datos
            </Button>
            <Button
              variant={isActive ? "cancel" : "primary"}
              onClick={() => setOpenConfirm(true)}
              style={{
                backgroundColor:
                  isActive
                    ? "color-mix(in srgb, var(--cError) 92%, white 8%)"
                    : undefined,
                borderColor:
                  isActive
                    ? "color-mix(in srgb, var(--cError) 72%, black 28%)"
                    : undefined,
              }}
            >
              {isActive
                ? "Deshabilitar cuenta"
                : "Habilitar cuenta"}
            </Button>
          </div>
        }
        style={{ width: "860px" }}
        className={styles.renderView}
      >
        {loading ? (
          <SkeletonAdapterComponent type="CardSkeleton" />
        ) : (
          <div className={styles.bankDetailCard}>
            <div className={styles.bankDetailTopGrid}>
              <div className={styles.bankDetailGrid}>
                <div className={styles.bankDetailField}>
                  <p className={styles.bankDetailLabel}>Alias</p>
                  <div className={styles.bankDetailValue}>{item?.alias_holder || "-/-"}</div>
                </div>
                <div className={styles.bankDetailField}>
                  <p className={styles.bankDetailLabel}>Titular</p>
                  <div className={styles.bankDetailValue}>{item?.holder || "-/-"}</div>
                </div>

                <div className={styles.bankDetailField}>
                  <p className={styles.bankDetailLabel}>Entidad bancaria</p>
                  <div className={styles.bankDetailValue}>
                    {item?.bank_entity?.name || "No especificada"}
                  </div>
                </div>
                <div className={styles.bankDetailField}>
                  <p className={styles.bankDetailLabel}>CI / NIT</p>
                  <div className={styles.bankDetailValue}>{item?.ci_holder || "-/-"}</div>
                </div>

                <div className={styles.bankDetailField}>
                  <p className={styles.bankDetailLabel}>Nro. de cuenta</p>
                  <div className={styles.bankDetailValue}>{item?.account_number || "-/-"}</div>
                </div>
                <div className={styles.bankDetailField}>
                  <p className={styles.bankDetailLabel}>Estado</p>
                  <div className={styles.bankDetailBadgeWrap}>
                    <StatusBadge
                      color={isActive ? "var(--cSuccess)" : "var(--cError)"}
                      backgroundColor={
                        isActive
                          ? "var(--cHoverSuccess)"
                          : "var(--cHoverError)"
                      }
                    >
                      {isActive ? "Habilitada" : "Deshabilitada"}
                    </StatusBadge>
                  </div>
                </div>

                <div className={styles.bankDetailField}>
                  <p className={styles.bankDetailLabel}>Tipo de moneda</p>
                  <div className={styles.bankDetailValue}>
                    {item?.currency_type?.name || "-/-"}
                  </div>
                </div>
                <div className={styles.bankDetailField}>
                  <p className={styles.bankDetailLabel}>Asignada a</p>
                  <div className={styles.bankDetailValue}>
                    {["Expensa", "Reserva", "Principal"]
                      .filter((label, index) => {
                        const flags = [
                          item?.is_expense,
                          item?.is_reserve,
                          item?.is_main,
                        ];
                        return flags[index] > 0;
                      })
                      .join(", ") || "-/-"}
                  </div>
                </div>

                <div className={styles.bankDetailField}>
                  <p className={styles.bankDetailLabel}>Saldo inicial</p>
                  <div className={styles.bankDetailValue}>
                    {item?.initial_amount !== undefined &&
                    item?.initial_amount !== null
                      ? `${formatNumber(item.initial_amount, 2)} ${
                          item?.currency_type?.code || ""
                        }`
                      : "-/-"}
                  </div>
                </div>
              </div>

              <div className={styles.bankQrCard}>
                <div className={styles.bankQrHeader}>
                  <p className={styles.bankDetailLabel}>QR de la cuenta</p>
                  <p className={styles.bankQrHint}>
                    Código visible para pagos y comprobantes.
                  </p>
                </div>

                <div className={styles.bankQrPreview}>
                  {qrImage ? (
                    <img
                      src={qrImage}
                      alt="QR de la cuenta bancaria"
                      className={styles.bankQrImage}
                    />
                  ) : (
                    <div className={styles.bankQrPlaceholder}>Sin QR</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </DataModal>
      {openConfirm && (
        <DataModal
          style={{ width: 600 }}
          title={
            isActive ? "Deshabilitar cuenta" : "Habilitar cuenta"
          }
          buttonText=""
          buttonExtra={
            <div className={styles.detailActionsRow}>
              <Button variant="secondary" onClick={() => setOpenConfirm(false)}>
                Cancelar
              </Button>
              <Button
                variant={isActive ? "cancel" : "primary"}
                onClick={handleUpdateStatus}
                style={{
                  backgroundColor:
                    isActive
                      ? "color-mix(in srgb, var(--cError) 92%, white 8%)"
                      : undefined,
                  borderColor:
                    isActive
                      ? "color-mix(in srgb, var(--cError) 72%, black 28%)"
                      : undefined,
                }}
              >
                {isActive ? "Deshabilitar cuenta" : "Confirmar"}
              </Button>
            </div>
          }
          buttonCancel=""
          open={openConfirm}
          onSave={handleUpdateStatus}
          onClose={() => setOpenConfirm(false)}
        >
          <p>
            {isActive
              ? "¿Seguro que quieres deshabilitar esta cuenta bancaria? Ya no aparecerá en los flujos de pago."
              : "¿Seguro que quieres habilitar esta cuenta bancaria? Volverá a aparecer en los flujos de pago."}
          </p>
        </DataModal>
      )}

      {openForm && (
        <RenderForm
          open={openForm}
          onClose={() => setOpenForm(false)}
          item={item}
          reLoad={() => {
            getDetail();
            reLoad();
          }}
          execute={execute}
          showToast={showToast}
          extraData={extraData}
        />
      )}
    </>
  );
};

export default RenderView;
