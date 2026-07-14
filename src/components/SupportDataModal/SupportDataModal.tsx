"use client";
import React, { useEffect, useState } from "react";
import modalStyles from "@/components/AppVersionModal/appVersionModal.module.css";
import formStyles from "@/modulos/Payments/RenderForm/RenderForm.module.css";
import Input from "@/mk/components/forms/Input/Input";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import useAxios from "@/mk/hooks/useAxios";
import NewModal from "@/mk/components/ui/NewModal/NewModal";
import { useRouter } from "next/navigation";

type SupportForm = {
  support_whatsapp_phone: string;
  support_whatsapp_message: string;
};

const initialForm: SupportForm = {
  support_whatsapp_phone: "",
  support_whatsapp_message: "",
};

const normalizeSupportPhone = (value: string) => {
  const trimmed = `${value || ""}`.trim();
  const digits = trimmed.replace(/\D/g, "");

  return trimmed.startsWith("+") && digits ? `+${digits}` : digits;
};

const SupportDataModal = () => {
  const router = useRouter();
  const { execute } = useAxios(null);
  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<SupportForm>(initialForm);

  useEffect(() => {
    if (!open) router.back();
  }, [open, router]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res: any = await execute("/app-version", "GET", {}, true, false);
        if (res.error) {
          console.error("Support data GET error", res.error);
          return;
        }

        const json = res.data;
        setForm({
          support_whatsapp_phone:
            json?.support?.whatsapp_phone || json?.support_whatsapp_phone || "",
          support_whatsapp_message:
            json?.support?.whatsapp_message ||
            json?.support_whatsapp_message ||
            "",
        });
      } catch (error) {
        console.error("Support data load error", error);
      } finally {
        setLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e?.preventDefault) e.preventDefault();

    setSaving(true);
    try {
      const payload = {
        support_whatsapp_phone: normalizeSupportPhone(
          form.support_whatsapp_phone,
        ),
        support_whatsapp_message: form.support_whatsapp_message.trim(),
      };
      const res: any = await execute("/app-version", "PUT", payload, false, false);

      if (res.error) {
        const detail = res.error.data || res.error.message || JSON.stringify(res.error);
        throw new Error(detail);
      }

      setOpen(false);
    } catch (error: any) {
      console.error("Support data save error", error);
      alert("Error al guardar: " + (error?.message || String(error)));
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <NewModal
      open={open}
      onClose={() => setOpen(false)}
      onSave={() => handleSubmit()}
      title="Datos de soporte"
      minWidth={640}
      maxWidth={760}
    >
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <form
          onSubmit={handleSubmit}
          className={formStyles["income-form-container"]}
        >
          <div className={formStyles.section}>
            <div className={formStyles["section-title"]}>
              WhatsApp de soporte
            </div>
            <p className={modalStyles.helperText}>
              Ingresa el numero completo con codigo de pais y celular juntos,
              por ejemplo 59177416858 o +59177416858.
            </p>
            <Input
              name="support_whatsapp_phone"
              label="Numero completo"
              value={form.support_whatsapp_phone}
              onChange={handleChange}
              required={false}
              maxLength={32}
              autoComplete="off"
              styleInput={{ margin: "4px 0" }}
            />
            <TextArea
              name="support_whatsapp_message"
              label="Mensaje inicial"
              value={form.support_whatsapp_message}
              onChange={handleChange}
              required={false}
              lines={5}
              isLimit
              maxLength={1000}
            />
            <div className={modalStyles.previewBox}>
              <div className={modalStyles.previewLabel}>
                Vista previa del mensaje
              </div>
              <div className={modalStyles.previewText}>
                {form.support_whatsapp_message || "Sin mensaje configurado"}
              </div>
            </div>
          </div>
        </form>
      )}
      {saving ? <p className={modalStyles.helperText}>Guardando...</p> : null}
    </NewModal>
  );
};

export default SupportDataModal;
