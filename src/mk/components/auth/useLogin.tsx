import { useRouter } from "next/router";
import { useState } from "react";
import { useAuth } from "../../contexts/AuthProvider";
import { logError } from "../../utils/logs";
import { checkRules, hasErrors } from "@/mk/utils/validate/Rules";

type UseLoginType = {
  errors: Record<string, any>;
  formState: Record<string, any>;
  onChange: Function;
  onSubmit: Function;
};

const useLogin = (): UseLoginType => {
  const { user, login } = useAuth();
  const router = useRouter();
  const [errors, setErrors] = useState({});
  const [formState, setFormState] = useState({
    email: "",
    password: "",
  });

  const onChange = ({ target: { name, value } }: any) => {
    setFormState((prev) => ({ ...prev, [name]: value }));
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
        router.push(process.env.NEXT_PUBLIC_AUTH_SUCCESS as string);
      } else {
        if (data?.errors?.status == 500) {
          setErrors({
            email:
              "Problemas de conexion con el servidor... Intente mas tarde!",
          });
        } else {
          setErrors({
            ...data?.errors,
          });
        }
      
      }
      return;
    });
  };

  return { errors, formState, onChange, onSubmit };
};

export default useLogin;
