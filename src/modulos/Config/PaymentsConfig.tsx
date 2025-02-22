import Input from '@/mk/components/forms/Input/Input';
import TextArea from '@/mk/components/forms/TextArea/TextArea';
import { UploadFile } from '@/mk/components/forms/UploadFile/UploadFile';
import { getUrlImages } from '@/mk/utils/string';
import React from 'react'

const PaymentsConfig = ({formState,onChange,setErrors,errors}:any) => {
  return (
    <div className="">
    <p className="text-2xl text-tWhite">
      Medios de pagos que podrán usar los residentes
    </p>
    <p className="text-sm text-lightv3 mb-9">
      Configura los medios de pago que tendrán tus residentes para
      realizar sus pagos de deudas
    </p>
    <div className="border border-[#868686] rounded-lg relative mt-5 laptopL:mx-40 py-7">
      <p className="text-center absolute text-tWhite bg-[#292929] -top-4 left-4 font-black text-lg">
        Datos del Qr
      </p>
      <div className="px-10 my-6">
        {" "}
        <p className="text-lightv3 text-xs">
          Te recomendamos subir un código QR en la plataforma sin monto
          específico. Esto facilitará la gestión de pagos y garantizará
          un proceso más eficiente.
        </p>
      </div>
      {/* <div className="flex justify-center mb-4">
        <div>
          <div className="w-[160px] h-[160px] bg-slate-950 rounded-lg my-4 relative ">
            {(!errorImage || previewQr) && (
              <img
                alt="Imagen"
                className="object-contain  w-[160px] h-[160px] rounded-lg"
                src={
                  previewQr ||
                  getUrlImages(
                    "/PAYMENTQR-" +
                      user?.client_id +
                      ".png?d=" +
                      new Date().toISOString()
                  )
                }
                onError={() => {
                  setErrorImage(true);
                }}
              />
            )}
          </div>
          {errors.avatar != "" && (
            <p className={`px-2 my-4 text-xs mt-1 text-red-600`}>
              {errors.avatar}
            </p>
          )}
          <label htmlFor="imagePerfil">
             <IconCamera className="absolute -top-3 -right-3 w-6 h-6 text-primary rounded-full bg-black p-1 border border-primary/50" /> 
            <p className="text-center bg-accent rounded-md text-xs py-1 font-semibold">
              Subir Qr
            </p>
            <input
              type="file"
              id="imagePerfil"
              className="hidden"
              onChange={onChangeFile}
            />
          </label>
        </div>
      </div> */}
        <UploadFile
                        name="avatar"
                        onChange={onChange}
                        value={
                        formState?.id
                            ? getUrlImages(
                                "/PAYMENTQR-" +
                                formState?.id +
                                ".png?" +
                                formState.updated_at
                            )
                            : ""
                        }
                        setError={setErrors}
                        error={errors}
                        img={true}
                        // editor={{ width: 720, height: 220 }}
                        sizePreview={{ width: "375px", height: "114px" }}
                        placeholder="Subir imagen del condominio"
                        ext={["jpg", "png", "jpeg", "webp"]}
                        item={formState}
                    />
      <div className="px-10">
        <TextArea
          label="Observaciones"
          name="payment_qr_obs"
          onChange={onChange}
          value={formState?.payment_qr_obs}
        />
      </div>
    </div>
    <div className="border border-[#868686] rounded-lg relative mt-5 laptopL:mx-40 py-7">
      <p className="text-center absolute text-tWhite bg-[#292929] -top-4 left-4 font-black text-lg">
        Datos de Transferencia Bancaria
      </p>
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
    <div className="border border-[#868686] rounded-lg relative my-5 laptopL:mx-40 py-7">
      <p className="text-center absolute text-tWhite bg-[#292929] -top-4 left-4 font-black text-lg">
        Datos de Pago en oficina
      </p>
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
  )
}

export default PaymentsConfig