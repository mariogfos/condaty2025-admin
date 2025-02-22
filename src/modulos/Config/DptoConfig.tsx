import { IconCamera } from "@/components/layout/icons/IconsBiblioteca";
import Input from "@/mk/components/forms/Input/Input";
import Select from "@/mk/components/forms/Select/Select";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import { UploadFile } from "@/mk/components/forms/UploadFile/UploadFile";
import { getUrlImages } from "@/mk/utils/string";
import React from "react";
import styles from "./Config.module.css"

const DptoConfig = ({
  formState,
  setFormState,
  setErrors,
  errors,
  client_config,
}: any) => {
  // console.log(formState,'fst desde dptoconfg')
  const onChange = (e: any) => {
    let value = e?.target?.value;
    if (e.target.type == "checkbox") {
      value = e.target.checked ? "Y" : "N";
    }
    setFormState({ ...formState, [e.target.name]: value });
  };
  return (
    <>
      <div className="w-full flex justify-center my-6">
        <UploadFile
          name="avatar"
          onChange={onChange}
          value={
            formState?.id
              ? getUrlImages(
                  "/CLIENT-" + formState?.id + ".png?" + formState.updated_at
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
      
      </div>
      <Input
        label={"Nombre del condominio"}
        value={formState["name"]}
        type="text"
        name="name"
        error={errors}
        required
        onChange={onChange}
      />
      <Select
        label="Tipo de condominio"
        value={formState?.type}
        name="type"
        error={errors}
        onChange={onChange}
        options={[
          { id: "C", name: "Condominio" },
          { id: "E", name: "Edificio" },
          { id: "U", name: "Urbanización" },
        ]}
        required
        className="appearance-none"
      ></Select>
      <Select
        label="Tipo de unidad"
        value={formState?.type_dpto}
        name="type_dpto"
        error={errors}
        onChange={onChange}
        options={[
          { id: "D", name: "Departamento" },
          { id: "O", name: "Oficina" },
          { id: "C", name: "Casa" },
          { id: "L", name: "Lote" },
        ]}
        required
        className="appearance-none"
      ></Select>
      <Input
        label={"Dirección"}
        value={formState["address"]}
        type="text"
        name="address"
        error={errors}
        required
        onChange={onChange}
      />
      <Input
        label={"Correo electrónico"}
        value={formState["email"]}
        type="email"
        name="email"
        error={errors}
        required
        onChange={onChange}
      />
      <Input
        label={"Teléfono"}
        value={formState["phone"]}
        type="number"
        name="phone"
        error={errors}
        required
        onChange={onChange}
      />
      <TextArea
        label="Descripción"
        name="description"
        required={false}
        onChange={onChange}
        value={formState?.description}
      />
      <div className={styles.marginY}>
        <p className={styles.textTitle}>Fecha de inicio de cobro de expensas</p>
        <p className={styles.textSubtitle}>
          ¿Cuándo quieres que empiece el sistema a cobrar las expensas?
        </p>
        <p className={styles.textSubtitle}>
          Esta configuración es importante para que el sistema pueda calcular
          correctamente las cuotas adeudadas por los residentes.
        </p>
      </div>
      <Select
        label="Mes"
        value={formState?.month}
        name="month"
        error={errors}
        onChange={onChange}
        options={[
          { id: "1", name: "Enero" },
          { id: "2", name: "Febrero" },
          { id: "3", name: "Marzo" },
          { id: "4", name: "Abril" },
          { id: "5", name: "Mayo" },
          { id: "6", name: "Junio" },
          { id: "7", name: "Julio" },
          { id: "8", name: "Agosto" },
          { id: "9", name: "Septiembre" },
          { id: "10", name: "Octubre" },
          { id: "11", name: "Noviembre" },
          { id: "12", name: "Diciembre" },
        ]}
        required
        className="appearance-none"
      ></Select>

      <Input
        type="number"
        label="Año"
        name="year"
        error={errors}
        required
        value={formState?.year}
        onChange={onChange}
      />
      <div className="my-5">
        <p className="text-tWhite">
          Ingresa el monto con el que inicia el condominio
        </p>
        <p className={styles.textSubtitle}>
          Esta configuración es importante para que el sistema pueda tomar en
          cuenta con qué monto ingresa el condominio.
        </p>
      </div>
      <Input
        type="number"
        label="Saldo"
        name="initial_amount"
        error={errors}
        required
        value={formState?.initial_amount}
        onChange={onChange}
        disabled={client_config?.data[0].initial_amount === null ? false : true}
      />
    </>
  );
};

export default DptoConfig;
