"use client";

import { useState } from "react";
import { Copy, ShieldCheck } from "lucide-react";
import Button from "@/mk/components/forms/Button/Button";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import { actionLabels, dateLabel, type AuditEntry, type RequestLog } from "./types";
import styles from "./ApiIntegrations.module.css";

function JsonSection({ title, value }: { title: string; value: unknown }) {
  return <section className={styles.jsonSection}><h3>{title}</h3><pre>{JSON.stringify(value ?? {}, null, 2)}</pre></section>;
}

export function LogDetail({ item, loading, error, onClose }: { item: RequestLog | null; loading: boolean; error: string; onClose: () => void }) {
  return <DataModal open title="Detalle de llamada API" onClose={onClose} buttonText="" buttonCancel="Cerrar" maxWidth={960}>
    {loading ? <p role="status">Cargando llamada…</p> : error ? <p className={styles.error} role="alert">{error}</p> : item ? <div className={styles.detail}>
      <div className={styles.summary}><span className={styles.httpCode}>{item.status}</span><strong>{item.method} {item.path}</strong>
        <span>{item.duration_ms} ms · {dateLabel(item.created_at)}</span></div>
      <p className={styles.helper}>ID de llamada: <code>{item.id}</code>{item.replayed ? " · Respuesta recuperada de un intento anterior, sin repetir la operación." : ""}</p>
      <p className={styles.notice}><ShieldCheck size={16} />Datos sensibles ocultos; las secciones grandes pueden estar truncadas.</p>
      <JsonSection title="Filtros y parámetros" value={item.query} />
      <JsonSection title="Payload enviado" value={item.payload} />
      <JsonSection title="Respuesta recibida" value={item.response} />
    </div> : null}
  </DataModal>;
}

export function AuditDetail({ item, onClose }: { item: AuditEntry; onClose: () => void }) {
  return <DataModal open title={actionLabels[item.action] ?? item.action} onClose={onClose} buttonText="" buttonCancel="Cerrar" maxWidth={900}>
    <div className={styles.detail}><p>{item.actor_name} · {dateLabel(item.created_at)}</p><p>{item.reason || "Sin motivo"}</p>
      <p className={styles.helper}>{item.record_type} · {item.record_id}</p>
      <JsonSection title="Antes" value={item.before_state} /><JsonSection title="Después" value={item.after_state} />
      <JsonSection title="Correlación" value={item.metadata} /></div>
  </DataModal>;
}

export function CredentialDetail({ credential, webhookSecret, onClose }: { credential: string | null; webhookSecret?: string | null; onClose: () => void }) {
  const [notice, setNotice] = useState("");
  const copy = async (value: string, label: string) => {
    try { await navigator.clipboard.writeText(value); setNotice(`${label} copiado.`); }
    catch { setNotice("Selecciona y copia la credencial manualmente."); }
  };
  return <DataModal open title="Guarda la credencial" onClose={onClose} buttonText="" buttonCancel="Ya la guardé" maxWidth={720}>
    <div className={styles.detail}><p>Se muestra una sola vez. Guárdala en un gestor de contraseñas; no la pegues en chats, URLs ni archivos del repositorio.</p>
      {credential ? <><h3>Token API</h3><pre className={styles.credential}>{credential}</pre></> : null}
      {webhookSecret ? <><h3>Clave de firma del webhook</h3><pre className={styles.credential}>{webhookSecret}</pre>
        <p className={styles.helper}>Verifica X-Condaty-Signature con HMAC-SHA256 sobre timestamp + <code>.</code> + cuerpo recibido. Tolera reintentos y procesa cada cursor una sola vez.</p></> : null}
      {credential ? <Button variant="secondary" onClick={() => void copy(credential, "Token API")}><Copy size={16} /> Copiar token API</Button> : null}
      {webhookSecret ? <Button variant="secondary" onClick={() => void copy(webhookSecret, "Secreto de firma")}><Copy size={16} /> Copiar clave de firma</Button> : null}
      {notice ? <p role="status">{notice}</p> : null}<p className={styles.helper}>Usa la cabecera Authorization: Bearer. Ruta base: <code>/api/integrations/v1</code>.</p></div>
  </DataModal>;
}
