"use client";
import { redirect } from "next/navigation";
import { useState } from "react";
import { useAuth } from "../../contexts/AuthProvider";
import { logError } from "../../utils/logs";
import LoginView from "@/components/auth/LoginView";
import { checkRules, hasErrors } from "@/mk/utils/validate/Rules";

const Login = () => {
  const { user, login } = useAuth();
  // const router = useRouter();
  const [errors, setErrors] = useState({});
  const [formState, setFormState] = useState({
    email: "",
    password: "",
  });

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

    login(formState).then((data: any) => {
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
        logError("====================================");
        logError("Error Login", errors, data?.errors);
        logError("====================================");
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
