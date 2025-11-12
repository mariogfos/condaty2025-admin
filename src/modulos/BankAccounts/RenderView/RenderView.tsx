"use client";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import styles from "../BankAccounts.module.css";
import { getUrlImages } from "@/mk/utils/string";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import { getFullName } from "../../../mk/utils/string";
import Button from "@/mk/components/forms/Button/Button";
import ActiveOwner from "@/components/ActiveOwner/ActiveOwner";
import { ReactNode, useEffect, useState } from "react";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { Card } from "@/mk/components/ui/Card/Card";
import RenderForm from "../RenderForm/RenderForm";
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
  const { open, onClose, item, reLoad, execute, showToast, extraData, onDel } =
    props;
  const { user } = useAuth();
  const [openForm, setOpenForm] = useState(false);

  return (
    <>
      {open && (
        <>
          <DataModal
            open={open}
            onClose={onClose}
            title={"Detalle de la solicitud"}
            buttonText=""
            buttonCancel=""
            // style={{ width: "max-content" }}
            buttonExtra={
              <div style={{ display: "flex", width: "100%", gap: 8 }}>
                <Button variant="secondary" onClick={() => setOpenForm(true)}>
                  Editar datos
                </Button>
                <Button
                  // onClick={() => onDel(item?.data)}
                  style={{
                    backgroundColor:
                      item?.data?.status === "A"
                        ? "var(--cError)"
                        : "var(--cAccent)",
                  }}
                >
                  {item?.data?.status === "A"
                    ? "Deshabilitar cuenta"
                    : "Habilitar cuenta"}
                </Button>
              </div>
            }
            style={{ width: "860px" }}
            className={styles.renderView}
          >
            <Card style={{ marginBottom: 12 }}>
              <SectionValues
                left={{ label: "Alias", value: item?.data?.alias_holder }}
                right={{ label: "Titular", value: item?.data?.holder }}
              />
              <SectionValues
                left={{
                  label: "Entidad bancaria",
                  value:
                    extraData?.bankEntities?.find(
                      (entity: any) => entity.id === item?.data?.bank_entity_id
                    )?.name || "No especificada",
                }}
                right={{ label: "CI / NIT", value: item?.data?.ci_holder }}
              />
              <SectionValues
                left={{
                  label: "Nº de cuenta",
                  value: item?.data?.account_number,
                }}
                right={{
                  label: "Estado",
                  value: (
                    <div
                      style={{
                        padding: "4px 8px",
                        backgroundColor:
                          item?.data?.status === "A"
                            ? "var(--cHoverSuccess)"
                            : "var(--cHoverError)",
                        color:
                          item?.data?.status === "A"
                            ? "var(--cSuccess)"
                            : "var(--cError)",
                        borderRadius: 12,
                        fontSize: 14,
                        width: "min-content",
                      }}
                    >
                      {item?.data?.status == "A"
                        ? "Habilitada"
                        : "Deshabilitada"}
                    </div>
                  ),
                }}
              />
              <SectionValues
                left={{
                  label: "Tipo de Moneda",
                  value:
                    extraData?.currencyTypes?.find(
                      (type: any) => type?.id === item?.data?.currency_type_id
                    )?.name || "No especificada",
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
                      {item?.data?.is_expense > 0 && "Expensa,"}
                      {item?.data?.is_reserve > 0 && "Reserva,"}
                      {item?.data?.is_main > 0 && "Principal"}
                      {item?.data?.is_expense === 0 &&
                        item?.data?.is_reserve === 0 &&
                        item?.data?.is_main === 0 &&
                        "-/-"}
                    </p>
                  ),
                }}
              />
            </Card>
          </DataModal>
          {openForm && (
            <RenderForm
              open={openForm}
              onClose={() => setOpenForm(false)}
              item={item?.data}
              reLoad={reLoad}
              execute={execute}
              showToast={showToast}
              extraData={extraData}
            />
          )}
        </>
      )}
    </>
  );
};

export default RenderView;
