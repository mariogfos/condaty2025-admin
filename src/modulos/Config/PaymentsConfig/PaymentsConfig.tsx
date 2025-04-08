import Input from "@/mk/components/forms/Input/Input";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import { UploadFile } from "@/mk/components/forms/UploadFile/UploadFile";
import { getUrlImages } from "@/mk/utils/string";
import React from "react";
import styles from "./PaymentsConfig.module.css";
import { IconCamera } from "@/components/layout/icons/IconsBiblioteca";
import Button from "@/mk/components/forms/Button/Button";

const PaymentsConfig = ({ formState, onChange, setErrors, errors, onSave }: any) => {
  return (
    <div className={styles.paymentsContainer}>
      <div>
        <h1 className={styles.headerTitle}>Métodos de pagos</h1>
        <p className={styles.headerSubtitle}>
          Configura los métodos de pagos con los cuales los residentes podrán pagar sus cuotas, deudas y demás
          transacciones del condominio
        </p>
      </div>
      
      <div className={styles.formContainer}>
        <div className={styles.sectionContainer}>
          <div>
            <h2 className={styles.sectionTitle}>Subir código QR</h2>
            <p className={styles.sectionSubtitle}>
              Te recomendamos subir un código QR sin monto, esto facilitará la gestión de pagos y garantizará un proceso más
              eficiente
            </p>
          </div>
          
          <div className={styles.uploadContainer}>
            <div className={styles.qrPreviewContainer}>
              <UploadFile
                name="avatarQr"
                onChange={onChange}
                value={
                  formState?.id
                    ? getUrlImages(
                        "/PAYMENTQR-" +
                          formState?.id +
                          ".webp?" +
                          formState.updated_at
                      )
                    : ""
                }
                setError={setErrors}
                error={errors}
                img={true}
                sizePreview={{ width: "200px", height: "170px" }}
                placeholder="Cargar una imagen"
                ext={["jpg", "png", "jpeg", "webp"]}
                item={formState}
                
              />
            </div>
          </div>
        </div>

        <div className={styles.sectionContainer}>
          <div>
            <h2 className={styles.sectionTitle}>Datos de transferencia bancaria</h2>
            <p className={styles.sectionSubtitle}>
              Te recomendamos subir un código QR sin monto, esto facilitará la gestión de pagos y garantizará un proceso más
              eficiente
            </p>
          </div>
          
          <div className={styles.inputContainer}>
            <div className={styles.inputHalf}>
              <Input
                type="text"
                label="Entidad bancaria*"
                name="payment_transfer_bank"
                error={errors}
                required
                value={formState?.payment_transfer_bank}
                onChange={onChange}
              />
            </div>
            <div className={styles.inputHalf}>
              <Input
                type="text"
                label="Número de cuenta*"
                name="payment_transfer_account"
                error={errors}
                required
                value={formState?.payment_transfer_account}
                onChange={onChange}
              />
            </div>
          </div>
          
          <div className={styles.inputContainer}>
            <div className={styles.inputHalf}>
              <Input
                type="text"
                label="Nombre de destinatario*"
                name="payment_transfer_name"
                error={errors}
                value={formState?.payment_transfer_name}
                onChange={onChange}
                required
              />
            </div>
            <div className={styles.inputHalf}>
              <Input
                type="number"
                label="Carnet de identidad/NIT*"
                name="payment_transfer_ci"
                error={errors}
                required={true}
                value={formState?.payment_transfer_ci}
                onChange={onChange}
              />
            </div>
          </div>
        </div>

        <div className={styles.sectionContainer}>
          <div>
            <h2 className={styles.sectionTitle}>Datos de pago en oficina</h2>
          </div>
          
          <div className={styles.textareaContainer}>
            <TextArea
              label="Detalles o requisitos*"
              required
              name="payment_office_obs"
              onChange={onChange}
              value={formState?.payment_office_obs}
              error={errors}
            />
          </div>
        </div>

        <div className={styles.saveButtonContainer}>
          <Button className={styles.saveButton} onClick={onSave}>
            Guardar datos
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentsConfig;