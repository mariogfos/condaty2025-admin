"use client";
import { redirect } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthProvider";
import { logError } from "../../utils/logs";
import LoginView from "@/components/auth/LoginView";
import { checkRules, hasErrors } from "@/mk/utils/validate/Rules";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import { UAParser } from "ua-parser-js";

const Login = () => {
  const { user, login } = useAuth();
  // const router = useRouter();
  const [errors, setErrors] = useState({});
  const [formState, setFormState] = useState({
    email: "",
    password: "",
  });
  const [deviceInfo, setDeviceInfo] = useState({});

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

    login({ ...formState, deviceInfo }).then((data: any) => {
      if (user || data?.user) {
        redirect(process.env.NEXT_PUBLIC_AUTH_SUCCESS as string);
      } else {
        if (data?.errors?.status == 500) {
          setErrors({
            email: "Problemas de conexión con el servidor. Intente más tarde!",
          });
        } else {
          setErrors({
            /* ...data?.errors, */
            email: "Datos incorrectos",
          });
        }
      }
      return;
    });
  };

  return (
    <LoginView
      errors={errors}
      formState={formState}
      handleChange={onChange}
      handleSubmit={onSubmit}
    />
  );
};

export default Login;
