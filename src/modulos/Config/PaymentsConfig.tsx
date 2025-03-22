import Input from "@/mk/components/forms/Input/Input";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import { UploadFile } from "@/mk/components/forms/UploadFile/UploadFile";
import { getUrlImages } from "@/mk/utils/string";
import React from "react";
import styles from "./Config.module.css";

const PaymentsConfig = ({ formState, onChange, setErrors, errors }: any) => {
  return (
    <div className="">
      <section className={styles.marginY}>
        <div className={styles.textTitle}>
          Medios de pagos que podrán usar los residentes
        </div>
        <div className={styles.textSubtitle}>
          Configura los medios de pago que tendrán tus residentes para realizar
          sus pagos de deudas
        </div>
      </section>
      <div className={styles.borderBox}>
        <section className={styles.marginY}>
          <div className={styles.textTitle}>Datos del Qr</div>
          <div className="px-10 my-6">
            {" "}
            <div className={styles.textSubtitle}>
              Te recomendamos subir un código QR en la plataforma sin monto
              específico. Esto facilitará la gestión de pagos y garantizará un
              proceso más eficiente.
            </div>
          </div>
        </section>
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
          // editor={{ width: 720, height: 220 }}
          sizePreview={{ width: "200px", height: "200px" }}
          placeholder="Subir imagen del Qr"
          ext={["jpg", "png", "jpeg", "webp"]}
          item={formState}
        />
        {/* <UploadFile
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
          // editor={{ width: 720, height: 220 }}
          sizePreview={{ width: "375px", height: "114px" }}
          placeholder="Subir imagen del Qr"
          ext={["jpg", "png", "jpeg", "webp"]}
          item={formState}
        /> */}
        <div className="px-10">
          <TextArea
            label="Observaciones"
            name="payment_qr_obs"
            onChange={onChange}
            value={formState?.payment_qr_obs}
          />
        </div>
      </div>
      <div className={styles.borderBox}>
        <div
          className={styles.textTitle}
          style={{ marginBottom: "var(--spS)" }}
        >
          Datos de Transferencia Bancaria
        </div>
        <div className="mt-5 px-10">
          <Input
            type="text"
            label="Entidad Bancaria"
            name="payment_transfer_bank"
            error={errors}
            required
            value={formState?.payment_transfer_bank}
            onChange={onChange}
          />
          <Input
            type="text"
            label="Número de cuenta"
            name="payment_transfer_account"
            error={errors}
            required
            value={formState?.payment_transfer_account}
            onChange={onChange}
          />
          <Input
            type="text"
            label="Nombre de destinatario"
            name="payment_transfer_name"
            error={errors}
            value={formState?.payment_transfer_name}
            onChange={onChange}
            required
          />
          <Input
            type="number"
            label="Carnet de identidad/NIT"
            name="payment_transfer_ci"
            error={errors}
            required={true}
            value={formState?.payment_transfer_ci}
            onChange={onChange}
          />
          <TextArea
            label="Observaciones"
            name="payment_transfer_obs"
            onChange={onChange}
            value={formState?.payment_transfer_obs}
          />
        </div>
      </div>
      <div className={styles.borderBox} style={{ marginBottom: "var(--spL)" }}>
        <div
          className={styles.textTitle}
          style={{ marginBottom: "var(--spS)" }}
        >
          Datos de Pago en oficina
        </div>
        <div className="mt-5 px-10">
          <TextArea
            label="Detalles y requisitos"
            required
            name="payment_office_obs"
            onChange={onChange}
            value={formState?.payment_office_obs}
            error={errors}
          />
          {/* {errors.payment_office_obs != "" && (
        <p className={`px-2 my-4 text-xs mt-1 text-red-600`}>
          {errors.payment_office_obs}
        </p>
      )} */}
        </div>
      </div>
    </div>
  );
};

export default PaymentsConfig;
