"use client";
import React, { memo, useState } from "react";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import Button from "@/mk/components/forms/Button/Button";
import { formatToDayDDMMYYYYHHMM } from "@/mk/utils/date";
import { formatBs } from "@/mk/utils/numbers";
import { getFullName } from "@/mk/utils/string";
import { UnitsType } from "@/mk/utils/utils";
import { IconEdit, IconTrash } from "@/components/layout/icons/IconsBiblioteca";
import useAxios from "@/mk/hooks/useAxios";
import LoadingScreen from "@/mk/components/ui/LoadingScreen/LoadingScreen";
import styles from "./RenderView.module.css";

interface DebtItem {
  id?: number | string;
  begin_at?: string;
  due_at?: string;
  type?: number;
  description?: string;
  subcategory_id?: number;
  asignar?: string;
  dpto_id?: number;
  amount_type?: string;
  amount?: number | string;
  is_advance?: string;
  interest?: number | string;
  has_mv?: string | boolean;
  is_forgivable?: string | boolean;
  has_pp?: string | boolean;
  is_blocking?: string | boolean;
  status?: string;
  created_at?: string;
  updated_at?: string;
  user?: any;
  client_id?: string;
  month?: number;
  year?: number;
  deleted_at?: string | null;
}

interface ExtraData {
  dptos?: any[];
}

interface RenderViewProps {
  open: boolean;
  onClose: () => void;
  item?: DebtItem | Record<string, any>;
  extraData?: ExtraData;
  user?: any;
  onEdit?: (item: DebtItem) => void;
  onDel?: (item: DebtItem) => void;
}

const RenderView: React.FC<RenderViewProps> = memo((props) => {
  const { open, onClose, item, extraData, user, onEdit, onDel } = props;

  // Consulta DET si solo tenemos un ID o si necesitamos más detalles
  const { data, reLoad } = useAxios(
    "/debts",
    "GET",
    {
      searchBy: item?.id,
      fullType: "DET",
      perPage: 1,
      page: 1,
    },
    open && !!item?.id // Solo ejecutar si el modal está abierto y tenemos un ID
  );

  // Usar los datos de la consulta DET si están disponibles, sino usar el item original
  const debtDetail = data?.data?.[0] || item || {};
  const client = user?.clients?.filter(
    (clientItem: any) => clientItem.id === user.client_id
  )[0];

  const getSubcategoryName = (subcategoryId?: number) => {
    if (!subcategoryId) return "No especificada";
    const subcategories: { [key: number]: string } = {
      1: "Agua",
      2: "Electricidad",
      3: "Gas",
      4: "Internet",
      5: "Teléfono",
      6: "Limpieza",
      7: "Jardinería",
      8: "Reparaciones menores",
      9: "Pintura",
      10: "Reparación de equipos",
    };
    return subcategories[subcategoryId] || "No especificada";
  };

  const getTypeName = (type?: number) => {
    if (!type) return "No especificado";
    const types: { [key: number]: string } = {
      1: "Cuota ordinaria",
      2: "Cuota extraordinaria",
      3: "Multa",
      4: "Otros",
    };
    return types[type] || `Tipo ${type}`;
  };

  const getAsignarName = (asignar?: string) => {
    if (!asignar) return "No especificado";
    return asignar === "S" ? "Sí" : "No";
  };

  const getAmountTypeName = (amountType?: string) => {
    if (!amountType) return "No especificado";
    const types: { [key: string]: string } = {
      F: "Fijo",
      V: "Variable",
      P: "Porcentual",
    };
    return types[amountType] || "No especificado";
  };

  const getIsAdvanceName = (isAdvance?: string) => {
    if (!isAdvance) return "No especificado";
    return isAdvance === "Y" ? "Sí" : "No";
  };

  const getStatusText = (status?: string) => {
    const statusMap: { [key: string]: string } = {
      A: "Activa",
      P: "Pagada",
      C: "Cancelada",
      X: "Anulada",
    };
    return statusMap[status || ""] || status || "Activa";
  };

  const getDepartmentName = () => {
    if (!debtDetail?.dpto_id || !extraData?.dptos) return "No especificado";

    const dpto = extraData.dptos.find((d: any) => d.id === debtDetail.dpto_id);
    if (!dpto) return "No especificado";

    return `${getFullName(dpto?.titular) || "Sin titular"} - ${dpto.nro} ${
      UnitsType["_" + client?.type_dpto]
    } ${dpto.description}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "No especificada";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getBooleanText = (value?: string | boolean) => {
    if (value === undefined || value === null) return "No especificado";
    if (typeof value === "boolean") return value ? "Sí" : "No";
    return value === "Y" ? "Sí" : "No";
  };

  const getStatusStyle = (status?: string) => {
    if (status === "A") return styles.statusActive;
    if (status === "P") return styles.statusCompleted;
    if (status === "C") return styles.statusCancelled;
    if (status === "X") return styles.statusCancelled;
    return "";
  };

  const handleEditClick = () => {
    if (debtDetail && onEdit) {
      onEdit(debtDetail);
    }
  };

  const handleDeleteClick = () => {
    if (debtDetail && onDel) {
      onDel(debtDetail);
    }
  };

  const formatAmount = (amount?: number | string) => {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    return formatBs(numAmount || 0);
  };

  const formatInterest = (interest?: number | string) => {
    const numInterest =
      typeof interest === "string" ? parseFloat(interest) : interest;
    return numInterest || 0;
  };

  return (
    <DataModal
      open={open}
      onClose={onClose}
      title="Detalle de la Deuda"
      buttonText=""
      buttonCancel=""
    >
      <LoadingScreen
        onlyLoading={Object.keys(debtDetail).length === 0 && open}
        type="CardSkeleton"
      >
        {/* Botones de acción con iconos */}
        {(onEdit || onDel) && Object.keys(debtDetail).length > 0 && (
          <div className={styles.headerActionContainer}>
            {onEdit && (
              <button
                type="button"
                onClick={handleEditClick}
                className={styles.iconButton}
                title="Editar deuda"
              >
                <IconEdit size={20} color="var(--cAccent)" />
              </button>
            )}
            {onDel &&
              debtDetail.status !== "X" &&
              debtDetail.status !== "P" && (
                <button
                  type="button"
                  onClick={handleDeleteClick}
                  className={styles.iconButtonDanger}
                  title="Eliminar deuda"
                >
                  <IconTrash size={20} color="var(--cError)" />
                </button>
              )}
          </div>
        )}

        {Object.keys(debtDetail).length === 0 ? (
          <div className={styles.container}>
            <div className={styles.notFoundContainer}>
              <p className={styles.notFoundText}>
                No se encontró información de la deuda.
              </p>
              <p className={styles.notFoundSuggestion}>
                Por favor, verifica los detalles o intenta de nuevo más tarde.
              </p>
            </div>
          </div>
        ) : (
          <div className={styles.container}>
            {/* Header con monto y fechas principales */}
            <div className={styles.headerSection}>
              <div className={styles.amountDisplay}>
                {formatAmount(debtDetail.amount)}
              </div>
              <div className={styles.dateDisplay}>
                Vence: {formatDate(debtDetail.due_at)}
              </div>
            </div>

            <hr className={styles.sectionDivider} />

            {/* Sección de detalles principales */}
            <section className={styles.detailsSection}>
              {/* Columna Izquierda */}
              <div className={styles.detailsColumn}>
                <div className={styles.infoBlock}>
                  <span className={styles.infoLabel}>Período</span>
                  <span className={styles.infoValue}>
                    {debtDetail.month && debtDetail.year
                      ? `${
                          [
                            "",
                            "Enero",
                            "Febrero",
                            "Marzo",
                            "Abril",
                            "Mayo",
                            "Junio",
                            "Julio",
                            "Agosto",
                            "Septiembre",
                            "Octubre",
                            "Noviembre",
                            "Diciembre",
                          ][debtDetail.month]
                        } ${debtDetail.year}`
                      : "No especificado"}
                  </span>
                </div>
                <div className={styles.infoBlock}>
                  <span className={styles.infoLabel}>Fecha de inicio</span>
                  <span className={styles.infoValue}>
                    {formatDate(debtDetail.begin_at)}
                  </span>
                </div>
                <div className={styles.infoBlock}>
                  <span className={styles.infoLabel}>Fecha de vencimiento</span>
                  <span className={styles.infoValue}>
                    {formatDate(debtDetail.due_at)}
                  </span>
                </div>
                <div className={styles.infoBlock}>
                  <span className={styles.infoLabel}>Tipo</span>
                  <span className={styles.infoValue}>
                    {getTypeName(debtDetail.type)}
                  </span>
                </div>
                <div className={styles.infoBlock}>
                  <span className={styles.infoLabel}>Subcategoría</span>
                  <span className={styles.infoValue}>
                    {getSubcategoryName(debtDetail.subcategory_id)}
                  </span>
                </div>
                <div className={styles.infoBlock}>
                  <span className={styles.infoLabel}>Asignar</span>
                  <span className={styles.infoValue}>
                    {getAsignarName(debtDetail.asignar)}
                  </span>
                </div>
              </div>

              {/* Columna Derecha */}
              <div className={styles.detailsColumn}>
                <div className={styles.infoBlock}>
                  <span className={styles.infoLabel}>Estado</span>
                  <span
                    className={`${styles.infoValue} ${getStatusStyle(
                      debtDetail.status
                    )}`}
                  >
                    {getStatusText(debtDetail.status)}
                  </span>
                </div>
                <div className={styles.infoBlock}>
                  <span className={styles.infoLabel}>Tipo de monto</span>
                  <span className={styles.infoValue}>
                    {getAmountTypeName(debtDetail.amount_type)}
                  </span>
                </div>
                <div className={styles.infoBlock}>
                  <span className={styles.infoLabel}>Monto</span>
                  <span className={styles.infoValue}>
                    {formatAmount(debtDetail.amount)}
                  </span>
                </div>
                <div className={styles.infoBlock}>
                  <span className={styles.infoLabel}>Es anticipo</span>
                  <span className={styles.infoValue}>
                    {getIsAdvanceName(debtDetail.is_advance)}
                  </span>
                </div>
                <div className={styles.infoBlock}>
                  <span className={styles.infoLabel}>Interés (%)</span>
                  <span className={styles.infoValue}>
                    {formatInterest(debtDetail.interest)}%
                  </span>
                </div>
                <div className={styles.infoBlock}>
                  <span className={styles.infoLabel}>Departamento</span>
                  <span className={styles.infoValue}>
                    {getDepartmentName()}
                  </span>
                </div>
              </div>
            </section>

            <hr className={styles.sectionDivider} />

            {/* Sección de configuración avanzada - Ancho completo */}
            <section className={styles.advancedSection}>
              <div className={styles.advancedSectionTitle}>
                Configuración Avanzada
              </div>
              <div className={styles.advancedGrid}>
                <div className={styles.advancedItem}>
                  <span className={styles.infoLabel}>
                    Tiene Mantenimiento de Valor
                  </span>
                  <span className={styles.infoValue}>
                    {getBooleanText(debtDetail.has_mv)}
                  </span>
                </div>
                <div className={styles.advancedItem}>
                  <span className={styles.infoLabel}>Es perdonable</span>
                  <span className={styles.infoValue}>
                    {getBooleanText(debtDetail.is_forgivable)}
                  </span>
                </div>
                <div className={styles.advancedItem}>
                  <span className={styles.infoLabel}>Tiene Plan de Pago</span>
                  <span className={styles.infoValue}>
                    {getBooleanText(debtDetail.has_pp)}
                  </span>
                </div>
                <div className={styles.advancedItem}>
                  <span className={styles.infoLabel}>Es bloqueante</span>
                  <span className={styles.infoValue}>
                    {getBooleanText(debtDetail.is_blocking)}
                  </span>
                </div>
              </div>
            </section>

            {/* Descripción si existe */}
            {debtDetail.description && (
              <>
                <hr className={styles.sectionDivider} />
                <section className={styles.descriptionSection}>
                  <div className={styles.infoBlock}>
                    <span className={styles.infoLabel}>Descripción</span>
                    <span className={styles.infoValue}>
                      {debtDetail.description
                        .split("\n")
                        .map((line: string, idx: number) => (
                          <span key={idx}>{line}</span>
                        ))}
                    </span>
                  </div>
                </section>
              </>
            )}

            <hr className={styles.sectionDivider} />

            {/* Información de fechas del sistema */}
            <section className={styles.detailsSection}>
              <div className={styles.detailsColumn}>
                <div className={styles.infoBlock}>
                  <span className={styles.infoLabel}>Fecha de creación</span>
                  <span className={styles.infoValue}>
                    {debtDetail.created_at
                      ? formatToDayDDMMYYYYHHMM(debtDetail.created_at)
                      : "No disponible"}
                  </span>
                </div>
              </div>
              <div className={styles.detailsColumn}>
                <div className={styles.infoBlock}>
                  <span className={styles.infoLabel}>Última actualización</span>
                  <span className={styles.infoValue}>
                    {debtDetail.updated_at
                      ? formatToDayDDMMYYYYHHMM(debtDetail.updated_at)
                      : "No disponible"}
                  </span>
                </div>
              </div>
            </section>
          </div>
        )}
      </LoadingScreen>
    </DataModal>
  );
});

RenderView.displayName = "RenderViewDebtsManager";

export default RenderView;
