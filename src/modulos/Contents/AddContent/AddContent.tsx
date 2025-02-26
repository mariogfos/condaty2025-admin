"use client";
import React, { useEffect, useState } from "react";
import styles from "./AddContent.module.css";
import { useAuth } from "@/mk/contexts/AuthProvider";
import {
  IconArrowLeft,
  IconDocs,
  IconGallery,
  IconVideo,
  IconYoutube,
} from "@/components/layout/icons/IconsBiblioteca";
import Select from "@/mk/components/forms/Select/Select";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import Radio from "@/mk/components/forms/Ratio/Radio";
import Input from "@/mk/components/forms/Input/Input";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import CardContent from "./CardContent";
import Button from "@/mk/components/forms/Button/Button";
import Preview from "./Preview";
import ModalDestiny from "./ModalDestiny";
import UploadFileMultiple from "@/mk/components/forms/UploadFile/UploadFileMultiple";
import { checkRules, hasErrors } from "@/mk/utils/validate/Rules";
import TagContents from "./TagContents";
import { UploadFile } from "@/mk/components/forms/UploadFile/UploadFile";

const AddContent = ({
  onClose,
  open,
  item,
  setItem,
  // errors,
  extraData,
  user,
  execute,
  openList,
  setOpenList,
  // setErrors,
  reLoad,
  action,
}: any) => {
  const { showToast } = useAuth();
  const [errors, setErrors] = useState({});
  const [ldestinys, setLdestinys]: any = useState([]);
  const [openDestiny, setOpenDestiny] = useState(false);
  const [formState, setFormState]: any = useState({
    ...item,
    isType: "N",
    type: "I",
  });

  useEffect(() => {
    setOpenList(false);
    if (!formState?.title && action == "edit") {
      setFormState({ ...formState, isType: "P" });
    } else {
      setFormState({ ...formState, isType: "N" });
    }

    // if (!formState.isType && !formState.type) {
    //   setFormState({ ...formState, isType: "N", type: "I" });
    // }
  }, []);

  useEffect(() => {
    let lDestinies: any = formState.lDestiny || [];
    if (action == "edit" && !formState.lDestiny) {
      formState?.cdestinies?.map((d: any) => {
        if (formState?.destiny == 2) {
          lDestinies.push(d.lista_id);
        }
        if (formState?.destiny == 3) {
          lDestinies.push(d.dpto_id);
        }
        if (formState?.destiny == 4) {
          lDestinies.push(d.mun_id);
        }
        if (formState?.destiny == 5) {
          lDestinies.push(d.barrio_id);
        }
      });
    }
    setLdestinys(lDestinies);
  }, [action, formState.lDestiny]);

  useEffect(() => {
    if (formState?.isType == "P") {
      setFormState({ ...formState, title: null });
    }
    // if (formState?.isType == "N") {
    //   setFormState({ ...formState, type: "I" });
    // }
  }, [formState?.isType]);

  useEffect(() => {
    if (formState?.type != "I") {
      setFormState({ ...formState, avatar: null });
    } else if (formState?.type != "V") {
      setFormState({ ...formState, url: null });
    } else if (formState?.type != "D") {
      setFormState({ ...formState, file: null });
    }
  }, [formState?.type]);
  // console.log(formState);

  useEffect(() => {
    if (formState?.destiny == 0 && action == "add") {
      getMeta([]);
    }
  }, [formState.destiny]);

  const handleChangeInput = (e: any) => {

    let value = e.target.value;
    if (e.target?.type == "checkbox") {
      value = e.target.checked ? "Y" : "N";
    }
   
    setFormState({ ...formState, [e.target.name]: value });
    // if (e.target.name == "destiny" && value > 0) {
    //   setOpenDestiny(true);
    //   if (formState.destiny != value) {
    //     setFormState({
    //       ...formState,
    //       lDestiny: [],
    //       [e.target.name]: value,
    //     });
    //   }
    // }
  };
  // const getCandidates = () => {
  //   let data: any = [];
  //   extraData?.candidates.map((c: any) => {
  //     if (c.status == "A") {
  //       data.push({
  //         img: getUrlImages("/CAND-" + c?.id + ".webp?d=" + c?.updated_at),
  //         id: c?.id,
  //         name:
  //           getFullName(c) +
  //           " - " +
  //           extraData?.typeCands.find((t: any) => t.id == c.typecand_id)?.name,
  //       });
  //     }
  //   });
  //   return data;
  // };
  const lDestinies = () => {
    const level = user?.role.level;
    const r = [];
    if (level == 1 || level == 0) {
      r.push({ id: 0, name: "Todos" });
    }
    if (level == 2) r.push({ id: 0, name: "Mi organización" });
    if (level == 3) r.push({ id: 0, name: "Mi departamento" });
    if (level == 4) r.push({ id: 0, name: "Mi municipio" });
    // if (level == 4) r.push({ id: 0, name: "Mi localidad" });
    if (level == 5) r.push({ id: 0, name: "Mi barrio" });

    if (level <= 1) r.push({ id: 2, name: "Organización" });
    if (level <= 2) r.push({ id: 3, name: "Departamento" });
    if (level <= 3) r.push({ id: 4, name: "Municipo" });
    // if (level <= 4) r.push({ id: 5, name: "Localidad" });
    // if (level <= 5) r.push({ id: 5, name: "Barrio" });
    return r;
  };
  const selDestinies = (value: any) => {
    let selDestinies = [];
    if (value == 2) selDestinies = extraData?.listas;
    if (value == 3) selDestinies = extraData?.dptos;
    if (value == 4) selDestinies = extraData?.muns;
    // if (value == 5) selDestinies = extraData.barrios;

    return selDestinies;
  };

  const getDestinysNames = () => {
    let des: any = [];
    if (formState?.destiny == 0) {
      return (des = ["Todos"]);
    }
    if (formState?.destiny > 0) {
      selDestinies(formState?.destiny)
        .filter((d: any) => ldestinys?.includes(d.id))
        .map((d: any) => des.push(d.name));
      return des;
    }
    return des;
  };

  const validate = (field: any = "") => {
    let errors: any = {};

    errors = checkRules({
      value: formState?.destiny,
      rules: ["required"],
      key: "destiny",
      errors,
    });
    errors = checkRules({
      value: formState?.candidate_id,
      rules: ["required"],
      key: "candidate_id",
      errors,
    });
    if (formState?.isType == "N") {
      errors = checkRules({
        value: formState?.title,
        rules: ["required"],
        key: "title",
        errors,
      });
      // if (action == "add" && formState?.isType == "N") {
      //   errors = checkRules({
      //     value: formState?.avatar,
      //     rules: ["required"],
      //     key: "avatar",
      //     errors,
      //   });
      // }
      errors = checkRules({
        value: formState?.description,
        rules: ["required"],
        key: "description",
        errors,
      });
    }

    if (formState?.type == "V") {
      errors = checkRules({
        value: formState?.url,
        rules: ["required"],
        key: "url",
        errors,
      });
    }
    if (formState?.type == "D") {
      errors = checkRules({
        value: formState?.file,
        rules: ["required"],
        key: "file",
        errors,
      });
    }

    setErrors(errors);
    return errors;
  };
  const onSave = async () => {
    if (hasErrors(validate())) return;
    setItem({ ...formState });
    if (
      (formState.isType == "N" && !formState.avatar && action == "add") ||
      Object?.keys(formState?.avatar || {}).length <= 0
    ) {
      showToast("Debe cargar una imagen", "error");
      return;
    }

    let method = formState.id ? "PUT" : "POST";

    const { data } = await execute(
      "/contents" + (formState.id ? "/" + formState.id : ""),
      method,
      {
        candidate_id: formState?.candidate_id,
        lDestiny: ldestinys,
        destiny: formState?.destiny,
        // affCount: formState.affCount,
        url: formState?.url,
        title: formState?.title,
        description: formState?.description,
        avatar: formState?.avatar,
        file: formState?.file,
        type: formState?.type,
      }
    );

    if (data?.success == true) {
      onClose();
      reLoad();
      showToast(data.message, "success");
    } else {
      showToast(data.message, "error");
    }
  };

  const getMeta = async (sel: any) => {
    const { data } = await execute(
      "/contents",
      "GET",
      {
        destiny: formState.destiny,
        fullType: "DES",
        lDestiny: sel,
      },
      false,
      true
    );

    setFormState({
      ...formState,
      lDestiny: sel,
      affCount: data?.data?.affCount,
    });
  };

  return (
    open && (
      <div className={styles.AddContent}>
        <div className={styles.containerForm}>
          <div>
            <p onClick={() => onClose()}>Volver</p>
            <IconArrowLeft />
            <p>Crear nueva publicacion</p>
          </div>
          <CardContent
            title="Publicar como"
            subtitle=" El perfil que selecciones aparecerá como la cuenta creadora del post"
          >a
            {/* <Select
              name="candidate_id"
              label="Candidato"
              onChange={handleChangeInput}
              value={formState.candidate_id}
              options={getCandidates()}
              error={errors}
            /> */}
          </CardContent>

          <CardContent
            title="Destino"
            destinys={getDestinysNames().toString()}
            subtitle={
              formState?.affCount > 0
                ? `Tu publicación tendrá un alcance estimado de ${formState?.affCount} afiliados`
                : formState?.affCount == 0
                ? "No existen afiliados en el destino seleccionado"
                : "Selecciona quienes pueden ver esta publicación"
            }
            style={{ display: "flex" }}
          >
            <Select
              style={{ width: 200 }}
              name="destiny"
              label="Público objetivo"
              onChange={handleChangeInput}
              value={formState.destiny}
              options={
                [
                  { id: 'T', name: "Público en general" },
                  { id: 'D', name: "Departamentos" },
                  { id: 'G', name: "Guardias" },
                  { id: 'R', name: "Residentes" }
                ]
              }
              error={errors}
            />
          </CardContent>

          <CardContent title="Tipo de publicación">
            <div style={{ display: "flex", width: "100%" }}>
              <Radio
                checked={formState?.isType == "N"}
                label="Noticia"
                subtitle="Ideal para informar con mayor detalle sobre un acontecimiento importante."
                onChange={() => setFormState({ ...formState, isType: "N" })}
                disabled={action == "edit"}
              />
              <Radio
                checked={formState?.isType == "P"}
                label="Post"
                subtitle="Publicación más informal, ideal para publicar eventos cotidianos."
                onChange={() => setFormState({ ...formState, isType: "P" })}
                disabled={action == "edit"}
              />
            </div>
          </CardContent>
          {formState?.isType == "N" && (
            <CardContent
              title="Título de la publicación"
              subtitle="Coloca un titular que impacte"
            >
              <Input
                name="title"
                label="Titulo"
                value={formState?.title}
                onChange={handleChangeInput}
                error={errors}
              />
            </CardContent>
          )}

          <CardContent
            title="Detalle de la publicación"
            subtitle="¿Qué quieres publicar hoy?"
          >
            <TextArea
              name="description"
              label="Descripción"
              value={formState?.description}
              onChange={handleChangeInput}
              error={errors}
            />
          </CardContent>
          <CardContent
            title="Tipo de contenido"
            subtitle="Selecciona el tipo de contenido que quieras publicar"
          >
            <div
              style={{
                display: "flex",
                gap: "var(--spS)",
                marginBottom: "var(--spL)",
              }}
            >
              <TagContents
                icon={<IconGallery size={16} />}
                isActive={formState.type == "I"}
                text="Contenido multimedia"
                onClick={() => setFormState({ ...formState, type: "I" })}
                disabled={action == "edit"}
              />
              {formState.isType == "P" && (
                <>
                  {/* {action != "edit" && ( */}
                  <TagContents
                    isActive={formState.type == "V"}
                    icon={<IconVideo size={16} />}
                    text={"Video"}
                    onClick={() => setFormState({ ...formState, type: "V" })}
                    disabled={action == "edit"}
                  />
                  {/* )} */}
                  {/* {action != "edit" && ( */}
                  <TagContents
                    isActive={formState.type == "D"}
                    icon={<IconDocs size={16} />}
                    text="Documento"
                    onClick={() => setFormState({ ...formState, type: "D" })}
                    disabled={action == "edit"}
                  />
                  {/* )} */}
                </>
              )}
            </div>
            {formState?.type == "I" && (
              <UploadFileMultiple
                name="avatar"
                value={formState?.avatar}
                onChange={handleChangeInput}
                label={"Subir una imagen"}
                error={errors}
                ext={["jpg", "png", "jpeg", "webp"]}
                setError={setErrors}
                img={true}
                maxFiles={10}
                prefix={"CONT"}
                images={formState?.images}
                item={formState}
                // editor={}
                // sizePreview={_field.sizePreview}
                // autoOpen={data?.action == "add"}
              />
            )}
            {formState?.type == "V" && (
              <Input
                name="url"
                label="Link del video"
                value={formState?.url}
                onChange={handleChangeInput}
                error={errors}
              />
            )}
            {formState?.type == "D" && (
              <UploadFile
                name={"file"}
                value={formState?.file}
                onChange={handleChangeInput}
                label={"Subir documento"}
                error={errors}
                ext={["pdf"]}
                setError={setErrors}
              />
            )}
          </CardContent>
          <section>
            <Button onClick={onSave}>
              {formState?.id ? "Actualizar" : "Publicar"}
            </Button>
          </section>
        </div>
        <div className={styles.containerPreview}>
          <p>Vista previa</p>
          <div>
            <Preview
              formState={formState}
              extraData={extraData}
              action={action}
            />
          </div>
        </div>
        {openDestiny && (
          <ModalDestiny
            open={openDestiny}
            onClose={() => {
              setOpenDestiny(false);
              setFormState({
                ...formState,
                destiny: item.destiny || formState.destiny,
              });
            }}
            selDestinies={selDestinies(formState?.destiny)}
            formState={{ ...formState, lDestiny: ldestinys }}
            setFormState={setFormState}
            showToast={showToast}
            execute={execute}
            onSave={getMeta}
          />
        )}
      </div>
    )
  );
};

export default AddContent;
