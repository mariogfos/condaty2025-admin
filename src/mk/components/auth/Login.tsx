"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthProvider";
import { logError } from "../../utils/logs";
import LoginView from "@/components/auth/LoginView";
import { checkRules, hasErrors } from "@/mk/utils/validate/Rules";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import { UAParser } from "ua-parser-js";
import useAxios from "../../hooks/useAxios";
import { useScopedI18n } from "@/i18n/useScopedI18n";

const Login = () => {
  const { user, getUser } = useAuth();
  const { execute } = useAxios();
  const { translate } = useScopedI18n("auth");
  // const router = useRouter();
  const [errors, setErrors] = useState({});
  const [formState, setFormState] = useState({
    email: "",
    password: "",
  });
  const [deviceInfo, setDeviceInfo] = useState<any>({});
  const [isNewDevice, setIsNewDevice] = useState(false);
  const [showTrustDevice, setShowTrustDevice] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationMessage, setVerificationMessage] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTime, setBlockTime] = useState(0);
  const getUserKey = () => (formState.email || "").trim();
  const getAttemptsKey = (userKey: string) => `login_attempts_${userKey}`;
  const getBlockKey = (userKey: string) => `login_block_until_${userKey}`;

  useEffect(() => {
    const getDeviceData = async () => {
      try {
        const fpPromise = FingerprintJS.load();
        const fp = await fpPromise;
        const result = await fp.get();
        const visitorId = result.visitorId;
        const storedFp = localStorage.getItem("device_fingerprint");

        if (storedFp) {
          setDeviceInfo({
            fingerprint: storedFp,
          });
        } else {
          const parser = new UAParser();
          const resultUA = parser.getResult();
          setDeviceInfo({
            fingerprint: visitorId,
            os: resultUA.os.name,
            os_version: resultUA.os.version,
            browser: resultUA.browser.name,
            browser_version: resultUA.browser.version,
            device: resultUA.device.model || "Desktop",
            device_type: resultUA.device.type || "desktop",
            cpu: resultUA.cpu.architecture,
          });
        }
      } catch (error) {
        console.error(error);
      }
    };
    getDeviceData();
  }, []);

  const onChange = ({ target: { name, value } }: any) => {
    if (name === "email") {
      if (/^\d*$/.test(value)) {
        // evitar letras
        setFormState((prev) => ({ ...prev, [name]: value }));
      }
    } else {
      setFormState((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validaciones = () => {
    let errors: any = {};
    errors = checkRules({
      value: formState.email,
      rules: ["required", "ci"],
      key: "email",
      errors,
    });
    errors = checkRules({
      value: formState.password,
      rules: ["required", "password"],
      key: "password",
      errors,
    });

    setErrors(errors);
    return errors;
  };

  const onSubmit = async () => {
    if (hasErrors(validaciones())) return;

    const userKey = getUserKey();
    if (userKey) {
      const storedBlockUntil = localStorage.getItem(getBlockKey(userKey));
      if (storedBlockUntil) {
        const blockUntil = parseInt(storedBlockUntil, 10);
        if (blockUntil > Date.now()) {
          setIsBlocked(true);
          setErrors({
            email: translate("accountTemporarilyBlocked"),
          });
          return;
        } else {
          localStorage.removeItem(getBlockKey(userKey));
          localStorage.removeItem(getAttemptsKey(userKey));
          setIsBlocked(false);
          setAttempts(0);
        }
      }
    }

    const { data, error }: any = await execute(
      process.env.NEXT_PUBLIC_AUTH_LOGIN,
      "POST",
      { ...formState, deviceInfo },
    );

    if (data?.success && !error && data?.data?.token) {
      const userKey = getUserKey();
      if (userKey) {
        localStorage.removeItem(getAttemptsKey(userKey));
        localStorage.removeItem(getBlockKey(userKey));
      }
      localStorage.setItem(
        (process.env.NEXT_PUBLIC_AUTH_IAM as string) + "token",
        JSON.stringify({ token: data?.data?.token, user: data?.data?.user }),
      );
      // Actualizar estado global del usuario para redirigir
      getUser();
    } else {
      if (data?.errors?.device === "untrusted") {
        setVerificationMessage(translate("verificationMessage"));
        setIsNewDevice(true);
        if (userKey) {
          const storedAttempts = localStorage.getItem(getAttemptsKey(userKey));
          const storedBlockUntil = localStorage.getItem(getBlockKey(userKey));
          if (storedBlockUntil) {
            const blockUntil = parseInt(storedBlockUntil, 10);
            if (blockUntil > Date.now()) {
              setIsBlocked(true);
            } else {
              localStorage.removeItem(getBlockKey(userKey));
              setIsBlocked(false);
            }
          } else if (storedAttempts) {
            setAttempts(parseInt(storedAttempts, 10));
          } else {
            setAttempts(0);
            setIsBlocked(false);
          }
        }
      } else if (data?.errors?.status == 500) {
        setErrors({
          email: translate("serverConnectionIssue"),
        });
      } else {
        setErrors({
          email: translate("invalidCredentials"),
        });
      }
    }
  };

  const onVerify = async () => {
    if (isBlocked) return;

    const { data, error }: any = await execute(
      process.env.NEXT_PUBLIC_AUTH_VALIDATE_PIN || "/v3/adm-validatepin",
      "POST",
      {
        pin: verificationCode,
        ci: formState.email,
        type: "ADM",
      },
    );

    if (data?.success) {
      // PIN Correcto
      setIsNewDevice(false);
      setShowTrustDevice(true);
      const userKey = getUserKey();
      if (userKey) {
        localStorage.removeItem(getAttemptsKey(userKey));
        localStorage.removeItem(getBlockKey(userKey));
      }
      return;
    }

    // 🔴 Un fallo de la LLAMADA no es un PIN incorrecto.
    //
    // Acá todo lo que no fuera `success` sumaba un intento, y a los 3 el
    // usuario quedaba bloqueado 30 minutos. Con el endpoint caído —lo que pasó
    // hasta el 2026-08-08, cuando estas tres URLs apuntaban a rutas legacy que
    // devolvían 404— el superadmin se autobloqueaba sin haber tecleado nada
    // mal, y "reintentar" sólo gastaba el siguiente intento.
    //
    // El PIN se da por incorrecto cuando el back RESPONDE que lo es; si no hubo
    // respuesta, se dice que falló la conexión y no se cuenta.
    if (error || !data) {
      setErrors({ code: translate("serverConnectionIssue") });
      return;
    }

    {
      // PIN Incorrecto
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      const userKey = getUserKey();
      if (userKey) {
        localStorage.setItem(getAttemptsKey(userKey), newAttempts.toString());
      }

      if (newAttempts >= 3) {
        setIsBlocked(true);
        const blockUntil = Date.now() + 30 * 60 * 1000;
        if (userKey) {
          localStorage.setItem(getBlockKey(userKey), blockUntil.toString());
        }
        // Bloquear por 30 minutos (simulado por ahora)
        setTimeout(
          () => {
            setIsBlocked(false);
            setAttempts(0);
            if (userKey) {
              localStorage.removeItem(getBlockKey(userKey));
              localStorage.removeItem(getAttemptsKey(userKey));
            }
          },
          30 * 60 * 1000,
        );
      }

      setErrors({
        code: translate("invalidPin"),
      });
    }
  };

  const handleTrustDevice = async (trust: boolean) => {
    const { data, error }: any = await execute(
      process.env.NEXT_PUBLIC_AUTH_TRUST_DEVICE || "/v3/trust-device",
      "POST",
      {
        trustDevice: trust ? "Y" : "N",
        email: formState.email,
        password: formState.password,
        deviceInfo: deviceInfo,
      },
    );

    if (data?.success && !error) {
      if (trust) {
        localStorage.setItem("device_fingerprint", deviceInfo.fingerprint);
      } else {
        localStorage.removeItem("device_fingerprint");
      }

      localStorage.setItem(
        (process.env.NEXT_PUBLIC_AUTH_IAM as string) + "token",
        JSON.stringify({ token: data?.data?.token, user: data?.data?.user }),
      );
      // Redirigir al sistema
      getUser();
    }
  };

  /**
   * Reenviar el código.
   *
   * 🔴 Va por el LOGIN, no por `adm-getpin`, y no es un rodeo: es cómo funciona
   * el back. `LoginBaseController::login()` detecta el dispositivo nuevo y
   * llama a `getPin()` ÉL MISMO, dentro de ese request, donde el usuario ya
   * está autenticado. El endpoint `/v3/adm-getpin` es para otra cosa —pedir un
   * PIN estando ya adentro— y por eso vive detrás de `auth:sanctum` y lee el
   * usuario de la sesión.
   *
   * Este botón se aprieta en la pantalla del PIN, o sea ANTES de tener token.
   * Pegarle a `adm-getpin` desde acá no podía funcionar nunca: daba 404 por la
   * URL vieja, y con la URL corregida habría dado 401. Lo reportó Mario el
   * 2026-08-08: *"cuando le doy reintentar igual"*.
   *
   * ⚠️ La respuesta del login con dispositivo nuevo es `success: false` con
   * `errors.device === "untrusted"`. Eso NO es un fallo: significa que el
   * código se envió y el back espera el PIN.
   */
  const handleResendCode = async () => {
    const { data, error }: any = await execute(
      process.env.NEXT_PUBLIC_AUTH_LOGIN,
      "POST",
      { ...formState, deviceInfo },
    );

    const seEnvio = data?.errors?.device === "untrusted";

    if (seEnvio) {
      setVerificationMessage(translate("verificationMessage"));
    } else {
      setErrors({
        code: error || !data
          ? translate("serverConnectionIssue")
          : translate("unableToSendCode"),
      });
    }
  };

  return (
    <LoginView
      errors={errors}
      formState={formState}
      handleChange={onChange}
      handleSubmit={onSubmit}
      showVerification={isNewDevice}
      showTrustDevice={showTrustDevice}
      verificationCode={verificationCode}
      setVerificationCode={setVerificationCode}
      verificationMessage={verificationMessage}
      onVerify={onVerify}
      onTrustDevice={handleTrustDevice}
      onResendCode={handleResendCode}
      onBack={() => {
        setIsNewDevice(false);
        setShowTrustDevice(false);
        setAttempts(0);
        setIsBlocked(false);
      }}
      attempts={attempts}
      isBlocked={isBlocked}
    />
  );
};

export default Login;
