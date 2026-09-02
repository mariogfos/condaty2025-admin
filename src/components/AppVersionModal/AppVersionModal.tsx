"use client";
import React, { useEffect, useState } from "react";
import modalStyles from "./appVersionModal.module.css";
import formStyles from '@/modulos/Payments/RenderForm/RenderForm.module.css';
import { IconX } from '@/components/layout/icons/IconsBiblioteca';
import Input from '@/mk/components/forms/Input/Input';
import useAxios from '@/mk/hooks/useAxios';
import NewModal from '@/mk/components/ui/NewModal/NewModal';
import { useRouter } from "next/navigation";

type AppVersionResponse = {
  owner?: any;
  guard?: any;
};

export const AppVersionModal: React.FC = () => {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<AppVersionResponse>({});
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    if (!open) router.back();
  }, [open, router]);

  const { execute } = useAxios(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res: any = await execute('/app-version', 'GET', {}, true, false);
        if (res.error) {
          console.error('AppVersion GET error', res.error);
        } else {
          const json = res.data;
          setData(json);
          setForm({
            min_version_android: json?.owner?.min_version?.android || '',
            min_version_ios: json?.owner?.min_version?.ios || '',
            update_url_android: json?.owner?.update_url?.android || '',
            update_url_ios: json?.owner?.update_url?.ios || '',
            min_version_android_guard: json?.guard?.min_version?.android || '',
            min_version_ios_guard: json?.guard?.min_version?.ios || '',
            update_url_android_guard: json?.guard?.update_url?.android || '',
            update_url_ios_guard: json?.guard?.update_url?.ios || '',
            // ⚠️ La forma de ida y la de vuelta NO son la misma: el GET los
            // entrega anidados en `support`, y el PUT los toma planos con el
            // prefijo `support_`. Se mapea acá, en el único lugar que ve las
            // dos puntas.
            support_whatsapp_phone: json?.support?.whatsapp_phone || '',
            support_whatsapp_message: json?.support?.whatsapp_message || '',
          });
        }
      } catch (err) {
        console.error('AppVersion load error', err);
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = () => setOpen(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };

      // 🔴 Acá había un bloque que armaba `axiosConfig` con el header
      // `Authorization` y lo pasaba como SEXTO argumento de `execute` — que
      // recibe CINCO. El argumento se descartaba: el header nunca viajó.
      //
      // Y tampoco hacía falta. El interceptor de peticiones
      // (`mk/interceptors/axiosInterceptors.tsx`) lee la misma clave del
      // localStorage y pone el mismo header en TODAS las peticiones. Era una
      // copia del interceptor, muerta por partida doble.
      //
      // Lo destapó tipar `execute`: como estaba declarada `Function`,
      // TypeScript aceptaba cualquier cantidad de argumentos sin chistar.
      const res = await execute('/app-version', 'PUT', payload, false, false);
      if (res.error) {
        console.error('AppVersion PUT error', res.error);
        const detail = res.error.data || res.error.message || JSON.stringify(res.error);
        throw new Error(detail);
      }
      // close and go back
      setOpen(false);
    } catch (err: any) {
      console.error('AppVersion save error:', err);
      const detail = err?.message || String(err);
      alert('Error al guardar: ' + detail);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <NewModal
      open={open}
      onClose={() => handleClose()}
      onSave={() => handleSubmit()}
      title="Versiones de App"
      minWidth={780}
      maxWidth="calc(100% - 40px)"
    >
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <form onSubmit={handleSubmit} className={formStyles['income-form-container']}>
            <div className={formStyles.section}>
              <div className={formStyles['section-title']}>Owner (Residente)</div>

              <div className={formStyles['input-row']}>
                <div className={`${formStyles['input-half']} ${modalStyles.inputWrapper}`}>
                  <Input
                    name="min_version_android"
                    label="Min Android"
                    value={form.min_version_android || ''}
                    onChange={handleChange}
                    required={false}
                    styleInput={{ margin: '4px 0' }}
                  />
                </div>
                <div className={`${formStyles['input-half']} ${modalStyles.inputWrapper}`}>
                  <Input
                    name="min_version_ios"
                    label="Min iOS"
                    value={form.min_version_ios || ''}
                    onChange={handleChange}
                    required={false}
                    styleInput={{ margin: '4px 0' }}
                  />
                </div>
              </div>

              <div className={formStyles['input-row']}>
                <div className={`${formStyles['input-half']} ${modalStyles.inputWrapper}`}>
                  <Input
                    name="update_url_android"
                    label="Update URL Android"
                    value={form.update_url_android || ''}
                    onChange={handleChange}
                    required={false}
                    styleInput={{ margin: '4px 0' }}
                  />
                </div>
                <div className={`${formStyles['input-half']} ${modalStyles.inputWrapper}`}>
                  <Input
                    name="update_url_ios"
                    label="Update URL iOS"
                    value={form.update_url_ios || ''}
                    onChange={handleChange}
                    required={false}
                    styleInput={{ margin: '4px 0' }}
                  />
                </div>
              </div>
            </div>

            <div className={formStyles.section}>
              <div className={formStyles['section-title']}>Guard (Guardia)</div>

              <div className={formStyles['input-row']}>
                <div className={`${formStyles['input-half']} ${modalStyles.inputWrapper}`}>
                  <Input
                    name="min_version_android_guard"
                    label="Min Android"
                    value={form.min_version_android_guard || ''}
                    onChange={handleChange}
                    required={false}
                    styleInput={{ margin: '4px 0' }}
                  />
                </div>
                <div className={`${formStyles['input-half']} ${modalStyles.inputWrapper}`}>
                  <Input
                    name="min_version_ios_guard"
                    label="Min iOS"
                    value={form.min_version_ios_guard || ''}
                    onChange={handleChange}
                    required={false}
                    styleInput={{ margin: '4px 0' }}
                  />
                </div>
              </div>

              <div className={formStyles['input-row']}>
                <div className={formStyles['input-half']}>
                  <Input
                    name="update_url_android_guard"
                    label="Update URL Android"
                    value={form.update_url_android_guard || ''}
                    onChange={handleChange}
                    required={false}
                    styleInput={{ margin: '4px 0' }}
                  />
                </div>
                <div className={formStyles['input-half']}>
                  <Input
                    name="update_url_ios_guard"
                    label="Update URL iOS"
                    value={form.update_url_ios_guard || ''}
                    onChange={handleChange}
                    required={false}
                    styleInput={{ margin: '4px 0' }}
                  />
                </div>
              </div>

              {/*
                🔴 Estos dos campos NO EXISTÍAN en ninguna pantalla. El API los
                entrega y los acepta desde api#496 —`GET /app-version` los manda
                en `support`, `PUT` los valida y normaliza el teléfono— y la app
                de residentes los usa: el botón de ayuda de su login abre este
                WhatsApp con este mensaje.

                Sin pantalla que los escriba, el teléfono se quedaba en lo que
                hubiera en la base, sin forma de cambiarlo. Es la misma familia
                que `requires_membership` (#794), `can_receive_visits` (#796) y
                `has_membership` (#798) — y ésta la dejé yo al cerrar api#496.

                ⚠️ El nombre lleva el prefijo `support_` porque así los toma el
                PUT; el GET los devuelve anidados en `support`. Ver el mapeo del
                `load`.
              */}
              <div className={formStyles['input-row']}>
                <div className={formStyles['input-half']}>
                  <Input
                    name="support_whatsapp_phone"
                    label="WhatsApp de soporte"
                    value={form.support_whatsapp_phone || ''}
                    onChange={handleChange}
                    required={false}
                    styleInput={{ margin: '4px 0' }}
                  />
                </div>
                <div className={formStyles['input-half']}>
                  <Input
                    name="support_whatsapp_message"
                    label="Mensaje inicial del WhatsApp"
                    value={form.support_whatsapp_message || ''}
                    onChange={handleChange}
                    required={false}
                    styleInput={{ margin: '4px 0' }}
                  />
                </div>
              </div>
            </div>
          </form>
        )}
    </NewModal>
  );
};

export default AppVersionModal;
