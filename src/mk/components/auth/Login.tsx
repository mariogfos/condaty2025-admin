"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthProvider";
import { logError } from "../../utils/logs";
import LoginView from "@/components/auth/LoginView";
import { checkRules, hasErrors } from "@/mk/utils/validate/Rules";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import { UAParser } from "ua-parser-js";
import useAxios from "../../hooks/useAxios";

const Login = () => {
  const { user, getUser } = useAuth();
  const { execute } = useAxios();
  // const router = useRouter();
  const [errors, setErrors] = useState({});
  const [formState, setFormState] = useState({
    email: "",
    password: "",
  });
  const [deviceInfo, setDeviceInfo] = useState({});
  const [isNewDevice, setIsNewDevice] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");

  useEffect(() => {
    const getDeviceData = async () => {
      try {
        const fpPromise = FingerprintJS.load();
        const fp = await fpPromise;
        const result = await fp.get();
        const visitorId = result.visitorId;
        const storedFp = localStorage.getItem("device_fingerprint");

        if (storedFp && storedFp === visitorId) {
          setDeviceInfo({
            fingerprint: visitorId,
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
          // localStorage.setItem("device_fingerprint", visitorId);
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

    const { data, error }: any = await execute(
      process.env.NEXT_PUBLIC_AUTH_LOGIN,
      "POST",
      { ...formState, deviceInfo }
    );

    if (data?.success && !error) {
      localStorage.setItem(
        (process.env.NEXT_PUBLIC_AUTH_IAM as string) + "token",
        JSON.stringify({ token: data?.data?.token, user: data?.data?.user })
      );

      setIsNewDevice(true);
    } else {
      if (data?.errors?.status == 500) {
        setErrors({
          email: "Problemas de conexión con el servidor. Intente más tarde!",
        });
      } else {
        setErrors({
          email: "Datos incorrectos",
        });
      }
    }
  };

  const onVerify = () => {
    // Aquí iría la lógica de verificación del código
    getUser();
  };

  return (
    <LoginView
      errors={errors}
      formState={formState}
      handleChange={onChange}
      handleSubmit={onSubmit}
      showVerification={isNewDevice}
      verificationCode={verificationCode}
      setVerificationCode={setVerificationCode}
      onVerify={onVerify}
      onBack={() => setIsNewDevice(false)}
    />
  );
};

export default Login;
