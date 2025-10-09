"use client";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import styles from "./RenderForm.module.css";
import React, { useEffect, useState } from "react";
import {
  IconArrowLeft,
  IconArrowRight,
  IconEye,
  IconWorld,
} from "@/components/layout/icons/IconsBiblioteca";
import Select from "@/mk/components/forms/Select/Select";
import Check from "@/mk/components/forms/Check/Check";
import Switch from "@/mk/components/forms/Switch/Switch";
import Input from "@/mk/components/forms/Input/Input";
import { GMT, compareDate, getDateStrMes } from "@/mk/utils/date";
import ModalDestiny from "./ModalDestiny";
import { checkRules, hasErrors } from "@/mk/utils/validate/Rules";
import SurveyQuestionTypePanel from "../SurveyQuestionTypePanel/SurveyQuestionTypePanel";
import SurveyFactory from "../SurveyFactory/SurveyModalFactory";
import { useAuth } from "@/mk/contexts/AuthProvider";
import SurveyList from "../SurveyList/SurveyList";
import { formatNumber } from "@/mk/utils/numbers";
import TextArea from "@/mk/components/forms/TextArea/TextArea";

const RenderForm = ({
  open,
  onClose,
  item,
  setItem,
  execute,
  extraData,
  user,
  reLoad,
  action,
}: any) => {
  const [formState, setFormState]: any = useState({ ...item });
  const [openDestiny, setOpenDestiny] = useState(false);
  const [_open, setOpen] = useState(open);
  const [aff, setAff] = useState(0);
  const [errors, setErrors] = useState({});
  const [surveyType, setSurveyType] = useState("");
  const [openSurveyTypeModal, setOpenSurveyTypeModal] = useState(false);
  const [level, setLevel] = useState(1);
  const { showToast } = useAuth();
  const [lDestinys, setLdestinys]: any = useState([]);

  useEffect(() => {
    if (formState.id) {
      if (
        formState.squestions &&
        formState.squestions[0] &&
        formState.squestions[0].soptions
      ) {
        formState.questions = formState.squestions.map((q: any) => ({
          id: q.id,
          name: q.name,
          description: q.description,
          type: q.type,
          options: q.soptions.map((o: any) => ({
            id: o.id,
            name: o.name,
          })),
          min: q.min,
          max: q.max,
          order: q.order,
          is_mandatory: q.is_mandatory,
          switch: q.switch,
        }));
      }
    }
  }, []);
  useEffect(() => {
    if (formState?.destiny == 0 && !formState?.lDestiny) {
      getMeta([]);
    }
  }, [formState.destiny]);
  useEffect(() => {
    setFormState((prevState: any) => ({
      ...prevState,
   
    }));
  }, [formState.affCount]);

  const openSurveyType = (type: string) => {
    setSurveyType(type);
    setOpenSurveyTypeModal(true);
  };
  const progressBarStyle =
    level === 1
      ? {
          background: `linear-gradient(to right, var(--cSuccess) 50%, var(--cBlackV1) 50%)`,
        }
      : {
          backgroundColor: "var(--cSuccess)",
        };
  const lDestinies = () => {
    const level = user?.role.level;
    const r = [];
    r.push({ id: "T", name: "Todos" });
    r.push({ id: "D", name: "DEPARTAMENTO" });
    r.push({ id: "G", name: "GUARDIA" });
    r.push({ id: "R", name: "RESIDENTE" });
    return r;
  };
  const handleChange = (e: any) => {
    let value = e.target.value;
    if (e.target.name === "meta") {
      value = value.replace(/^[-]/, "");
      if (value !== "") {
        value = Math.min(Number(value), formState.affCount).toString();
      }
    }

    setFormState({ ...formState, [e.target.name]: value });
    if (e.target.name == "destiny" && value > 0) {
      setOpenDestiny(true);
      if (formState.destiny != value) {
        setFormState({
          ...formState,
          lDestiny: [],
          [e.target.name]: value,
        });
      }
    } else if (e.target.name == "destiny" && value == 0) {
      setFormState({
        ...formState,
        lDestiny: null,
        [e.target.name]: value,
      });
    }
  };
  const disabled = () => {
    let hoy: any = new Date();
    hoy.setHours(hoy.getHours() - GMT);
    hoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    return item?.begin_at && new Date(item?.begin_at) <= hoy;
  };
  const selDestinies = (value: any) => {
    let selDestinies = [];
    if (value == 2) selDestinies = extraData.listas;
    if (value == 3) selDestinies = extraData.dptos;
    if (value == 4) selDestinies = extraData.muns;
    // if (value == 5) selDestinies = extraData.barrios;

    return selDestinies;
  };
  const getMeta = async (sel: any) => {
    const { data } = await execute(
      "/surveys",
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

  const handlePercentaje = () => {

  };
  const validateLevel1 = (field: any = "") => {
    let errors: any = {};

    errors = checkRules({
      value: formState.destiny,
      rules: ["required"],
      key: "destiny",
      errors,
    });
    errors = checkRules({
      value: formState.name,
      rules: ["required"],
      key: "name",
      errors,
    });
    if (formState.switch == "Y") {
      errors = checkRules({
        value: formState.begin_at,
        rules: ["required", "greaterDate"],
        key: "begin_at",
        errors,
      });
      errors = checkRules({
        value: formState.end_at,
        rules: ["greaterDate", "greaterDate:begin_at", "required"],
        key: "end_at",
        errors,
        data: formState,
      });
    }

    setErrors(errors);
    return errors;
  };
  const _onSave = async () => {
    if (hasErrors(validateLevel1())) return;
    setLevel(2);
    if (!formState.meta) {
      setFormState({ ...formState, meta: aff });
    }
    if (level === 2) {
      let method = formState.id ? "PUT" : "POST";
      const { data } = await execute(
        "/surveys" + (formState.id ? "/" + formState.id : ""),
        method,
        {
          name: formState.name,
          description: formState.description,
          destiny: formState.destiny,
          lDestiny: lDestinys,
          // affCount: formState.affCount,
   
          begin_at: formState.begin_at,
          end_at: formState.end_at,
          is_mandatory: formState.is_mandatory,
          switch: formState.switch,
          questions: formState.questions,
        }
      );

      if (data?.success == true) {
        onClose();
        setLevel(1);
        setItem(formState);
        reLoad();

        showToast(data.message, "success");
      } else {
        showToast(data.message, "error");
      }
    }
  };
  const _onClose = () => {
    setOpen(false);
    onClose();
    setLevel(1);
  };
  const valueDate = (date: any) => {
    let val = date || "";
    val = val.split(" ")[0];
    val = val.split("T")[0];
    return val;
  };

  const calculatePercentage = (total: number, percentage: number): number => {
    return Math.ceil((total * percentage) / 100);
  };

  const _onClickCardPercentage = (percentage: number) => {
    const newAff = calculatePercentage(formState.affCount, percentage);
    setAff(newAff);
    setFormState({ ...formState, meta: newAff });
  };
  useEffect(() => {
    setAff((formState?.affCount * 10) / 100);
  }, [formState.affCount]);

  useEffect(() => {
    let lDestinies: any = formState.lDestiny || [];
    if (action == "edit" && !formState.lDestiny) {
      formState?.sdestinies?.map((d: any) => {
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

  return (
    <>
      <DataModal
        title="Crear encuesta"
        open={_open}
        onClose={_onClose}
        buttonText={level == 1 ? "Siguiente" : "Guardar"}
        className={styles.renderFormLevel1}
        onSave={_onSave}
      >
        <section>
          <div>
            Vista previa
            <IconEye />
          </div>
          <div
            style={{
              ...progressBarStyle,
              height: "3px",
              width: "100%",
              borderRadius: "var(--bRadius)",
            }}
          ></div>
          <div style={{ marginTop: 12 }}>
            <section>
              <p>{level}/2</p>
              <p>Define los datos de información y destino de tu encuesta</p>
            </section>
            {/* {formState.name && formState.description &&  */}
            <div>
              <IconArrowLeft
                onClick={() => {
                  if (level === 2) {
                    setLevel(1);
                  }
                }}
              />
              <IconArrowRight
                onClick={() => {
                  if (level === 1) _onSave();
                }}
              />
            </div>
          </div>
        </section>
        {level === 1 && (
          <>
            <section>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <IconWorld
                  size={48}
                  color="var(--cWhiteV1)"
                  style={{ minWidth: 30 }}
                />
                <div style={{ flexGrow: 1 }}>
                  <p className={styles.title}>Segmentación</p>

                  {formState.destiny > 0 ? (
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {selDestinies(formState?.destiny)
                        .filter((d: any) => lDestinys?.includes(d.id))
                        .map((d: any, index: number, array: any[]) => (
                          <p
                            key={d.id}
                            className={styles.subtitle}
                            style={{ color: "var(--cInfo)", marginTop: 4 }}
                          >
                            {d.name}
                            {index < array.length - 1 ? "," : ""}
                          </p>
                        ))}
                    </div>
                  ) : (
                    <p className={styles.subtitle}>
                      Selecciona el público al que se mostrará tu encuesta
                    </p>
                  )}
                </div>
                <Select
                  style={{ width: 200, minWidth: 200, alignSelf: "center" }}
                  name="destiny"
                  label="Público objetivo"
                  options={lDestinies() || []}
                  value={formState?.destiny}
                  onChange={handleChange}
                  error={errors}
                />
              </div>

              {formState?.destiny >= 0 &&
                formState.affCount >= 0 &&
                (aff > 0 && formState?.affCount >= 0 ? (
                  <div>
                    <p className={styles.title}>IA de Elekta</p>
                    <p className={styles.subtitle}>
                      Cuentas con un público de{" "}
                      {formatNumber(formState.affCount, 0)} afiliados,
                      considerando este dato necesitas llegar a una muestra de{" "}
                      {formatNumber(
                        calculatePercentage(formState.affCount, 10),
                        0
                      )}{" "}
                      afiliados equivalentes al 10% para obtener un volumen
                      relevante de respuestas.
                    </p>
                    <p
                      className={styles.title}
                      style={{ marginBottom: 8, marginTop: 12 }}
                    >
                      ¿Qué meta quieres fijar?
                    </p>
                    <div className={styles.metas}>
                      <div
                        onClick={() => _onClickCardPercentage(10)}
                        style={{
                          backgroundColor:
                            aff == calculatePercentage(formState.affCount, 10)
                              ? "var(--cHover)"
                              : "transparent",
                        }}
                      >
                        <p className={styles.title}>10%</p>
                        <p className={styles.subtitle}>
                          {formatNumber(
                            calculatePercentage(formState.affCount, 10),
                            0
                          )}{" "}
                          Afiliados
                        </p>
                      </div>
                      <div
                        style={{
                          backgroundColor:
                            aff == calculatePercentage(formState.affCount, 20)
                              ? "var(--cHover)"
                              : "transparent",
                        }}
                        onClick={() => _onClickCardPercentage(20)}
                      >
                        <p className={styles.title}>20%</p>
                        <p className={styles.subtitle}>
                          {formatNumber(
                            calculatePercentage(formState.affCount, 20),
                            0
                          )}{" "}
                          Afiliados
                        </p>
                      </div>
                      <div
                        style={{
                          backgroundColor:
                            aff == calculatePercentage(formState.affCount, 100)
                              ? "var(--cHover)"
                              : "transparent",
                        }}
                        onClick={() => _onClickCardPercentage(100)}
                      >
                        <p className={styles.title}>100%</p>
                        <p className={styles.subtitle}>
                          {formatNumber(formState.affCount, 0)} Afiliados
                        </p>
                      </div>
                      <div>
                        <Input
                          type="number"
                          name="meta"
                          label="Personalizado"
                          value={formState?.meta}
                          style={{ margin: 0 }}
                          onChange={handleChange}
                          onBlur={() => handlePercentaje()}
                       
                        />
                    
                      </div>
                    </div>
                  </div>
                ) : (
                  <p style={{ color: "var(--cError)" }}>
                    No se encuentra ningún afiliado
                  </p>
                ))}

              <div>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <div>
                    <p className={styles.title}>Obligatoriedad</p>
                    <p className={styles.subtitle}>
                      Marca aquí para requerir que el usuario responda la
                      encuesta sin posibilidad de omitirla
                    </p>
                  </div>
                  <Check
                    name="is_mandatory"
                    // label="Marcar como Obligatoria"
                    disabled={
                      (formState.begin_at &&
                        new Date(formState.begin_at) < new Date()) ||
                      formState?.sanswerscount > 0
                    }
                    value={formState.is_mandatory}
                    error={errors}
                    checked={formState.is_mandatory == "Y"}
                    onChange={(e: any) => {
                      handleChange({
                        target: {
                          name: "is_mandatory",
                          value: e.target.checked ? "Y" : "N",
                        },
                      });
                    }}
                  />
                </div>
              </div>

              <div>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <div>
                    <p className={styles.title}>Programar encuesta</p>
                    <p className={styles.subtitle}>
                      Selecciona este campo para programar el envío en una fecha
                      específica
                    </p>
                  </div>
                  <Switch
                    name="switch"
                    optionValue={["Y", "N"]}
                    value={formState.switch || "N"}
                    onChange={(e: any) => {
                      handleChange({
                        target: {
                          name: "switch",
                          value: e.target.checked ? "Y" : "N",
                        },
                      });
                    }}
                  />
                </div>
                {formState.switch == "Y" && (
                  <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                    <Input
                      type="date"
                      name="begin_at"
                      label="Fecha de inicio"
                      value={valueDate(formState?.begin_at)}
                      onChange={handleChange}
                      disabled={disabled()}
                      error={errors}
                    />
                    <Input
                      type="date"
                      name="end_at"
                      label="Fecha de fin"
                      value={valueDate(formState?.end_at)}
                      error={errors}
                      onChange={handleChange}
                      disabled={
                        item?.end_at &&
                        compareDate(item?.end_at, new Date(), "<")
                          ? true
                          : false
                      }
                    />
                  </div>
                )}
              </div>
              <div>
                <div>
                  <p className={styles.title} style={{ marginBottom: 12 }}>
                    Detalles de la encuesta
                  </p>
                  <Input
                    label="Título"
                    type="text"
                    name="name"
                    value={formState?.name}
                    onChange={handleChange}
                    error={errors}
                  />
                  <TextArea
                    label="Descripción"
                    name="description"
                    value={formState?.description}
                    onChange={handleChange}
                    error={errors}
                    isLimit={true}
                    maxLength={255}
                  />
                </div>
              </div>
            </section>
            {openDestiny && (
              <ModalDestiny
                open={openDestiny}
                onClose={() => setOpenDestiny(false)}
                selDestinies={selDestinies(formState.destiny)}
                formState={{ ...formState, lDestiny: lDestinys }}
                setFormState={setFormState}
                onSave={getMeta}
                showToast={showToast}
              />
            )}
          </>
        )}

        {level === 2 && (
          <div className={styles.renderFormLevel2}>
            <section>
              {formState.begin_at && formState.end_at && (
                <div className={styles.titleDate}>
                  Programada para el {getDateStrMes(formState.begin_at)} hasta
                  el {getDateStrMes(formState.end_at)}{" "}
                </div>
              )}

              <div className={styles.titleFormLv2}>
                <div>{formState.name}</div>{" "}
                {formState.is_mandatory && <div> • Obligatoria</div>}
              </div>
              <div className={styles.subtitleFormLv2}>
                {formState.description}
              </div>
            </section>
            <div>
              <SurveyList formState={formState} setFormState={setFormState} />
            </div>
            <SurveyQuestionTypePanel openSurveyType={openSurveyType} />
          </div>
        )}
      </DataModal>

      {surveyType !== "" && (
        <SurveyFactory
          type={surveyType}
          formState={formState}
          setFormState={setFormState}
          setType={setSurveyType}
        />
      )}
    </>
  );
};

export default RenderForm;
