import React from "react";
import styles from "../RenderForm.module.css";
import Input from "@/mk/components/forms/Input/Input";
import Select from "@/mk/components/forms/Select/Select";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import Switch from "@/mk/components/forms/Switch/Switch";
import UploadFileMultiple from "@/mk/components/forms/UploadFile/UploadFileMultiple";
interface PropsType {
  handleChange: any;
  errors: any;
  setErrors: any;
  formState: any;
}

const FirstPart = ({
  handleChange,
  errors,
  setErrors,
  formState,
}: PropsType) => {
  return (
    <>
      <p className={styles.title}>Fotografía del área social</p>
      <UploadFileMultiple
        name="avatar"
        value={formState?.avatar}
        onChange={handleChange}
        label={"Subir una imagen"}
        error={errors}
        ext={["jpg", "png", "jpeg", "webp"]}
        setError={setErrors}
        img={true}
        maxFiles={10}
        prefix={"AREA"}
        images={formState?.images}
        item={formState}
        // editor={}
        // sizePreview={_field.sizePreview}
        // autoOpen={data?.action == "add"}
      />
      <p className={styles.title}>Datos generales</p>
      <div style={{ display: "flex", gap: 12 }}>
        <Input
          label="Nombre del área social"
          name="title"
          value={formState?.title}
          onChange={handleChange}
          error={errors}
        />
        <Input
          type="number"
          label="Capacidad máxima de personas"
          name="max_capacity"
          value={formState?.max_capacity}
          onChange={handleChange}
          error={errors}
        />
      </div>
      <Select
        label="Estado del área "
        name="status"
        value={formState?.status}
        onChange={handleChange}
        options={[
          { id: "A", name: "Activa" },
          { id: "X", name: "Inactiva" },
          { id: "M", name: "En mantenimiento" },
        ]}
        error={errors}
      />
      <TextArea
        label="Descripción"
        name="description"
        value={formState?.description}
        onChange={handleChange}
        error={errors}
      />
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div>
          <p className={styles.title}>¿Aprobación de administración?</p>
          <p className={styles.subtitle}>
            Activa esta opción si deseas que cada reserva de esta área deba ser
            revisada y aprobada por administración antes de aprobarse
          </p>
        </div>
        <Switch
          name="requires_approval"
          optionValue={["A", "X"]}
          onChange={(e: any) => {
            handleChange({
              target: {
                name: "requires_approval",
                value: e.target.checked ? "A" : "X",
              },
            });
          }}
          value={formState?.requires_approval}
        />
      </div>
    </>
  );
};

export default FirstPart;
