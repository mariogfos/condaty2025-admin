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
  // Without a user id there is no actor to key the intent by: no intent is
  // stored or restored (a shared "anonymous" key could hand one admin's
  // pending intent to another).
  const actor = user?.id ? String(user.id) : null;
  const [restored] = useState(() => (item?.id || !actor ? null : loadCreationIntent(actor)));
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
  const dropIntent = () => {
    if (actor && intent.current) clearCreationIntent(actor, intent.current.request_id);
    intent.current = null;
    setUncertain(false);
  };

  // With a pending intent, cancelling DISCARDS it: otherwise a deterministic 5xx
  // keeps the form on "Reintentar y verificar" for the whole tab session. The
  // list reloads, because the condominium may have been created after all.
  const cancel = () => {
    if (inFlight.current) return;
    if (uncertain) {
      dropIntent();
      reLoad();
      showToast("Se descartó el intento pendiente. Si el condominio se llegó a crear, aparece en la lista.", "info");
    }
    onClose();
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
        if (actor) saveCreationIntent(actor, intent.current);
      }
      const { data, error } = await execute(
        "/v3/clients" + (creating ? "" : "/" + formState.id),
        creating ? "POST" : "PUT",
        creating ? { ...intent.current!.payload, request_id: intent.current!.request_id } : payload,
      );
      if (data?.success) {
        if (creating) dropIntent();
        onClose();
        reLoad();
        showToast(data.message || "Condominio guardado.", "success");
        return;
      }
      const response = data ?? error?.data;
      // A 409 is NOT an unknown outcome: the API answered that this intent's
      // condominium already exists (saved with other data) or was deleted. To
      // this form both mean "done": re-enabling it would let the next click
      // create a DUPLICATE with a fresh request_id. Close and reload the list.
      if (creating && error?.status === 409) {
        dropIntent();
        onClose();
        reLoad();
        showToast(response?.message || "Este condominio ya se había creado.", "error");
        return;
      }
      // A timeout/5xx may occur AFTER commit. Keep the same token and immutable payload.
      const outcomeUnknown = response?.success !== false || error?.status >= 500;
      if (creating && outcomeUnknown) setUncertain(true);
      if (creating && !outcomeUnknown) dropIntent();
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
      onClose={cancel}
      icon={<IconDepartment2 />}
      title={formState.id ? "Editar condominio" : "Crear condominio"}
      subtitle="Completa el formulario para crear un nuevo condominio"
      onSave={_onSave}
      disabled={isSaving}
      buttonText={isSaving ? "Guardando…" : uncertain ? "Reintentar y verificar" : "Guardar"}
      buttonCancel={isSaving ? "" : uncertain ? "Descartar" : "Cancelar"}
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
