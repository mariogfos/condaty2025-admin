"use client";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import styles from "../PartialPayments.module.css";
import Button from "@/mk/components/forms/Button/Button";
import { ReactNode, useEffect, useState } from "react";
import { Card } from "@/mk/components/ui/Card/Card";
import RenderForm from "../RenderForm/RenderForm";
import SkeletonAdapterComponent from "@/mk/components/ui/LoadingScreen/SkeletonAdapter";
interface SectionValuesProps {
  left: { label: string; value: string | ReactNode };
  right: { label: string; value: string | ReactNode };
}

const SectionValues = ({ left, right }: SectionValuesProps) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        width: "100%",
      }}
    >
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 14, fontWeight: 600 }}>{left.label}</p>
        <div style={{ marginTop: 4 }}>
          {typeof left.value === "string" ? (
            <p
              style={{
                color: "var(--cWhite)",
                fontWeight: 600,
                fontSize: 16,
              }}
            >
              {left.value}
            </p>
          ) : (
            left.value
          )}
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 14, fontWeight: 600 }}>{right.label}</p>
        <div style={{ marginTop: 4 }}>
          {typeof right.value === "string" ? (
            <p
              style={{
                color: "var(--cWhite)",
                fontWeight: 600,
                fontSize: 16,
              }}
            >
              {right.value}
            </p>
          ) : (
            right.value
          )}
        </div>
      </div>
    </div>
  );
};

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
  const getDetail = async () => {
    if (data?.id) {
      setLoading(true);
      const { data: res } = await execute(
        `/bank-accounts`,
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
      `/bank-account-availability/${item?.id}`,
      "PUT",
      {
        status: item?.status === "A" ? "X" : "A",
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
        title={"Detalle de la solicitud"}
        buttonText=""
        buttonCancel=""
        buttonExtra={
          <div style={{ display: "flex", width: "100%", gap: 8 }}>
            <Button variant="secondary" onClick={() => setOpenForm(true)}>
              Editar datos
            </Button>
            <Button
              // onClick={handleUpdateStatus}
              onClick={() => setOpenConfirm(true)}
              style={{
                backgroundColor:
                  item?.status === "A" ? "var(--cError)" : "var(--cAccent)",
              }}
            >
              {item?.status === "A"
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
          <Card style={{ marginBottom: 12 }}>
            <SectionValues
              left={{ label: "Alias", value: item?.alias_holder }}
              right={{ label: "Titular", value: item?.holder }}
            />
            <SectionValues
              left={{
                label: "Entidad bancaria",
                value: item?.bank_entity?.name || "No especificada",
              }}
              right={{ label: "CI / NIT", value: item?.ci_holder }}
            />
            <SectionValues
              left={{
                label: "Nº de cuenta",
                value: item?.account_number,
              }}
              right={{
                label: "Estado",
                value: (
                  <div
                    style={{
                      padding: "4px 8px",
                      backgroundColor:
                        item?.status === "A"
                          ? "var(--cHoverSuccess)"
                          : "var(--cHoverError)",
                      color:
                        item?.status === "A"
                          ? "var(--cSuccess)"
                          : "var(--cError)",
                      borderRadius: 12,
                      fontSize: 14,
                      width: "min-content",
                    }}
                  >
                    {item?.status === "A" ? "Habilitada" : "Deshabilitada"}
                  </div>
                ),
              }}
            />
            <SectionValues
              left={{
                label: "Tipo de Moneda",
                value: item?.currency_type?.name,
              }}
              right={{
                label: "Asignada a",
                value: (
                  <p
                    style={{
                      color: "var(--cWhite)",
                      fontWeight: 600,
                      fontSize: 16,
                    }}
                  >
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
                  </p>
                ),
              }}
            />
          </Card>
        )}
      </DataModal>
      {openConfirm && (
        <DataModal
          style={{ width: 600 }}
          title={
            item?.status === "A" ? "Deshabilitar cuenta" : "Habilitar cuenta"
          }
          buttonText=""
          buttonExtra={
            <div style={{ display: "flex", width: "100%", gap: 8 }}>
              <Button variant="secondary" onClick={() => setOpenConfirm(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleUpdateStatus}
                style={{
                  backgroundColor:
                    item?.status === "A" ? "var(--cError)" : "var(--cAccent)",
                }}
              >
                {item?.status === "A" ? "Deshabilitar cuenta" : "Confirmar"}
              </Button>
            </div>
          }
          buttonCancel=""
          open={openConfirm}
          onSave={handleUpdateStatus}
          onClose={() => setOpenConfirm(false)}
        >
          <p>
            {item?.status === "A"
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
