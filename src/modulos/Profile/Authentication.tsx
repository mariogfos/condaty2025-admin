import Input from "@/mk/components/forms/Input/Input";
import InputCode from "@/mk/components/forms/InputCode/InputCode";
import InputPassword from "@/mk/components/forms/InputPassword/InputPassword";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import { checkRules, hasErrors } from "@/mk/utils/validate/Rules";
import { useEffect, useState } from "react";
interface PropsType {
  open: boolean;
  onClose: any;
  formState: any;
  setFormState: Function;
  errors: any;
  execute: Function;
  showToast: Function;
  setErrors: Function;
  getUser: Function;
  type: string;
  user: any;
}

const Authentication = ({
  open,
  onClose,
  formState,
  setFormState,
  errors,
  execute,
  showToast,
  setErrors,
  getUser,
  type,
  user,
}: PropsType) => {
  const [isDisabled, setIsDisabled] = useState(false);
  const [oldEmail, setOldEmail] = useState("");

  const modalTitle = formState.pinned === 0
  ? type === "M"
    ? "Cambiar correo"
    : "Cambiar contraseña"
  : formState.pinned === 1
  ? "Código de verificación"
  : `Cambiar ${type === "M" ? "correo" : "contraseña"}`;

  const modalButtonText = formState.pinned === 0
  ? "Obtener código"
  : formState.pinned === 1
  ? "Continuar"
  : type === "M"
  ? "Cambiar correo"
  : "Cambiar contraseña";
  useEffect(() => {
    setErrors({});
    setFormState({ newPassword: null, pinned: 0 });
  
  }, [open]);
 
  const validateCode = () => {
    let errors: any = {};
    // if (!formState.code)
    //     err = {
    //       ...err,
    //       coe: 'Ingrese el codigo PIN enviado a su correo electrónico',
    //     };
    //   if (formState.code?.length != 4)
    //     err = {...err, code: 'El codigo PIN debe tener 4 digitos'};
    errors = checkRules({
      value: formState.code,
      rules: ["required", "min:4"],
      key: "code",
      errors,
    });
    setErrors(errors);
    return errors;
  };

  const validateEmail = () => {
    // await _onExist();
    //   if (!formState.newEmail)
    //     err = {...err, newEmail: 'Ingrese el nuevo correo electrónico'};
    //   param = {...param, email: formState.newEmail};
    let errors: any = {};
    errors = checkRules({
      value: formState.newEmail,
      rules: ["required", "email"],
      key: "newEmail",
      errors,
    });
    setErrors(errors);
    return errors;
  };

  const validatePassword = () => {
    let errors: any = {};
    errors = checkRules({
      value: formState.password,
      rules: ["required", "password"],
      key: "password",
      errors,
    });
    errors = checkRules({
      value: formState.passwordRepeat,
      rules: ["required", "same:password"],
      key: "passwordRepeat",
      errors,
      data: formState,
    });
    setErrors(errors);
    return errors;
  };

  const onChangeData = async () => {
    let err = {};
    let url = "/adm-setemail";
    if (hasErrors(validateCode())) {
      return;
    }
    let param: any = { code: formState.code };
    if (type == "M") {
      if (hasErrors(validateEmail())) {
        return;
      }
      param = { ...param, email: formState.newEmail };
    } else {
      if (hasErrors(validatePassword())) {
        return;
      }
      url = "/adm-setpass";
      param = { ...param, password: formState.password };
    }

    if (Object.keys(err).length > 0) {
      setErrors(err);
      return;
    }
    const { data, error } = await execute(url, "POST", param);

    if (data?.success == true) {
      showToast(data.message, "success");
      setFormState({ pinned: 0, code: "", newEmail: "", password: "" });
      setErrors({});
      getUser();
    } else {
      // showToast(error?.data?.message || error?.message, "error");
      showToast(data.message, "error");
      setErrors(data?.errors);
    }
  };
  // console.log(type,'tyyype')

  const onGetCode = async () => {
    const { data, error } = await execute("/adm-getpin", "POST", {type:'email'});
    if (data?.success == true) {
      showToast("Código enviado a su correo", "success");
      setFormState({ ...formState, email: data.email, pinned: 1, code: "" });
    } else {
      showToast(error?.message, "error");
    }
  };
  const setCode = (code: string) => {
    setFormState({ ...formState, code });
  };
  const handleChange = (e: any) => {
    let value = e.target.value;

     // Si el campo es de tipo password, eliminar los espacios en blanco
  if (e.target.name === "password" || e.target.name === "passwordRepeat") {
    value = value.replace(/\s+/g, ""); 
  }
    if (e.target.type == "checkbox") {
      value = e.target.checked ? "Y" : "N";
    }
    setFormState({ ...formState, [e.target.name]: value });
  };
  const _onExist = async () => {
    if (formState.newEmail === oldEmail || formState.newEmail === "") {
      setIsDisabled(false);
      return;
    }
    const { data: response } = await execute("/adm-exist", "GET", {
      searchBy: formState.newEmail,
      type: "email",
      cols: "id,email",
    });
    setIsDisabled(false);
    setOldEmail(formState.newEmail);
    if (response?.data != null && response?.data.email !== user.email) {
      setIsDisabled(true);
      setErrors({ newEmail: "El email ya existe" });
      return;
    }
    validateEmail();
  };
  const _onClose = () => {
    setFormState({
      ...formState,
      pinned: 0,
      code: "",
      newEmail: "",
      password: "",
    });
    onClose();
    setErrors({});
  };
  const inputCodeValidation = () => {  
    let err = {};
    if(formState.pinned === 1){
      if (!formState.code)
       { err = { ...err, code: "Ingresa el código de verificación enviado a tu correo electrónico" }};
      if (formState.code?.length != 4)
        {err = { ...err, code: "El código de verificación debe tener 4 dígitos" }}
      else { setFormState({ ...formState, pinned: 2 }) }; 
      if (Object.keys(err).length > 0) {
        setErrors(err);
        return;
      }
      }
   }
  
  const _onSave = () => {
    if (formState.pinned === 0) {
      onGetCode();
    } 
    if(formState.pinned === 1){
      inputCodeValidation();
      
    }
    if(formState.pinned === 2){
      // onChangePass();
      onChangeData();
      
    }
    
   
  }
  return (
    <DataModal
      open={open}
      title={ modalTitle }
      onClose={_onClose}
      onSave={ _onSave }
      buttonText={modalButtonText}
      buttonCancel=""
      disabled={isDisabled}
    >
      {formState?.pinned === 0 ? (
        <div>Se enviará un código de verificación a tu correo electrónico.</div>
      ) : formState?.pinned === 1 ? (
        <div>
        <div  style={{marginBottom:16,marginTop:16}}>Ingresa el código de 4 dígitos que te enviamos a tu correo electrónico. Una vez validado, se actualizará tu  {type == "M" ? "correo" : "contraseña"}</div>
        <div style={{display:"flex",justifyContent:"center"}}>
          <InputCode
            label=""
            type="text"
            name="code"
            error={errors}
            required={true}
            value={formState?.code}
            setCode={setCode}
          ></InputCode>
          </div>
          </div>):(
            <>
            {type == "M" ? (
            <Input
              label="Correo nuevo"
              type="text"
              name="newEmail"
              value={formState["newEmail"]}
              onBlur={() => _onExist()}
              onFocus={() => setIsDisabled(true)}
              error={errors}
              required={true}
              onChange={handleChange}
            />
          ) : (
            <>
            <InputPassword
              value={formState.password}
              error={errors}
              required={true}
              onChange={handleChange}
              name="password"
              nameRepeat="passwordRepeat"
              onChangeRepeat={handleChange}
              repeatPasswordValue={formState.passwordRepeat}
              repeatPassword={true}
              label="Contraseña nueva"
            />
            <div> Si tu contraseña se guarda exitosamente debes volver a iniciar sesión </div>
            </>
          )}   
          </>)}
    </DataModal>
  );
};

export default Authentication;
