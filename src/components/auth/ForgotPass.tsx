import InputCode from "@/mk/components/forms/InputCode/InputCode";
import useAxios from "@/mk/hooks/useAxios";
import { useEffect, useState } from "react";
import { useAuth } from "@/mk/contexts/AuthProvider";
import Input from "../../mk/components/forms/Input/Input";
import InputPassword from "../../mk/components/forms/InputPassword/InputPassword";
import DataModal from "../../mk/components/ui/DataModal/DataModal";
import { logError } from "@/mk/utils/logs";

type PropsType = {
  open: boolean;
  setOpen: Function;
  mod?: any;
};

const ForgotPass = ({ open, setOpen, mod }: PropsType) => {
  const { execute } = useAxios();
  const { showToast } = useAuth();
  const [formState, setformState]: any = useState({});
  const [errors, seterrors]: any = useState({});
  const [minutos, setMinutos] = useState(0);
  const [segundos, setSegundos] = useState(0);

  const handleChangeInput = (e: any) => {
    let value = e.target.value;
    
    if (e.target.name === "ci") {
      value = value.replace(/\D/g, "");
      value = value.slice(0, 11);
    }
  
    if (e.target.name === "newPassword" || e.target.name === "repPassword") {
      value = value.replace(/\s+/g, ""); 
    }
    setformState({ ...formState, [e.target.name]: value });
  };

  useEffect(() => {
    seterrors({});
    setformState({ newPassword: null, pinned: 1 });
    return () => {
      if (intervalo) clearInterval(intervalo);
    };
  }, [open]);

  let intervalo: any = null;

  const cuentaRegresiva = (tiempoTotal: number) => {
    const fechaInicio = new Date().getTime();
    const fechaObjetivo = fechaInicio + tiempoTotal;

    intervalo = setInterval(function () {
      const fechaActual = new Date().getTime();
      const diferencia = fechaObjetivo - fechaActual;

      const minutost = Math.floor(diferencia / (1000 * 60));
      const segundost = Math.floor((diferencia % (1000 * 60)) / 1000);

      setMinutos(minutost);
      setSegundos(segundost);

      if (diferencia < 0) {
        clearInterval(intervalo);
        setMinutos(0);
        setSegundos(0);
      }
    }, 1000);
    return intervalo;
  };

  const onGetCode = async () => {
    if (minutos || segundos > 0) {
      showToast("Espera 2 minutos para solicitar el código.", "info");
      return;
    }
    // console.log(formState.ci,'fstci')
    let err = {};
    if (!formState.ci)
      {err = { ...err, ci: "Indica tu carnet de identidad" };}
    if(formState.ci && formState.ci.length > 11 )
     { err = { ...err,ci: "El carnet de identidad debe tener máximo 11 caracteres" };}
  

    if (Object.keys(err).length > 0) {
      seterrors(err);
      return;
    }

    const { data, error } = await execute("/" + mod + "-getpinreset", "POST", {
      ci: formState.ci,
      code: "",
      type:'email'
    });

    if (data?.success === true) {
      showToast(data?.message, "success");
      // console.log(data?.message,"datamsg")
      setformState({ ...formState, newPassword: "", pinned: 2 });
      cuentaRegresiva(2 * 60 * 1000);
    } else {
      showToast(error?.message, "error");
    }
  };
  const setCode = (code: string) => {
    setformState({ ...formState, code });
  };

 const inputCodeValidation = () => {  
  let err = {};
  if(formState.pinned === 2){
    if (!formState.code)
     { err = { ...err, code: "Ingresa el código de verificación enviado a tu correo electrónico" }};
    if (formState.code?.length != 4)
      {err = { ...err, code: "El código de verificación debe tener 4 dígitos" }}
    else { setformState({ ...formState, pinned: 3 }) }; 
    if (Object.keys(err).length > 0) {
      seterrors(err);
      return;
    }
    }
 }

  const onChangePass = async () => {
    let err = {};
    let url = "/" + mod + "-setpassreset";

    let param: any = { code: formState.code };

    if(formState.pinned === 3 ){
    if (!formState.newPassword)
      err = { ...err, password: "Ingresa tu nueva contraseña" };
    if (formState.newPassword?.length < 8)
      err = {
        ...err,
        newPassword: "La contraseña debe tener al menos 8 caracteres",
      };
    if (formState.newPassword?.length > 10)
      err = {
        ...err,
        newPassword: "La contraseña debe tener máximo 10 caracteres",
      };
      if(formState.newPassword != formState.repPassword){
        err = {
          ...err,
          repPassword: "Las contraseñas deben ser iguales",
        };
      }}

    if (Object.keys(err).length > 0) {
      seterrors(err);
      return;
    }
    param = { ...param, password: formState.newPassword, ci: formState.ci };
    // console.log(param,'paramsssss')
    const { data, error } = await execute(url, "POST", param);
    if (data?.success == true) {
      showToast(data.message, "success");
      setformState({ pinned: 0 });
      seterrors({});
      setOpen(false);
    } else {
      showToast(data?.errors?.token|| data?.message ||  error?.data?.message || error?.message, "error");
      logError("Error ChangePass", error);
      seterrors(error?.data?.errors);
    }
  };
  const _onSave = () => {
    if (formState.pinned === 1) {
      onGetCode();
    } 
    if(formState.pinned === 2){
      inputCodeValidation();
      
    }
    if(formState.pinned === 3){
      onChangePass();
      // setformState({ ...formState, pinned: 4 });
    }
    
   
  }
  return (
    <DataModal
      open={open}
      title={ formState.pinned === 1 ? "Olvidé mi contraseña":formState.pinned === 2 ? "Código de verificación" : "Cambiar contraseña" }
      onClose={() => setOpen(false)}
      onSave={_onSave}
      buttonText={formState.pinned === 1 ? "Obtener código" : formState.pinned === 2 ? "Continuar" : "Cambiar contraseña"  }
      buttonCancel=""
    >
      {formState.pinned === 1 ? (
        <div>
          Ingresa tu cédula de identidad y se enviará un código de verificación a tu correo electrónico.
          <Input
            label={"Cedúla de identidad"}
            required={false}
            type="text"
            name="ci"
            error={errors}
            value={formState.ci}
            onChange={handleChangeInput}
            className="mYl"
            maxLength={11}
          />
          {(minutos || segundos > 0) && (
            <div className="cError">
              Espera {minutos} minuto{minutos === 0? `s`:''} con {segundos} segundos para volver
              a solicitar el código de verificación.
            </div>
          )}
        </div>
      ) :
       formState.pinned === 2? (
        <>
        
          <div>Enviamos un código de verificación a tu correo para que puedas
                crear una contraseña nueva</div>
                <div style={{display:"flex",justifyContent:"center"}}>
          <InputCode
            label="Código de verificación"
            type="number"
            name="code"
            error={errors}
            value={formState.code}
            setCode={setCode}
            onChange={() => {}}
            // className="mYl"
          ></InputCode>
          {/* <div> Si no encuentras el código en tu buzón, busca en la carpeta de
                spam o correos no deseados. Si el código no está allí, es
                posible que tu correo electrónico indicado no exista o es
                incorrecto.</div> */}
          </div>
       
        </>
      ):(
        <div>
        <InputPassword
          label="Contraseña nueva"
          name="newPassword"
          value={formState["newPassword"]}
          error={errors}
          onChange={handleChangeInput}
        />
          <InputPassword
          label="Repetir contraseña"
          name="repPassword"
          value={formState["repPassword"]}
          error={errors}
          onChange={handleChangeInput}
        />
      </div>)
    
    
    }
    </DataModal>
  );
};

export default ForgotPass;
