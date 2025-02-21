
'use client'
import { getUrlImages } from "@/mk/utils/string";
import React, { useEffect, useState } from "react";
import styles from "./Config.module.css"
import useAxios from "@/mk/hooks/useAxios";
// import { useRouter } from "next/router";
import { formatNumber } from "@/mk/utils/numbers";
import Input from "@/mk/components/forms/Input/Input";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import { IconArrowDown, IconCamera } from "@/components/layout/icons/IconsBiblioteca";
import Button from "@/mk/components/forms/Button/Button";
import Select from "@/mk/components/forms/Select/Select";
import { useAuth } from "@/mk/contexts/AuthProvider";
import DefaulterConfig from "./DefaulterConfig";
import PaymentsConfig from "./PaymentsConfig";
import DptoConfig from "./DptoConfig";
import TabsButtons from "@/mk/components/ui/TabsButton/TabsButtons";
import { checkRules, hasErrors } from "@/mk/utils/validate/Rules";

const Config = () => {
  const [formState, setFormState]: any = useState({});
  const [errorImage, setErrorImage] = useState(false);
  const [preview, setPreview]: any = useState(null);
  const [previewQr, setPreviewQr]: any = useState(null);
  const { user, showToast, getUser }: any = useAuth();
  const [errors, setErrors]: any = useState({});
  const [typeSearch, setTypeSearch] = useState("C");
  const [imageError, setImageError] = useState(false);
  // const router = useRouter();
 
  const {
    data: client_config,
    reLoad,
    execute,
  } = useAxios("/client-config", "GET", {
    perPage: -1,
    orderBy: "asc",
    sortBy: "",
    relation: "",
    page: 1,
    searchBy: "client_id,=," + user?.client_id,
  });
  const onChange = (e:any) => {
    let value = e?.target?.value;
    if (e.target.type == "checkbox") {
      value = e.target.checked ? "Y" : "N";
    }
    setFormState({ ...formState, [e.target.name]: value });

  };
  useEffect(() => {
    const ci = formState.payment_transfer_ci;

    if (ci && ci.length > 15) {
      // Update the formState to only include the first 10 characters
      setErrors({ ...errors, payment_transfer_ci: "Máximo 15 caracteres" });
      setFormState((prevState) => ({
        ...prevState,
        payment_transfer_ci: ci.slice(0, 15),
      }));
    }
  }, [formState.payment_transfer_ci]);

  // const onChangeCon = (e) => {
  //   let value = e.target.value;
  //   if (e.target.type == "checkbox") {
  //     value = e.target.checked ? "Y" : "N";
  //   }
  //   setFormStateCon({ ...formStateCon, [e.target.name]: value });
  // };
  const onChangeFile = (e) => {
    if (typeSearch != "C") {
      setPreviewQr(null);
      setFormState({ ...formState, avatarQr: "" });
    } else {
      setPreview(null);
      setFormState({ ...formState, avatar: "" });
    }
    // setPreview(null);
    // setFormState({ ...formState, avatar: "" });
    try {
      const file = e.target.files[0];
      if (
        !["png", "jpg", "jpeg"].includes(
          file.name
            .toLowerCase()
            .slice(((file.name.lastIndexOf(".") - 1) >>> 0) + 2)
        )
      ) {
        showToast("Solo se permiten imágenes", "error");
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const { result }: any = e.target;

        let base64String = result.replace("data:", "").replace(/^.+,/, "");
        base64String = encodeURIComponent(base64String);
        if (typeSearch != "C") {
          setPreviewQr(result);
        } else {
          setPreview(result);
        }
        if (typeSearch != "C") {
          setFormState({ ...formState, avatarQr: base64String });
        } else {
          setFormState({ ...formState, avatar: base64String });
        }
      };
      reader.onerror = (error) => console.log("reader error", error);
      reader.readAsDataURL(file);
    } catch (error) {
      if (typeSearch != "C") {
        setPreviewQr(null);
        setFormState({ ...formState, avatarQr: "" });
      } else {
        setPreview(null);
        setFormState({ ...formState, avatar: "" });
      }
    }
  };
  // const onSave = async () => {
  //   let err: any = {};
  //   if (typeSearch == "C") {
  //     if (!formState?.name) {
  //       err = { ...err, name: "Este campo es requerido" };
  //     }
  //     if (!formState?.address) {
  //       err = { ...err, address: "Este campo es requerido" };
  //     }
  //     if (!formState?.phone) {
  //       err = { ...err, phone: "Este campo es requerido" };
  //     }
  //     if (!formState?.year) {
  //       err = { ...err, year: "Este campo es requerido" };
  //     }
  //     if (!formState?.month) {
  //       err = { ...err, month: "Este campo es requerido" };
  //     }
  //     if (!formState?.initial_amount) {
  //       err = { ...err, initial_amount: "Este campo es requerido" };
  //     }
  //   }
  //   if (typeSearch == "M") {
  //     if (!formState?.soft_limit) {
  //       err = { ...err, soft_limit: "Este campo es requerido" };
  //     }
  //     if (!formState?.hard_limit) {
  //       err = { ...err, hard_limit: "Este campo es requerido" };
  //     }
  //     if (!formState?.penalty_percent) {
  //       err = { ...err, penalty_percent: "Este campo es requerido" };
  //     }
  //   }
  //   if (typeSearch == "P") {
  //     if (errorImage && !formState?.avatarQr) {
  //       err = { ...err, avatar: "Este campo es requerido" };
  //     }
  //     if (!formState?.payment_transfer_bank) {
  //       err = { ...err, payment_transfer_bank: "Este campo es requerido" };
  //     }
  //     if (!formState?.payment_transfer_account) {
  //       err = { ...err, payment_transfer_account: "Este campo es requerido" };
  //     }
  //     if (!formState?.payment_transfer_name) {
  //       err = { ...err, payment_transfer_name: "Este campo es requerido" };
  //     }

  //     if (!formState?.payment_office_obs) {
  //       err = { ...err, payment_office_obs: "Este campo es requerido" };
  //     }
  //     const ci = formState?.payment_transfer_ci;
  //     if (ci) {
  //       if (ci.length < 5) {
  //         err = { ...err, payment_transfer_ci: "Mínimo 5 caracteres" };
  //       } else if (ci.length > 15) {
  //         err = { ...err, payment_transfer_ci: "Máximo 15 caracteres" };
  //       }
  //     } else {
  //       err = { ...err, payment_transfer_ci: "Este campo es requerido" };
  //     }
  //   }

  //   if (Object.keys(err).length > 0) {
  //     setErrors(err);
  //     return;
  //   }

  //   const { data, error } = await execute(
  //     "/client-config-actualizar",
  //     "PUT",
  //     formState
  //   );

  //   if (data?.success == true) {
  //     showToast("Datos guardados", "success");
  //     // getUser();
  //     // router.push("/");
  //     setErrors({});
  //   } else {
  //     showToast(error?.data?.message || error?.message, "error");
  //     console.log("error:", error);
  //     setErrors(error?.data?.errors);
  //   }
  // };



 
const validate = () => {
  let errors: any = {};

  if (typeSearch === "C") {
    errors = checkRules({
      value: formState.name,
      rules: ["required"],
      key: "name",
      errors,
    });
    errors = checkRules({
      value: formState.email,
      rules: ["required", "email"],
      key: "email",
      errors,
    });
    errors = checkRules({
      value: formState.address,
      rules: ["required"],
      key: "address",
      errors,
    });
    errors = checkRules({
      value: formState.phone,
      rules: ["required"],
      key: "phone",
      errors,
    });
    errors = checkRules({
      value: formState.year,
      rules: ["required"],
      key: "year",
      errors,
    });
    errors = checkRules({
      value: formState.month,
      rules: ["required"],
      key: "month",
      errors,
    });
    errors = checkRules({
      value: formState.initial_amount,
      rules: ["required"],
      key: "initial_amount",
      errors,
    });
  }

  if (typeSearch === "M") {
    errors = checkRules({
      value: formState.soft_limit,
      rules: ["required"],
      key: "soft_limit",
      errors,
    });
    errors = checkRules({
      value: formState.hard_limit,
      rules: ["required"],
      key: "hard_limit",
      errors,
    });
    errors = checkRules({
      value: formState.penalty_percent,
      rules: ["required"],
      key: "penalty_percent",
      errors,
    });
  }

  if (typeSearch === "P") {
    // Si hay error con la imagen, se valida que el avatarQr sea obligatorio
    if (errorImage) {
      errors = checkRules({
        value: formState.avatarQr,
        rules: ["required"],
        key: "avatar",
        errors,
      });
    }
    errors = checkRules({
      value: formState.payment_transfer_bank,
      rules: ["required"],
      key: "payment_transfer_bank",
      errors,
    });
    errors = checkRules({
      value: formState.payment_transfer_account,
      rules: ["required"],
      key: "payment_transfer_account",
      errors,
    });
    errors = checkRules({
      value: formState.payment_transfer_name,
      rules: ["required"],
      key: "payment_transfer_name",
      errors,
    });
    errors = checkRules({
      value: formState.payment_office_obs,
      rules: ["required"],
      key: "payment_office_obs",
      errors,
    });
    errors = checkRules({
      value: formState.payment_transfer_ci,
      rules: ["required", "min:5", "max:15"],
      key: "payment_transfer_ci",
      errors,
    });
  }

  setErrors(errors);
  return errors;
};

// Ahora, el onSave utiliza la función validate para comprobar si hay errores:
const onSave = async () => {
  if (hasErrors(validate())) return;

  const { data, error } = await execute(
    "/client-config-actualizar",
    "PUT",
    formState
  );

  if (data?.success === true) {
    showToast("Datos guardados", "success");
    setErrors({});
    // Aquí puedes realizar otras acciones como redirigir o refrescar datos.
  } else {
    showToast(error?.data?.message || error?.message, "error");
    console.log("error:", error);
    setErrors(error?.data?.errors);
  }
};

  useEffect(() => {
    const client = user?.clients?.find((i) => i.id == user?.client_id);
    setFormState({ ...client_config?.data[0], ...client });
  }, [client_config?.data]);


  return (
    <div className={styles.Config}>
    
   <div>
    <TabsButtons 
       tabs={[
        {value:'C',text:'Condominio'},
        {value:'P',text:'Pagos'},       
        {value:'M',text:'Moroso'}
      ]}
       sel={typeSearch}
       setSel={setTypeSearch}
       /> 
    </div>
      <div className="">
        {typeSearch == "M" && (
          // <div className=" ">
          //   <p className="text-[24px] text-tWhite ">
          //     Gestionar a los morosos es una tarea importante para los
          //     administradores de condominios
          //   </p>
          //   <p className="text-sm text-lightv3 mb-8">
          //     Configura las acciones que se tomarán con los mororsos de tu
          //     comunidad
          //   </p>
          //   <div>
          //     <div className="gap-5 mb-10 items-center">
          //       <p className="text-tWhite text-base">Pre-aviso</p>
          //       <p className="text-lightv3 text-sm">
          //         Define la cantidad de expensas una vez que se establece el
          //         período de soft baneo, los morosos que no paguen sus cuotas
          //         dentro de ese período recibirán notificaciones en la app
          //         informándoles que su acceso será bloqueado si no pagan sus
          //         deudas.
          //       </p>
          //       <div className="flex gap-5 items-center my-3">
          //         <p className="text-tWhite text-sm font-light">
          //           Número de expensas
          //         </p>
          //         <div className="w-[15%] tablet:w-1/12">
          //           <Input
          //             type="number"
          //             label=""
          //             className="flex items-center"
          //             name="soft_limit"
          //             error={errors}
          //             required
          //             value={formState?.soft_limit}
          //             onChange={onChange}
          //           />
          //         </div>
          //       </div>
          //     </div>

          //     <div className=" gap-5 mb-10 items-center">
          //       <p className="text-tWhite text-base">Bloqueo</p>
          //       <p className="text-lightv3 text-sm">
          //         Define la cantidad de expensas atrasadas puede tener un moroso
          //         para que ya no pueda usar la app esta acción bloqueará el
          //         acceso de un moroso a la app Condaty de forma permanente.
          //       </p>
          //       <div className="flex gap-5 items-center my-3">
          //         <p className="text-tWhite text-sm font-light">
          //           Número de expensas
          //         </p>
          //         <div className="w-[15%] tablet:w-1/12">
          //           <Input
          //             type="number"
          //             label=""
          //             className="flex items-center"
          //             name="hard_limit"
          //             error={errors}
          //             required
          //             value={formState?.hard_limit}
          //             onChange={onChange}
          //           />
          //         </div>
          //       </div>
          //     </div>

          //     <div className="my-8">
          //       <p className="text-2xl text-tWhite ">Multas por morosidad</p>
          //       <p className="text-lightv3 text-sm">
          //         Configura las multas por morosidad en Condaty y garantiza el
          //         cumplimiento de las cuotas mensuales. Con nuestro sistema,
          //         puedes establecer el porcentaje de la multa y el número de
          //         meses que transcurrirán antes de que se comience a cobrar.
          //       </p>

          //       <div className="mt-10 mb-2">
          //         <p className="text-base text-tWhite">
          //           Porcentaje de multa por morosidad
          //         </p>
          //         <p className="text-lightv3 text-sm">
          //           Establece el porcentaje de la multa que se aplicará por cada
          //           mes de morosidad.
          //         </p>
          //       </div>
          //       <div className="flex gap-5 items-center ">
          //         <p className="text-tWhite text-sm font-light">Porcentaje</p>
          //         <div className="w-[15%] tablet:w-1/12">
          //           <Input
          //             label=""
          //             className="flex items-center"
          //             name="penalty_percent"
          //             error={errors}
          //             required
          //             value={formState.penalty_percent}
          //             onChange={onChange}
          //           />
          //         </div>
          //         <p className="text-tWhite">%</p>
          //       </div>

          //       <div className="mt-10 mb-2">
          //         <p className="text-base text-tWhite">
          //           Meses para empezar a cobrar la multa
          //         </p>
          //         <p className="text-lightv3 text-sm">
          //           Establece el número de meses que transcurrirán antes de que
          //           se comience a cobrar la multa por morosidad.
          //         </p>
          //       </div>
          //       <div className="flex gap-5 items-center ">
          //         <p className="text-tWhite text-sm font-light">
          //           Número de meses
          //         </p>
          //         <div className="w-[15%] tablet:w-1/12">
          //           <Input
          //             type="text"
          //             label=""
          //             className="flex items-center"
          //             name="penalty_limit"
          //             error={errors}
          //             required
          //             value={formState?.penalty_limit}
          //             onChange={onChange}
          //           />
          //         </div>
          //       </div>
          //     </div>
          //   </div>
          // </div>
          <DefaulterConfig formState={formState} onChange={onChange} errors={errors} />
        )}
        {typeSearch == "P" && (
          // <div className="">
          //   <p className="text-2xl text-tWhite">
          //     Medios de pagos que podrán usar los residentes
          //   </p>
          //   <p className="text-sm text-lightv3 mb-9">
          //     Configura los medios de pago que tendrán tus residentes para
          //     realizar sus pagos de deudas
          //   </p>
          //   <div className="border border-[#868686] rounded-lg relative mt-5 laptopL:mx-40 py-7">
          //     <p className="text-center absolute text-tWhite bg-[#292929] -top-4 left-4 font-black text-lg">
          //       Datos del Qr
          //     </p>
          //     <div className="px-10 my-6">
          //       {" "}
          //       <p className="text-lightv3 text-xs">
          //         Te recomendamos subir un código QR en la plataforma sin monto
          //         específico. Esto facilitará la gestión de pagos y garantizará
          //         un proceso más eficiente.
          //       </p>
          //     </div>
          //     <div className="flex justify-center mb-4">
          //       <div>
          //         <div className="w-[160px] h-[160px] bg-slate-950 rounded-lg my-4 relative ">
          //           {(!errorImage || previewQr) && (
          //             <img
          //               alt="Imagen"
          //               className="object-contain  w-[160px] h-[160px] rounded-lg"
          //               src={
          //                 previewQr ||
          //                 getUrlImages(
          //                   "/PAYMENTQR-" +
          //                     user?.client_id +
          //                     ".png?d=" +
          //                     new Date().toISOString()
          //                 )
          //               }
          //               onError={() => {
          //                 setErrorImage(true);
          //               }}
          //             />
          //           )}
          //         </div>
          //         {errors.avatar != "" && (
          //           <p className={`px-2 my-4 text-xs mt-1 text-red-600`}>
          //             {errors.avatar}
          //           </p>
          //         )}
          //         <label htmlFor="imagePerfil">
          //           {/* <IconCamera className="absolute -top-3 -right-3 w-6 h-6 text-primary rounded-full bg-black p-1 border border-primary/50" /> */}
          //           <p className="text-center bg-accent rounded-md text-xs py-1 font-semibold">
          //             Subir Qr
          //           </p>
          //           <input
          //             type="file"
          //             id="imagePerfil"
          //             className="hidden"
          //             onChange={onChangeFile}
          //           />
          //         </label>
          //       </div>
          //     </div>
          //     <div className="px-10">
          //       <TextArea
          //         label="Observaciones"
          //         name="payment_qr_obs"
          //         onChange={onChange}
          //         value={formState?.payment_qr_obs}
          //       />
          //     </div>
          //   </div>
          //   <div className="border border-[#868686] rounded-lg relative mt-5 laptopL:mx-40 py-7">
          //     <p className="text-center absolute text-tWhite bg-[#292929] -top-4 left-4 font-black text-lg">
          //       Datos de Transferencia Bancaria
          //     </p>
          //     <div className="mt-5 px-10">
          //       <Input
          //         type="text"
          //         label="Entidad Bancaria"
          //         name="payment_transfer_bank"
          //         error={errors}
          //         required
          //         value={formState?.payment_transfer_bank}
          //         onChange={onChange}
          //       />
          //       <Input
          //         type="text"
          //         label="Número de cuenta"
          //         name="payment_transfer_account"
          //         error={errors}
          //         required
          //         value={formState?.payment_transfer_account}
          //         onChange={onChange}
          //       />
          //       <Input
          //         type="text"
          //         label="Nombre de destinatario"
          //         name="payment_transfer_name"
          //         error={errors}
          //         value={formState?.payment_transfer_name}
          //         onChange={onChange}
          //         required
          //       />
          //       <Input
          //         type="number"
          //         label="Carnet de identidad/NIT"
          //         name="payment_transfer_ci"
          //         error={errors}
          //         required={true}
          //         value={formState?.payment_transfer_ci}
          //         onChange={onChange}
          //       />
          //       <TextArea
          //         label="Observaciones"
          //         name="payment_transfer_obs"
          //         onChange={onChange}
          //         value={formState?.payment_transfer_obs}
          //       />
          //     </div>
          //   </div>
          //   <div className="border border-[#868686] rounded-lg relative my-5 laptopL:mx-40 py-7">
          //     <p className="text-center absolute text-tWhite bg-[#292929] -top-4 left-4 font-black text-lg">
          //       Datos de Pago en oficina
          //     </p>
          //     <div className="mt-5 px-10">
          //       <TextArea
          //         label="Detalles y requisitos"
          //         required
          //         name="payment_office_obs"
          //         onChange={onChange}
          //         value={formState?.payment_office_obs}
          //         error={errors}
          //       />
          //       {/* {errors.payment_office_obs != "" && (
          //       <p className={`px-2 my-4 text-xs mt-1 text-red-600`}>
          //         {errors.payment_office_obs}
          //       </p>
          //     )} */}
          //     </div>
          //   </div>
          // </div>
          <PaymentsConfig formState={formState} onChange={onChange} errors={errors} />
        )}
        {typeSearch == "C" && (
          // <>
          //   <div className="w-full flex justify-center my-6">
          //     <div className="bg-darkv2 w-[375px] h-[114px] relative rounded-md">
          //       {(!imageError || preview) && (
          //         <img
          //           alt="Imagen"
          //           className="rounded-lg object-cover max-w-[375px] max-h-[114px] w-full h-full"
          //           src={
          //             preview ||
          //             getUrlImages(
          //               "/CLIENT-" +
          //                 formState?.id +
          //                 ".png?d=" +
          //                 new Date().toISOString()
          //             )
          //           }
          //           onError={() => setImageError(true)}
          //         />
          //       )}
          //       <label
          //         htmlFor="imagePerfil"
          //         className="absolute right-5 -bottom-3 tablet:-right-3 rounded-full bg-accent text-tBlack p-2 dark:text-tWhite"
          //       >
          //         <IconCamera className="text-tBlack" />
          //       </label>
          //       <input
          //         type="file"
          //         id="imagePerfil"
          //         className="hidden"
          //         onChange={onChangeFile}
          //       />
          //     </div>
          //   </div>
          //   <Input
          //     label={"Nombre del condominio"}
          //     value={formState["name"]}
          //     type="text"
          //     name="name"
          //     error={errors}
          //     required
          //     onChange={onChange}
          //   />
          //   <Select
          //     label="Tipo de condominio"
          //     value={formState?.type}
          //     name="type"
          //     error={errors}
          //     onChange={onChange}
          //     options={[
          //       { id: "C", name: "Condominio" },
          //       { id: "E", name: "Edificio" },
          //       { id: "U", name: "Urbanización" },
          //     ]}
          //     required
          //   //   icon={<IconArrowDown className="text-lightColor" />}
          //     className="appearance-none"
          //   ></Select>
          //   <Select
          //     label="Tipo de unidad"
          //     value={formState?.type_dpto}
          //     name="type_dpto"
          //     error={errors}
          //     onChange={onChange}
          //     options={[
          //       { id: "D", name: "Departamento" },
          //       { id: "O", name: "Oficina" },
          //       { id: "C", name: "Casa" },
          //       { id: "L", name: "Lote" },
          //     ]}
          //     required
          //   //   icon={<IconArrowDown className="text-lightColor" />}
          //     className="appearance-none"
          //   ></Select>
          //   <Input
          //     label={"Dirección"}
          //     value={formState["address"]}
          //     type="text"
          //     name="address"
          //     error={errors}
          //     required
          //     onChange={onChange}
          //   />
          //   <Input
          //     label={"Correo electrónico"}
          //     value={formState["email"]}
          //     type="email"
          //     name="email"
          //     error={errors}
          //     required
          //     onChange={onChange}
          //   />
          //   <Input
          //     label={"Teléfono"}
          //     value={formState["phone"]}
          //     type="number"
          //     name="phone"
          //     error={errors}
          //     required
          //     onChange={onChange}
          //   />
          //   <TextArea
          //     label="Descripción"
          //     name="description"
          //     required={false}
          //     onChange={onChange}
          //     value={formState?.description}
          //   />
          //   <div className="my-5">
          //     <p className="text-tWhite">
          //       Fecha de inicio de cobro de expensas
          //     </p>
          //     <p className="text-lightv3 text-xs">
          //       ¿Cuándo quieres que empiece el sistema a cobrar las expensas?
          //     </p>
          //     <p className="text-lightv3 text-xs">
          //       Esta configuración es importante para que el sistema pueda
          //       calcular correctamente las cuotas adeudadas por los residentes.
          //     </p>
          //   </div>
          //   <Select
          //     label="Mes"
          //     value={formState?.month}
          //     name="month"
          //     error={errors}
          //     onChange={onChange}
          //     options={[
          //       { id: "1", name: "Enero" },
          //       { id: "2", name: "Febrero" },
          //       { id: "3", name: "Marzo" },
          //       { id: "4", name: "Abril" },
          //       { id: "5", name: "Mayo" },
          //       { id: "6", name: "Junio" },
          //       { id: "7", name: "Julio" },
          //       { id: "8", name: "Agosto" },
          //       { id: "9", name: "Septiembre" },
          //       { id: "10", name: "Octubre" },
          //       { id: "11", name: "Noviembre" },
          //       { id: "12", name: "Diciembre" },
          //     ]}
          //     required
          //   //   icon={<IconArrowDown className="text-lightColor" />}
          //     className="appearance-none"
          //   ></Select>

          //   <Input
          //     type="number"
          //     label="Año"
          //     name="year"
          //     error={errors}
          //     required
          //     value={formState?.year}
          //     onChange={onChange}
          //   />
          //   <div className="my-5">
          //     <p className="text-tWhite">
          //       Ingresa el monto con el que inicia el condominio
          //     </p>
          //     <p className="text-lightv3 text-xs">
          //       Esta configuración es importante para que el sistema pueda tomar
          //       en cuenta con qué monto ingresa el condominio.
          //     </p>
          //   </div>
          //   <Input
          //     type="number"
          //     label="Saldo"
          //     name="initial_amount"
          //     error={errors}
          //     required
          //     value={formState?.initial_amount}
          //     onChange={onChange}
          //     disabled={
          //       client_config?.data[0].initial_amount === null ? false : true
          //     }
          //   />
          // </>
          <DptoConfig formState={formState} setFormState={setFormState} onChange={onChange} errors={errors} setErrors={setErrors} client_config={client_config}/>
        )}
        <div className="w-full flex justify-center mb-6">
          <Button
            className={
              typeSearch == "P" ? "w-[68%] btn btn-primary" : "btn btn-primary"
            }
            onClick={() => onSave()}
          >
            Guardar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Config;
