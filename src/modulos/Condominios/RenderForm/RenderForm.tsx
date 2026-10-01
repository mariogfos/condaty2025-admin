import Input from "@/mk/components/forms/Input/Input";
import Select from "@/mk/components/forms/Select/Select";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { checkRules, hasErrors } from "@/mk/utils/validate/Rules";
import React, { useRef, useState } from "react";
import DataModalV2 from "@/mk/components/ui/DataModalV2/DataModalV2";
import { IconDepartment2 } from "@/components/layout/icons/IconsBiblioteca";
import Br from "@/components/Detail/Br";
import styles from "./RenderForm.module.css";
import { clearCreationIntent, loadCreationIntent, saveCreationIntent } from "./creationIntent";
import type { CreationIntent } from "./creationIntent";

const RenderForm = ({
  open,
  onClose,
  item,
  execute,
  extraData,
  reLoad,
}: any) => {
  const { showToast, user } = useAuth();
  const actor = String(user?.id || "anonymous");
  const [restored] = useState(() => item?.id ? null : loadCreationIntent(actor));
  const [formState, setFormState] = useState({ ...item, ...restored?.payload });
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [uncertain, setUncertain] = useState(Boolean(restored));
  const inFlight = useRef(false);
  const intent = useRef<CreationIntent | null>(restored);
  const fieldsLocked = isSaving || uncertain;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    if (inFlight.current || uncertain) return;

    setFormState((prev: any) => ({
      ...prev,
      [name]: value,
    }));
  };
  const validate = () => {
    let errors: any = {};
    errors = checkRules({
      value: formState?.name,
      rules: ["required"],
      key: "name",
      errors,
    });

    errors = checkRules({
      value: formState?.type,
      rules: ["required"],
      key: "type",
      errors,
    });
    errors = checkRules({
      value: formState?.privacy,
      rules: ["required"],
      key: "privacy",
      errors,
    });

    setErrors(errors);
    return errors;
  };
  const _onSave = async () => {
    if (inFlight.current) return;
    if (hasErrors(validate())) return;
    if (navigator.onLine === false) {
      showToast("No hay conexión. Conéctate y vuelve a intentar.", "error");
      return;
    }
    // Synchronous latch: React state alone cannot block two clicks in the same render.
    inFlight.current = true;
    setIsSaving(true);
    const creating = !formState.id;
    try {
      const payload = {
        name: formState?.name || "",
        type: formState?.type || "",
        privacy: formState?.privacy || "",
      };
      if (creating && !intent.current) {
        intent.current = { request_id: crypto.randomUUID(), payload };
        saveCreationIntent(actor, intent.current);
      }
      const { data, error } = await execute(
        "/v3/clients" + (creating ? "" : "/" + formState.id),
        creating ? "POST" : "PUT",
        creating ? { ...intent.current!.payload, request_id: intent.current!.request_id } : payload,
      );
      if (data?.success) {
        if (creating) clearCreationIntent(actor, intent.current!.request_id);
        onClose();
        reLoad();
        showToast(data.message || "Condominio guardado.", "success");
        return;
      }
      // A timeout/5xx may occur AFTER commit. Keep the same token and immutable payload.
      // A 409 is NOT unknown: the API already answered that this intent cannot be
      // replayed (its condominium was deleted, or the stored payload differs).
      // Keeping it would leave the form stuck on a retry that always fails.
      const response = data ?? error?.data;
      const outcomeUnknown = error?.status !== 409 && (response?.success !== false || error?.status >= 500);
      if (creating && outcomeUnknown) setUncertain(true);
      if (creating && !outcomeUnknown) {
        clearCreationIntent(actor, intent.current!.request_id);
        intent.current = null;
        setUncertain(false);
      }
      showToast(response?.message || "No pudimos confirmar el guardado. Reintenta para verificarlo sin duplicar.", "error");
    } catch {
      if (creating && intent.current) setUncertain(true);
      showToast("No pudimos confirmar el guardado. Reintenta con los mismos datos.", "error");
    } finally {
      inFlight.current = false;
      setIsSaving(false);
    }
  };

  return (
    <DataModalV2
      open={open}
      onClose={() => { if (!inFlight.current) onClose(); }}
      icon={<IconDepartment2 />}
      title={formState.id ? "Editar condominio" : "Crear condominio"}
      subtitle="Completa el formulario para crear un nuevo condominio"
      onSave={_onSave}
      disabled={isSaving}
      buttonText={isSaving ? "Guardando…" : uncertain ? "Reintentar y verificar" : "Guardar"}
      buttonCancel={isSaving ? "" : "Cancelar"}
      variant={"mini"}
      maxWidth={560}
    >
      {uncertain && <p role="status" className={styles.subtitle}>Hay un intento pendiente de confirmar. Reintenta para recuperar el resultado; no se creará otro condominio.</p>}
      <p className={styles.title}>Información básica</p>
      <p className={styles.subtitle}>
        Datos visibles para todos los propietarios y residentes.
      </p>
      <Input
        name="name"
        value={formState.name || ""}
        onChange={handleChange}
        label="Nombre del condominio"
        error={errors}
        type="text"
        disabled={fieldsLocked || item?.isInUse}
        required
      />
      <Select
        label="Tipo de condominio"
        name="type"
        value={formState.type || ""}
        disabled={fieldsLocked || item?.isInUse}
        optionLabel="name"
        options={extraData?.types || []}
        optionValue="id"
        onChange={handleChange}
        error={errors}
        required
      />
      <Br
        style={{
          margin: "20px 0px",
          backgroundColor: "var(--cBackground)",
          height: 1,
        }}
      />
      <p className={styles.title}>Privacidad</p>
      <p className={styles.subtitle}>
        Determina si el condominio será público o interno.
      </p>
      <Select
        label="Selecciona la privacidad"
        name="privacy"
        value={formState.privacy || ""}
        optionLabel="name"
        disabled={fieldsLocked || Boolean(item?.id)}
        options={extraData?.privacy || []}
        optionValue="id"
        onChange={handleChange}
        error={errors}
        required
      />
    </DataModalV2>
  );
};

export default RenderForm;
