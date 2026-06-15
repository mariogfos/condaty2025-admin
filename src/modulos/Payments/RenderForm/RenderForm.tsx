/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import React, { useMemo } from "react";
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
import { FORM_PAYMENT_METHODS, TYPE_OPTIONS, FormPaymentType } from "../Type/PaymentType";
import { usePaymentsForm, RenderFormProps } from "../hooks/usePaymentsForm";

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
  } = usePaymentsForm(props, open);

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
            <p>Total a pagar: {formatBs(periodoTotal)}</p>
          </div>
        </div>
      );
    }
  }, [
    formState.dpto_id,
    formState.type,
    isLoadingDeudas,
    deudas,
    selectedPeriodo,
    periodoTotal,
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
        title={"Crear ingreso"}
        minWidth={680}
        maxWidth={860}
      >
        <div className={styles["income-form-container"]}>
          <div className={styles.section}>
            <div className={styles["input-container"]}>
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
          </div>

          <div className={styles.section}>
            <div className={styles["input-container"]}>
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

          <div className={styles.section}>
            <div className={styles["input-container"]}>
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
              <div className={styles["payment-section"]}>
                <div className={styles["input-row"]}>
                  <div className={styles["input-half"]}>
                    <Input
                      type="currency"
                      name="amount"
                      label="Monto del ingreso"
                      onChange={handleChangeInput}
                      value={
                        isDebtBasedPayment && deudas?.length > 0
                          ? periodoTotal.toFixed(2)
                          : formState.amount
                      }
                      required={false}
                      error={errors}
                      disabled={isDebtBasedPayment || formState.isAmountLocked}
                      maxLength={20}
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
        </div>
      </DataModal>
    </>
  );
};

export default RenderForm;
