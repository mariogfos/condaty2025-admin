import InputCode from "@/mk/components/forms/InputCode/InputCode";
import useAxios from "@/mk/hooks/useAxios";
import { useEffect, useState } from "react";
import { useAuth } from "@/mk/contexts/AuthProvider";
import Input from "../../mk/components/forms/Input/Input";
import InputPassword from "../../mk/components/forms/InputPassword/InputPassword";
import DataModal from "../../mk/components/ui/DataModal/DataModal";
import { logError } from "@/mk/utils/logs";
import { useScopedI18n } from "@/i18n/useScopedI18n";

type PropsType = {
  open: boolean;
  setOpen: Function;
  mod?: any;
};

const ForgotPass = ({ open, setOpen, mod }: PropsType) => {
  const { execute } = useAxios();
  const { showToast } = useAuth();
  const { t } = useScopedI18n("auth");
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
      showToast(t("waitToResendCode"), "info");
      return;
    }
    // console.log(formState.ci,'fstci')
    let err = {};
    if (!formState.ci) {
      err = { ...err, ci: t("enterDocument") };
    }
    if (formState.ci && formState.ci.length > 11) {
      err = {
        ...err,
        ci: t("documentMaxLength"),
      };
    }

    if (Object.keys(err).length > 0) {
      seterrors(err);
      return;
    }

    const { data, error } = await execute("/" + mod + "-getpinreset", "POST", {
      ci: formState.ci,
      code: "",
      type: "email",
    });

    if (data?.success === true) {
      showToast(t("verificationCodeSent"), "success");
      // console.log(data?.message,"datamsg")
      setformState({ ...formState, newPassword: "", pinned: 2 });
      cuentaRegresiva(2 * 60 * 1000);
    } else {
      showToast(t("unableToSendCode"), "error");
    }
  };
  const setCode = (code: string) => {
    setformState({ ...formState, code });
  };

  const inputCodeValidation = async () => {
    let err = {};
    if (formState.pinned === 2) {
      if (!formState.code) {
        err = {
          ...err,
          code: t("enterVerificationCode"),
        };
      }
      if (formState.code?.length != 4) {
        err = {
          ...err,
          code: t("codeMustHaveFourDigits"),
        };
      }

      if (Object.keys(err).length > 0) {
        seterrors(err);
        return;
      }

      // Validar el pin con la API
      const { data, error } = await execute("/adm-validatepin", "POST", {
        ci: formState.ci,
        pin: formState.code,
        type: "ADM",
      });

      if (data?.success === true) {
        setformState({ ...formState, pinned: 3 });
      } else {
        showToast(t("invalidVerificationCode"), "error");
        seterrors({ code: t("invalidVerificationCode") });
      }
    }
  };

  const onChangePass = async () => {
    let err = {};
    let url = "/" + mod + "-setpassreset";

    let param: any = { code: formState.code };

    if (formState.pinned === 3) {
      if (!formState.newPassword)
        err = { ...err, newPassword: t("enterNewPassword") };
      if (formState.newPassword?.length < 8)
        err = {
          ...err,
          newPassword: t("passwordMinLength"),
        };
      if (formState.newPassword?.length > 10)
        err = {
          ...err,
          newPassword: t("passwordMaxLength"),
        };
      if (formState.newPassword != formState.repPassword) {
        err = {
          ...err,
          repPassword: t("passwordsMustMatch"),
        };
      }
    }

    if (Object.keys(err).length > 0) {
      seterrors(err);
      return;
    }
    param = { ...param, password: formState.newPassword, ci: formState.ci };
    // console.log(param,'paramsssss')
    const { data, error } = await execute(url, "POST", param);
    if (data?.success == true) {
      showToast(t("passwordUpdated"), "success");
      setformState({ pinned: 0 });
      seterrors({});
      setOpen(false);
    } else {
      showToast(t("unableToChangePassword"), "error");
      logError("Error ChangePass", error);
      seterrors(error?.data?.errors);
    }
  };
  const _onSave = () => {
    if (formState.pinned === 1) {
      onGetCode();
    }
    if (formState.pinned === 2) {
      inputCodeValidation();
    }
    if (formState.pinned === 3) {
      onChangePass();
      // setformState({ ...formState, pinned: 4 });
    }
  };
  return (
    <DataModal
      open={open}
      ignoreTranslation
      title={
        formState.pinned === 1
          ? t("forgotPasswordTitle")
          : formState.pinned === 2
            ? t("verificationCodeTitle")
            : t("changePasswordTitle")
      }
      onClose={() => setOpen(false)}
      onSave={_onSave}
      buttonText={
        formState.pinned === 1
          ? t("getCode")
          : formState.pinned === 2
            ? t("continue")
            : t("changePasswordAction")
      }
      buttonCancel=""
      // variant={"mini"}
      minWidth={360}
      maxWidth={680}
    >
      {formState.pinned === 1 ? (
        <div data-i18n-ignore="true">
          {t("forgotPasswordDescription", {
            document: t("identityDocumentLabel"),
          })}
          <Input
            label={t("identityDocumentLabel")}
            required={true}
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
              {t("forgotPasswordCountdown", {
                minutes: minutos,
                seconds: segundos < 10 ? `0${segundos}` : segundos,
              })}
            </div>
          )}
        </div>
      ) : formState.pinned === 2 ? (
        <div data-i18n-ignore="true">
          <div>{t("verificationCodeDescription")}</div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <InputCode
              label={t("verificationCodeLabel")}
              type="number"
              name="code"
              error={errors}
              value={formState.code}
              setCode={setCode}
              onChange={() => {}}
              // className="mYl"
            ></InputCode>
          </div>
        </div>
      ) : (
        <div data-i18n-ignore="true">
          <InputPassword
            label={t("newPasswordLabel")}
            name="newPassword"
            value={formState["newPassword"]}
            error={errors}
            onChange={handleChangeInput}
          />
          <InputPassword
            label={t("repeatPasswordLabel")}
            name="repPassword"
            value={formState["repPassword"]}
            error={errors}
            onChange={handleChangeInput}
          />
        </div>
      )}
    </DataModal>
  );
};

export default ForgotPass;
