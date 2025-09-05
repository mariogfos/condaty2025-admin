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
import { lComDestinies } from "@/mk/utils/utils";
import Br from "@/components/Detail/Br";

const AddContent = ({
  onClose,
  open,
  item,
  setItem,
  extraData,
  user,
  execute,
  openList,
  setOpenList,
  reLoad,
  action,
}: any) => {
  const { showToast } = useAuth();
  const [errors, setErrors] = useState({});
  const [ldestinys, setLdestinys]: any = useState([]);
  const [openDestiny, setOpenDestiny] = useState(false);

  // Inicializar formState correctamente para modo edición
  const [formState, setFormState]: any = useState(() => {
    const initialState = { ...item };

    // Si estamos en modo edición y hay imágenes, inicializar el campo avatar
    if (action === "edit" && item?.images && item?.images.length > 0) {
      const avatarData: any = {};
      item.images.forEach((img: any, index: number) => {
        avatarData[`avatar${index}`] = {
          file: "", // Archivo vacío para imágenes existentes
          id: img.id,
          ext: img.ext || "webp"
        };
      });
      initialState.avatar = avatarData;
    }

    return initialState;
  });

  useEffect(() => {
    setOpenList(false);
    if (action == "edit") {
      if (!formState?.title) {
        setFormState((prev: any) => ({ ...prev, isType: "P" }));
      } else {
        setFormState((prev: any) => ({ ...prev, isType: "N" }));
      }
    } else {
      setFormState((prev: any) => ({ ...prev, isType: "N", type: "I" }));
    }
  }, []);

  // Agregar useEffect para sincronizar imágenes cuando cambie el item
  useEffect(() => {
    if (action === "edit" && item?.images && item?.images.length > 0) {
      const avatarData: any = {};
      item.images.forEach((img: any, index: number) => {
        avatarData[`avatar${index}`] = {
          file: "",
          id: img.id,
          ext: img.ext || "webp"
        };
      });
      setFormState((prev: any) => ({ ...prev, avatar: avatarData }));
    }
  }, [item, action]);

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
      setFormState({
        ...formState,
        title: null,
        type: "I", // Resetear a contenido multimedia por defecto
        url: null,
        file: null,
        avatar: formState?.avatar // Mantener las imágenes si las hay
      });
    }
    if (formState?.isType == "N") {
      setFormState({
        ...formState,
        type: "I", // Resetear a contenido multimedia por defecto
        url: null,
        file: null,
        avatar: formState?.avatar // Mantener las imágenes si las hay
      });
    }
  }, [formState?.isType]);

  // useEffect(() => {
  //   if (formState?.type != "I") {
  //     setFormState({ ...formState, avatar: null });
  //   } else if (formState?.type != "V") {
  //     setFormState({ ...formState, url: null });
  //   } else if (formState?.type != "D") {
  //     setFormState({ ...formState, file: null });
  //   }
  // }, [formState?.type]);
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

    // Manejar correctamente los cambios en las imágenes
    if (e.target.name === "avatar") {
      setFormState((prev: any) => ({ ...prev, [e.target.name]: value }));
    } else {
      setFormState((prev: any) => ({ ...prev, [e.target.name]: value }));
    }
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

    // Eliminada la validación de destiny
    // errors = checkRules({
    //   value: formState?.destiny,
    //   rules: ["required"],
    //   key: "destiny",
    //   errors,
    // });
    // errors = checkRules({
    //   value: formState?.candidate_id,
    //   rules: ["required"],
    //   key: "candidate_id",
    //   errors,
    // });

    if (formState?.isType == "N") {
      errors = checkRules({
        value: formState?.title,
        rules: ["required"],
        key: "title",
        errors,
      });
      errors = checkRules({
        value: formState?.avatar,
        rules: ["requiredImageMultiple"],
        key: "avatar",
        errors,
        data: formState,
      });

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
/*     if (formState?.type == "D") {
      errors = checkRules({
        value: formState?.file,
        rules: ["required"],
        key: "file",
        errors,
      });
    } */

    setErrors(errors);
    return errors;
  };
  const onSave = async () => {
    if (hasErrors(validate())) return;
    setItem({ ...formState });
    if (
      formState.isType == "N" &&
      action == "add" &&
      Object?.keys(formState?.avatar || {}).length <= 0
    ) {
      showToast("Debe cargar una imagen", "error");
      return;
    }

    let method = formState.id ? "PUT" : "POST";
    // Forzar destiny a "T"
    const { data } = await execute(
      "/contents" + (formState.id ? "/" + formState.id : ""),
      method,
      {
        destiny: "T",
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
        destiny: "T",
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
        {/* Header fuera del contenedor principal */}
        <div className={styles.header}>
          <div className={styles.backButton} onClick={() => onClose()}>
            <IconArrowLeft size={20} />
            <span>Volver a lista de publicaciones</span>
          </div>
          <div className={styles.formHeader}>
            <p>Nueva publicación</p>
          </div>
        </div>

        <div className={styles.mainContainer}>
          <div className={styles.containerForm}>
            <div className={styles.formContent}>
              <CardContent title="Tipo de publicación">
                <div className={styles.radioContainer}>
                  <Radio
                    checked={formState?.isType == 'N'}
                    label="Noticia"
                    subtitle="Ideal para informar con mayor detalle sobre un acontecimiento importante."
                    onChange={() => setFormState({ ...formState, isType: 'N' })}
                    disabled={action == 'edit'}
                    containerStyle={{ backgroundColor: 'transparent' }}
                    className={styles.customRadio}
                  />
                  <Radio
                    checked={formState?.isType == 'P'}
                    label="Post"
                    subtitle="Publicación más informal, ideal para publicar eventos cotidianos."
                    onChange={() => setFormState({ ...formState, isType: 'P' })}
                    disabled={action == 'edit'}
                    containerStyle={{ backgroundColor: 'transparent' }}
                    className={styles.customRadio}
                  />
                </div>
                <Br />
              </CardContent>

              {formState?.isType == 'N' && (
                <Input
                  name="title"
                  label="Titulo de la publicación"
                  value={formState?.title}
                  onChange={handleChangeInput}
                  error={errors}
                />
              )}

              <TextArea
                name="description"
                label="Descripción"
                value={formState?.description}
                onChange={handleChangeInput}
                error={errors}
              />

              <Br />

              <CardContent
                title="Sube el tipo de contenido que quieras publicar"
                subtitle="Selecciona el tipo de contenido que quieras publicar"
              >
                <div className={styles.contentTypeContainer}>
                  <TagContents
                    icon={<IconGallery size={16} />}
                    isActive={formState.type == 'I'}
                    text="Contenido multimedia"
                    onClick={() =>
                      setFormState({
                        ...formState,
                        type: 'I',
                        url: null,
                        file: null,
                      })
                    }
                    disabled={action == 'edit'}
                  />
                  {formState.isType == 'P' && (
                    <>
                      <TagContents
                        isActive={formState.type == 'V'}
                        icon={<IconVideo size={16} />}
                        text={'Video'}
                        onClick={() =>
                          setFormState({
                            ...formState,
                            type: 'V',
                            file: null,
                            avatar: null,
                          })
                        }
                        disabled={action == 'edit'}
                      />
                      <TagContents
                        isActive={formState.type == 'D'}
                        icon={<IconDocs size={16} />}
                        text="Documento"
                        onClick={() =>
                          setFormState({
                            ...formState,
                            type: 'D',
                            url: null,
                            avatar: null,
                          })
                        }
                        disabled={action == 'edit'}
                      />
                    </>
                  )}
                </div>

                {formState?.type == 'I' && (
                  <div className={styles.uploadContainer}>
                    <UploadFileMultiple
                      name="avatar"
                      value={formState?.avatar || {}}
                      onChange={handleChangeInput}
                      label={'Subir imagen, jpg, png o webp'}
                      error={errors}
                      ext={['jpg', 'png', 'jpeg', 'webp']}
                      setError={setErrors}
                      img={true}
                      maxFiles={10}
                      prefix={'CONT'}
                      images={formState?.images || []}
                      item={formState}
                    />
                  </div>
                )}
                {formState?.type == 'V' && (
                  <div className={styles.uploadContainer}>
                    <Input
                      name="url"
                      label="Link del video"
                      value={formState?.url}
                      onChange={handleChangeInput}
                      error={errors}
                    />
                  </div>
                )}
                {formState?.type == 'D' && (
                  <div className={styles.uploadContainer}>
                    <UploadFile
                      name={'file'}
                      value={formState?.file}
                      onChange={handleChangeInput}
                      label={'Subir documento'}
                      error={errors}
                      ext={['pdf']}
                      setError={setErrors}
                      item={formState}
                    />
                  </div>
                )}
              </CardContent>
            </div>

            {/* Botones movidos fuera del formContent */}
            <div className={styles.actionButtons}>
              <Button variant="secondary" onClick={onClose}>
                Cancelar
              </Button>
              <Button onClick={onSave}>{formState?.id ? 'Actualizar' : 'Publicar'}</Button>
            </div>
          </div>

          <div className={styles.containerPreview}>
            <p>Vista previa</p>
            <div>
              <Preview formState={formState} extraData={extraData} action={action} />
            </div>
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
