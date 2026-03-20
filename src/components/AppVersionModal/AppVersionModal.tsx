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
      console.log('AppVersion PUT payload', payload);
      // include token fallback header in case interceptors haven't attached token yet
      let axiosConfig: any = {};
      try {
        const apiToken = JSON.parse(
          (localStorage.getItem((process.env.NEXT_PUBLIC_AUTH_IAM as string) + 'token') as string) || 'null'
        )?.token;
        if (apiToken) axiosConfig = { headers: { Authorization: 'Bearer ' + apiToken } };
      } catch (e) {
        axiosConfig = {};
      }
      const res: any = await execute('/app-version', 'PUT', payload, false, false, axiosConfig);
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
            </div>
          </form>
        )}
    </NewModal>
  );
};

export default AppVersionModal;
