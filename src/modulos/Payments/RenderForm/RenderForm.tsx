/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import React, { useMemo, useState } from "react";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import EmptyData from "@/components/NoData/EmptyData";
import Select from "@/mk/components/forms/Select/Select";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import Input from "@/mk/components/forms/Input/Input";
import {
  IconCheckOff,
  IconCheckSquare,
} from "@/components/layout/icons/IconsBiblioteca";
import Toast from "@/mk/components/ui/Toast/Toast";
import styles from "./RenderForm.module.css";
import UploadFileV3 from "@/mk/components/forms/UploadFileV3/UploadFileV3";
import { formatBs, formatNumber } from "@/mk/utils/numbers";
import {
  FORM_PAYMENT_METHODS,
  TYPE_OPTIONS,
  FormPaymentType,
} from "../Type/PaymentType";
import { usePaymentsForm, RenderFormProps } from "../hooks/usePaymentsForm";
import CreateExpenseModal from "./CreateExpenseModal";

const MONTH_NAMES = [
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
];

const RenderForm: React.FC<RenderFormProps> = (props) => {
  const { open, onClose } = props;
  const {
    formState,
    setFormState,
    errors,
    deudas,
    selectedPeriodo,
    periodoTotal,
    isLoadingDeudas,
    lDptos,
    filteredCategories,
    showCategoryFields,
    isDebtBasedPayment,
    handleChangeInput,
    handleSelectAllPeriodos,
    handleSelectPeriodo,
    _onSavePago,
    isBankAccountSame,
    getSubtotal,
    getConceptByType,
    getDebtType,
    simulateResult,
    isSimulating,
    simulateError,
    handleAmountBlur,
    isSubmitDisabled,
    addNewExpense,
    updateNewExpense,
    removeNewExpense,
    newExpensesTotal,
  } = usePaymentsForm(props, open);

  // S86 inline-create-expense (modal): controla el modal de crear/editar
  // la expensa virtual.
  const [showCreateExpense, setShowCreateExpense] = useState(false);
  const [editingExpense, setEditingExpense] = useState<
    import("../hooks/usePaymentsForm").NewExpense | null
  >(null);

  // S87: monto "normal" de la unidad. Pre-carga preferentemente el
  // `expense_amount` del dpto (SSoT del back, pinea en `queryForExtraData`
  // desde S87). Si no está disponible, cae a la heurística del front
  // (monto de la primera deuda pre-existente).
  const suggestedAmount = useMemo(() => {
    if (!formState.dpto_id) return 0;
    const selectedDpto = lDptos.find(
      (d) => String(d.id) === String(formState.dpto_id),
    );
    if (selectedDpto && selectedDpto.expense_amount) {
      const n = Number(selectedDpto.expense_amount);
      if (Number.isFinite(n) && n > 0) return n;
    }
    if (deudas.length === 0) return 0;
    const first = deudas[0];
    return getSubtotal(first) || 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formState.dpto_id, lDptos, deudas.length]);

  const deudasContent = useMemo(() => {
    if (!formState.dpto_id) {
      return (
        <EmptyData message="Seleccione una unidad para ver deudas" h={200} />
      );
    } else if (isLoadingDeudas) {
      return <EmptyData message="Cargando deudas..." h={200} />;
    } else if (deudas.length === 0) {
      return (
        <div className={styles["no-deudas-container"]}>
          <EmptyData message="Esta unidad no tiene deudas pendientes" h={200} />
          <p className={styles["no-deudas-message"]}>
            No se encontraron deudas pendientes para esta unidad. No se puede
            registrar un pago de{" "}
            {formState.type === FormPaymentType.EXPENSE
              ? "expensas"
              : formState.type === FormPaymentType.RESERVATION
                ? "reservas"
                : "este tipo"}
            .
          </p>
        </div>
      );
    } else {
      return (
        <div className={styles["deudas-container"]}>
          <div className={styles["deudas-title-row"]}>
            <p className={styles["deudas-title"]}>
              Seleccione las deudas a pagar:
            </p>
            {formState?.type !== FormPaymentType.OTHER && (
              <button
                type="button"
                className={styles["select-all-container"]}
                onClick={handleSelectAllPeriodos}
              >
                <span className={styles["select-all-text"]}>Pagar todo</span>
                {selectedPeriodo.length === deudas.length ? (
                  <IconCheckSquare
                    className={`${styles["check-icon"]} ${styles.selected}`}
                  />
                ) : (
                  <IconCheckOff className={styles["check-icon"]} />
                )}
              </button>
            )}
          </div>

          <div className={styles["deudas-table"]}>
            <div className={styles["deudas-header"]}>
              <span className={styles["header-item"]}>Tipo</span>
              <span className={styles["header-item"]}>Concepto</span>
              <span
                className={`${styles["header-item"]} ${styles["header-amount"]}`}
              >
                Monto
              </span>
              <span
                className={`${styles["header-item"]} ${styles["header-amount"]}`}
              >
                Multa
              </span>
              <span
                className={`${styles["header-item"]} ${styles["header-amount"]}`}
              >
                Mant. Valor
              </span>
              <span
                className={`${styles["header-item"]} ${styles["header-amount"]}`}
              >
                Subtotal
              </span>
              <span className={styles["header-item"]}>Seleccionar</span>
            </div>

            {deudas.map((periodo) => (
              <button
                type="button"
                key={String(periodo.id)}
                onClick={() => {
                  handleSelectPeriodo(periodo);
                }}
                disabled={isBankAccountSame(periodo)}
                className={styles.deudaButton}
                style={{
                  opacity: isBankAccountSame(periodo) ? 0.2 : 1,
                }}
              >
                <div className={styles["deuda-row"]}>
                  <div className={styles["deuda-cell"]}>
                    {getDebtType(periodo.type || 0)}
                  </div>
                  <div className={styles["deuda-cell"]}>
                    {getConceptByType(periodo)}
                  </div>
                  <div
                    className={`${styles["deuda-cell"]} ${styles["amount-cell"]}`}
                  >
                    {"Bs " + formatNumber(Number(periodo.amount ?? 0))}
                  </div>
                  <div
                    className={`${styles["deuda-cell"]} ${styles["amount-cell"]}`}
                  >
                    {"Bs " + formatNumber(Number(periodo.penalty_amount ?? 0))}
                  </div>
                  <div
                    className={`${styles["deuda-cell"]} ${styles["amount-cell"]}`}
                  >
                    {"Bs " +
                      formatNumber(Number(periodo.maintenance_amount ?? 0))}
                  </div>
                  <div
                    className={`${styles["deuda-cell"]} ${styles["amount-cell"]}`}
                  >
                    {"Bs " + formatNumber(getSubtotal(periodo))}
                  </div>

                  <div
                    className={`${styles["deuda-cell"]} ${styles["deuda-check"]}`}
                  >
                    {selectedPeriodo.some((item) => item.id === periodo.id) ? (
                      <IconCheckSquare
                        className={`${styles["check-icon"]} ${styles.selected}`}
                      />
                    ) : (
                      <IconCheckOff className={styles["check-icon"]} />
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className={styles["total-container"]}>
            {formState.type === FormPaymentType.EXPENSE && (
              <button
                type="button"
                data-testid="open-create-expense-modal"
                onClick={() => {
                  setEditingExpense(null);
                  setShowCreateExpense(true);
                }}
                className={styles["select-all-container"]}
                style={{ color: "var(--cAccent, #00e38c)" }}
              >
                <span style={{ fontSize: "0.9rem" }}>
                  + Crear expensa nueva
                </span>
              </button>
            )}
            <p>Total a pagar: {formatBs(periodoTotal + newExpensesTotal)}</p>
          </div>
        </div>
      );
    }
  }, [
    formState.dpto_id,
    formState.type,
    formState.newExpenses,
    isLoadingDeudas,
    deudas,
    selectedPeriodo,
    periodoTotal,
    newExpensesTotal,
    handleSelectAllPeriodos,
    handleSelectPeriodo,
    isBankAccountSame,
    getDebtType,
    getConceptByType,
    getSubtotal,
  ]);

  return (
    <>
      <Toast toast={{ msg: "", type: "info" }} showToast={props.showToast} />
      <DataModal
        open={open}
        onClose={onClose}
        onSave={_onSavePago}
        buttonCancel={"Cancelar"}
        buttonText={"Crear ingreso"}
        title={"Crear ingreso2"}
        minWidth={680}
        maxWidth={860}
        disabled={isSubmitDisabled}
      >
        <div className={styles["income-form-container"]}>
          <div className={styles.section}>
            <div className={styles["input-row"]}>
              <div className={styles["input-half"]}>
                <Input
                  type="date"
                  name="paid_at"
                  label="Seleccionar fecha"
                  required={true}
                  value={formState.paid_at || ""}
                  onChange={handleChangeInput}
                  error={errors}
                />
              </div>
              <div className={styles["input-half"]}>
                <Select
                  name="method"
                  label="Método de pago"
                  value={formState.method}
                  onChange={handleChangeInput}
                  options={FORM_PAYMENT_METHODS}
                  error={errors}
                  required
                  optionLabel="name"
                  optionValue="id"
                />
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles["input-row"]}>
              <div className={styles["input-half"]}>
                <Select
                  name="type"
                  label="Tipo"
                  required={true}
                  value={formState.type}
                  onChange={handleChangeInput}
                  options={TYPE_OPTIONS}
                  error={errors}
                  optionLabel="name"
                  optionValue="id"
                />
              </div>

              <div className={styles["input-half"]}>
                <Select
                  name="dpto_id"
                  label="Seleccionar Unidad"
                  required={true}
                  value={formState.dpto_id}
                  onChange={handleChangeInput}
                  options={lDptos}
                  error={errors}
                  filter={true}
                  filterStyle={{ backgroundColor: "#323232" }}
                />
              </div>
            </div>
          </div>

          {showCategoryFields && (
            <div className={styles.section}>
              <div className={styles["input-row"]}>
                <div className={styles["input-half"]}>
                  <Select
                    name="category_id"
                    label="Categoría"
                    value={formState.category_id}
                    onChange={handleChangeInput}
                    options={filteredCategories}
                    error={errors}
                    required
                    optionLabel="name"
                    optionValue="id"
                    disabled={formState.isCategoryLocked}
                  />
                </div>
                <div className={styles["input-half"]}>
                  <Select
                    name="subcategory_id"
                    label="Subcategoría"
                    value={formState.subcategory_id}
                    onChange={handleChangeInput}
                    options={formState.subcategories || []}
                    error={errors}
                    required
                    optionLabel="name"
                    optionValue="id"
                    disabled={formState.isSubcategoryLocked}
                  />
                </div>
              </div>
            </div>
          )}

          <div className={styles.section}>
            <div>
              {isDebtBasedPayment && (
                <div>
                  {deudasContent}
                  {errors.selectedPeriodo && (
                    <div className={styles["error-message"]}>
                      {errors.selectedPeriodo}
                    </div>
                  )}
                </div>
              )}

              {/* S87 inline-create-expense: lista virtual de expensas nuevas.
                  Aparece DEBAJO de la tabla de deudas pre-existentes. Cada
                  item tiene botones Editar / Eliminar. Soporta N expensas
                  (multi). Solo visible si type === EXPENSE. */}
              {(formState.newExpenses?.length ?? 0) > 0 &&
                formState.type === FormPaymentType.EXPENSE && (
                  <div
                    data-testid="new-expense-card"
                    className={styles["deudas-container"]}
                    style={{
                      marginTop: 12,
                      border: "1px dashed var(--cAccent, #00e38c)",
                      borderRadius: 8,
                      padding: 12,
                    }}
                  >
                    <div className={styles["deudas-title-row"]}>
                      <p className={styles["deudas-title"]}>
                        🆕{" "}
                        {formState.newExpenses!.length === 1
                          ? "Expensa nueva (se creará al confirmar el pago)"
                          : `Expensas nuevas (${formState.newExpenses!.length}, se crearán al confirmar el pago)`}
                      </p>
                    </div>
                    <div
                      className={styles["deudas-table"]}
                      style={{ borderColor: "var(--cAccent, #00e38c)" }}
                    >
                      {formState.newExpenses!.map((ne) => (
                        <div key={ne.virtualId} className={styles["deuda-row"]}>
                          <div className={styles["deuda-cell"]}>Expensa</div>
                          <div
                            className={styles["deuda-cell"]}
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 2,
                            }}
                          >
                            <span style={{ fontWeight: "var(--bMedium)" }}>
                              {`Expensa ${MONTH_NAMES[ne.month - 1]} ${ne.year}`}
                            </span>
                            {ne.description && (
                              <span
                                style={{
                                  fontSize: "0.78rem",
                                  color: "var(--cWhiteV1)",
                                }}
                              >
                                {ne.description}
                              </span>
                            )}
                          </div>
                          <div
                            className={`${styles["deuda-cell"]} ${styles["amount-cell"]}`}
                            style={{ gridColumn: "span 2" }}
                          >
                            {"Bs " + formatNumber(Number(ne.amount))}
                          </div>
                          <div
                            className={`${styles["deuda-cell"]} ${styles["deuda-check"]}`}
                          >
                            <IconCheckSquare
                              className={`${styles["check-icon"]} ${styles.selected}`}
                            />
                          </div>
                          <div
                            className={styles["deuda-cell"]}
                            style={{ gap: 8, justifyContent: "flex-end" }}
                          >
                            <button
                              type="button"
                              data-testid="edit-new-expense"
                              onClick={() => {
                                setEditingExpense(ne);
                                setShowCreateExpense(true);
                              }}
                              style={{
                                background: "none",
                                border: "1px solid var(--cWhiteV2)",
                                color: "var(--cWhite)",
                                padding: "4px 10px",
                                borderRadius: 4,
                                cursor: "pointer",
                                fontSize: "0.8rem",
                              }}
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              data-testid="remove-new-expense"
                              onClick={() => removeNewExpense(ne.virtualId)}
                              style={{
                                background: "none",
                                border: "1px solid var(--cError, #f44)",
                                color: "var(--cError, #f44)",
                                padding: "4px 10px",
                                borderRadius: 4,
                                cursor: "pointer",
                                fontSize: "0.8rem",
                              }}
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              <div
                className={styles["input-container"]}
                style={{ marginTop: isDebtBasedPayment ? 8 : 0 }}
              >
                <Input
                  type="currency"
                  name="amount"
                  label="Monto del ingreso"
                  onChange={handleChangeInput}
                  onBlur={
                    formState.isAmountLocked ? undefined : handleAmountBlur
                  }
                  value={formState.amount}
                  required={true}
                  error={errors}
                  disabled={formState.isAmountLocked}
                  maxLength={20}
                />
                {isSimulating && (
                  <span style={{ fontSize: "12px", color: "var(--cWhiteV3)" }}>
                    Calculando...
                  </span>
                )}
                {simulateError && (
                  <span
                    style={{ fontSize: "12px", color: "var(--cError, #f44)" }}
                  >
                    {simulateError}
                  </span>
                )}
              </div>

              <div className={styles["supporting-fields"]}>
                <div className={styles["upload-section"]}>
                  {open && (
                    <UploadFileV3
                      cant={8}
                      name="url_file"
                      setFormState={setFormState}
                      formState={formState}
                      mode="all"
                      maxMB={20}
                      error={errors}
                      title="Cargar comprobantes"
                      subtitle="Adjunta imágenes, PDF o archivos de oficina"
                    />
                  )}
                </div>

                <div className={styles["voucher-section"]}>
                  <div className={styles["voucher-input"]}>
                    <Input
                      type="text"
                      label="Número de respaldo de pago"
                      name="voucher"
                      onChange={(e) => {
                        const value = e.target.value
                          .replace(/[^a-zA-Z0-9]/g, "")
                          .substring(0, 50);
                        const newEvent = {
                          ...e,
                          target: { ...e.target, name: "voucher", value },
                        };
                        handleChangeInput(newEvent);
                      }}
                      value={formState.voucher || ""}
                      error={errors}
                      maxLength={50}
                    />
                  </div>
                </div>

                <div className={styles["obs-section"]}>
                  <div className={styles["obs-input"]}>
                    <TextArea
                      label="Observaciones"
                      name="obs"
                      onChange={(e) => {
                        const value = e.target.value.substring(0, 250);
                        const newEvent = {
                          ...e,
                          target: { ...e.target, name: "obs", value },
                        };
                        handleChangeInput(newEvent);
                      }}
                      value={formState.obs}
                      required={false}
                      maxLength={250}
                      error={errors}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {simulateResult?.payment_is_partial === true && (
            <div className={styles.section} style={{ marginTop: 16 }}>
              <div
                style={{
                  padding: "12px",
                  border: "1px solid var(--cWarning, #f90)",
                  borderRadius: 8,
                }}
              >
                <p style={{ fontWeight: "bold", marginBottom: 8 }}>
                  Pago parcial detectado
                </p>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: 13,
                  }}
                >
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: "4px 8px" }}>
                        Deuda
                      </th>
                      <th style={{ textAlign: "right", padding: "4px 8px" }}>
                        Monto aplicado
                      </th>
                      <th style={{ textAlign: "right", padding: "4px 8px" }}>
                        Balance antes
                      </th>
                      <th style={{ textAlign: "right", padding: "4px 8px" }}>
                        Balance después
                      </th>
                      <th style={{ textAlign: "center", padding: "4px 8px" }}>
                        Excluida
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(simulateResult.items || []).map(
                      (item: any, idx: number) => {
                        // S87: el back pineá ids negativos (-1, -2, ...) para
                        // las virtuales. Mostramos el label legible (Mes Año +
                        // descripción) cuando es virtual.
                        const isVirtual = Number(item.debt_dpto_id) < 0;
                        const virtual = isVirtual
                          ? (formState.newExpenses || [])[
                              Math.abs(Number(item.debt_dpto_id)) - 1
                            ]
                          : null;
                        const label = virtual
                          ? `${MONTH_NAMES[virtual.month - 1]} ${virtual.year}` +
                            (virtual.description
                              ? ` — ${virtual.description}`
                              : "")
                          : `#${item.debt_dpto_id}`;
                        return (
                          <tr key={idx}>
                            <td style={{ padding: "4px 8px" }}>
                              {virtual ? `🆕 ${label}` : label}
                            </td>
                            <td
                              style={{ textAlign: "right", padding: "4px 8px" }}
                            >
                              {item.applied_amount}
                            </td>
                            <td
                              style={{ textAlign: "right", padding: "4px 8px" }}
                            >
                              {item.balance_before}
                            </td>
                            <td
                              style={{ textAlign: "right", padding: "4px 8px" }}
                            >
                              {item.balance_after}
                            </td>
                            <td
                              style={{
                                textAlign: "center",
                                padding: "4px 8px",
                              }}
                            >
                              {item.excluded ? (
                                <span
                                  style={{
                                    color: "var(--cError, #f44)",
                                    fontWeight: "bold",
                                  }}
                                >
                                  Sí (no se paga)
                                </span>
                              ) : (
                                "No"
                              )}
                            </td>
                          </tr>
                        );
                      },
                    )}
                  </tbody>
                </table>
                <p style={{ marginTop: 8, fontSize: 13 }}>
                  Al confirmar, se aplicará el pago parcial según la
                  distribución mostrada. Las filas con <b>🆕</b> son expensas
                  virtuales nuevas; las marcadas como <b>Sí (no se paga)</b>{" "}
                  quedan pendientes.
                </p>
              </div>
            </div>
          )}
        </div>
      </DataModal>

      <CreateExpenseModal
        open={showCreateExpense}
        onClose={() => {
          setShowCreateExpense(false);
          setEditingExpense(null);
        }}
        suggestedAmount={suggestedAmount}
        editing={editingExpense}
        existingDebts={deudas}
        existingVirtuals={formState.newExpenses || []}
        onConfirm={(data) =>
          editingExpense
            ? updateNewExpense(editingExpense.virtualId, data)
            : addNewExpense(data)
        }
      />
    </>
  );
};

export default RenderForm;
