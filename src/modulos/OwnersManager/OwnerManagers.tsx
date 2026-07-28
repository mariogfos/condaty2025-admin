/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import { useAuth } from "@/mk/contexts/AuthProvider";
import styles from "./OwnerManager.module.css";
import useAxios from "@/mk/hooks/useAxios";
import { useState } from "react";
import Input from "@/mk/components/forms/Input/Input";
import InputFullName from "@/mk/components/forms/InputFullName/InputFullName";
import Button from "@/mk/components/forms/Button/Button";
import { Card } from "@/mk/components/ui/Card/Card";
import { getFullName } from "@/mk/utils/string";
import { checkRules, hasErrors } from "@/mk/utils/validate/Rules";
import { ClientOwnerStatus, ClientOwnerType } from "@/modulos/Payments/Type/PaymentType";

const OwnerManager = () => {
  const { showToast, user } = useAuth();
  const { execute } = useAxios();

  if (user?.client_id != "98d1f463-c2bb-4174-99f3-dd82171c7aaa") {
    return <div></div>;
  }
  const [formState, setFormState]: any = useState({});
  const [errors, setErrors]: any = useState({});
  const [valid, setValid]: any = useState({ ci: true, email: true });

  const onFocus = (e: any) => {
    let name = e.target.name.trim();
    if (name == "newCi") name = "ci";
    setValid((prev: any) => ({
      ...prev,
      [name]: false,
    }));
  };

  const onBlurCi = async (e: React.FocusEvent<HTMLInputElement>) => {
    setErrors((prev: any) => ({
      ...prev,
      newCi: null,
      ci: null,
    }));
    const ci = e.target.value.trim();
    const name = e.target.name.trim();
    if (!ci) return;
    if (name == "newCi") {
      if (formState.ci == ci) {
        setValid((prev: any) => ({
          ...prev,
          ci: true,
        }));
        return;
      }
    }
    try {
      const { data } = await execute(
        "/owners",
        "GET",
        {
          fullType: "EXIST",
          type: "ci",
          searchBy: ci,
          fullData: 1,
          // _debug: 1,
          // operfos: 1,
        },
        false
        // true
      );
      if (data?.success && data.data?.data?.id) {
        if (name == "newCi") {
          showToast("El CI ya está en uso", "warning");
          setValid((prev: any) => ({
            ...prev,
            ci: false,
          }));
          setErrors((prev: any) => ({
            ...prev,
            newCi: "El CI ya está en uso",
          }));
          return;
        }
        const ownerData = data.data.data;

        setFormState((prev: any) => ({
          ...ownerData,
          newCi: ownerData.ci,
          oldEmail: ownerData.email || "",
        }));
        setValid((prev: any) => ({
          ...prev,
          ci: true,
        }));
      } else {
        if (name == "ci") {
          setFormState((prev: any) => ({ ci: ci }));
          showToast("El CI no existe", "error");
        } else {
          setValid((prev: any) => ({
            ...prev,
            ci: true,
          }));
        }
      }
    } catch (error) {
      console.error("Error al validar CI:", error);
      showToast("Error al validar el CI", "error");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormState((prev: any) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev: any) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const onBlurEmail = async (e: React.FocusEvent<HTMLInputElement>) => {
    const email = e.target.value.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    if (email == formState.oldEmail) {
      setValid((prev: any) => ({
        ...prev,
        email: true,
      }));
      return;
    }

    try {
      const { data } = await execute(
        "/owners",
        "GET",
        {
          fullType: "EXIST",
          type: "email",
          searchBy: email,
        },
        false,
        true
      );

      if (data?.success && data.data?.data?.id) {
        showToast("El email ya está en uso", "warning");
        setErrors((prev: any) => ({
          ...prev,
          email: "El email ya está en uso",
        }));
        setValid((prev: any) => ({
          ...prev,
          email: false,
        }));
        setFormState((prev: any) => ({ ...prev, email: "" }));
      } else {
        setErrors((prev: any) => ({
          ...prev,
          email: undefined,
        }));
        setValid((prev: any) => ({
          ...prev,
          email: true,
        }));
      }
    } catch (error) {
      console.error("Error al validar email:", error);
      showToast("Error al validar el email", "error");
    }
  };

  const getRol = (type: string | number) => {
    const numericType = Number(type);
    const strType = String(type);
    // HALLAZGO-NEW-22: legacy char "T" no documentado en ClientOwnerType, mapea a RESIDENT
    if (numericType === ClientOwnerType.HOMEOWNER || numericType === 1 || strType === "H")
      return "Propietario";
    if (numericType === ClientOwnerType.RESIDENT || numericType === 2 || strType === "T")
      return "Residente";
    if (numericType === ClientOwnerType.HOMEOWNER_RESIDENT || strType === "HT")
      return "Propietario y Residente";
    if (numericType === ClientOwnerType.DEPENDENT || strType === "D")
      return "Dependiente";
    return "";
  };

  const validate = () => {
    let errors: any = {};
    const requiredFields = ["newCi", "name", "last_name", "email"];
    requiredFields.forEach((field) => {
      errors = checkRules({
        value: formState[field],
        rules: ["required"],
        key: field,
        errors,
      });
    });

    // Aplicar regla específica para CI
    errors = checkRules({
      value: formState.newCi,
      rules: ["ci"],
      key: "newCi",
      errors,
    });

    // Aplicar reglas específicas para email
    errors = checkRules({
      value: formState.email,
      rules: ["required", "email"],
      key: "email",
      errors,
    });

    // Aplicar regla específica para teléfono si tiene valor
    if (formState.phone) {
      errors = checkRules({
        value: formState.phone,
        rules: ["phone"],
        key: "phone",
        errors,
      });
    }

    setErrors(errors);
    return errors;
  };

  const onSave = async (reset = false) => {
    const validationErrors = validate();
    if (hasErrors(validationErrors)) {
      setErrors(validationErrors);
      return;
    }

    try {
      const payload: any = {
        id: formState.id,
        ci: formState.newCi,
        name: formState.name,
        middle_name: formState.middle_name || "",
        last_name: formState.last_name,
        mother_last_name: formState.mother_last_name || "",
        phone: formState.phone || "",
        email: formState.email || "",
        om: 1,
      };
      if (reset) {
        payload.password = formState.newCi;
      }

      const endpoint = `/owners/${formState.id}`;
      const method = "PUT";

      const { data: response } = await execute(endpoint, method, payload, true);

      if (response?.success) {
        setFormState({});
        showToast(response?.message || "Operación exitosa", "success");
      } else {
        showToast(response?.message || "Error al guardar los datos", "error");
      }
    } catch (error) {
      console.error("Error al guardar el residente:", error);
      showToast("Error al guardar el residente", "error");
    }
  };

  return (
    <div className={styles.style} style={{ width: "650px" }}>
      <h1>Administrador de Propietarios</h1>
      <br />
      <div className={styles.fieldSet}>
        <Input
          name="ci"
          value={formState.ci || ""}
          onChange={handleChange}
          onBlur={onBlurCi}
          label="Carnet de Identidad"
          error={errors}
          required
        />
        {formState.id && (
          <Card>
            <div className={styles.sectionHeader}>
              <h3>Editar Información Personal</h3>
            </div>
            <Input
              name="newCi"
              value={formState.newCi || ""}
              onChange={handleChange}
              onBlur={onBlurCi}
              onFocus={onFocus}
              label="Nuevo Carnet de Identidad"
              error={errors}
              required
            />
            <InputFullName
              name="name"
              value={formState}
              onChange={handleChange}
              errors={errors}
            />
            <Input
              label="Celular (Opcional)"
              name="phone"
              value={formState.phone || ""}
              onChange={handleChange}
              error={errors}
            />
            <Input
              label="Correo electrónico"
              name="email"
              type="email"
              value={formState.email || ""}
              onChange={handleChange}
              onBlur={onBlurEmail}
              onFocus={onFocus}
              error={errors}
              required
            />
            <div>
              Usuario esta activo?:{" "}
              <span>{formState.status === ClientOwnerStatus.WAITING ? "No" : "Sí"}</span>
            </div>
            <br />
            El usuario esta vinculado a las siguientes Unidades:
            {formState.dptos1?.map((client: any) => (
              <div key={client.id}>
                {client.client.name} - Unidad:{" "}
                <span>
                  {client.nro} ({client.homeowner_id ? "Propietario" : ""}{" "}
                  {client.tenant_id ? "Residente" : ""})
                </span>
              </div>
            ))}
            <br />
            El usuario vinculado a los siguientes Condominios:
            {formState.clients?.map((client: any) => (
              <div key={client.id}>
                {client.client.name} (
                {client.status === ClientOwnerStatus.WAITING ? "No Activado" : "Activado"}) Rol:{" "}
                {getRol(client.type)}{" "}
                {client.titular &&
                  " su Titular es: " + getFullName(client.titular) + " "}
                {client.dptos?.map((dpto: any) => (
                  <>
                    - Reside en la unidad:{" "}
                    <span key={dpto.id}>{dpto.dpto.nro}</span>
                  </>
                ))}
              </div>
            ))}
            <br />
            <br />
            <div style={{ display: "flex", gap: "10px" }}>
              <Button
                className={styles.submitButton}
                disabled={!valid.ci || !valid.email}
                onClick={() => {
                  onSave(false);
                }}
              >
                Guardar
              </Button>
              <Button
                variant="danger"
                className={styles.submitButton}
                onClick={() => {
                  onSave(true);
                }}
                disabled={!valid.ci || !valid.email}
              >
                Guardar y Resetear Password
              </Button>
              <Button
                variant="secondary"
                className={styles.submitButton}
                onClick={() => {
                  setFormState({});
                }}
              >
                Anular
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
export default OwnerManager;
