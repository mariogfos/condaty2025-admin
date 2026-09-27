"use client";

import { useContext, useEffect } from "react";
import { UAParser } from "ua-parser-js";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { AxiosContext } from "@/mk/contexts/AxiosInstanceProvider";
import { setPresenceSessionId } from "./presenceSessionState";

/**
 * Reporta la presencia del administrador del condominio al monitoreo del
 * backoffice: `POST /api/presence/session-events` (módulo `PresenceMonitoring`
 * del API), el mismo contrato que `rnOwner` y `rnGuard`.
 *
 * - Transiciones: `started` (con el `device`), `foreground`, `background`,
 *   `heartbeat` cada 2 min (+ hasta 30 s de jitter, sólo con la pestaña
 *   visible) y `ended`. Tras 15 min en segundo plano, volver abre otra sesión.
 * - Cola en `localStorage` por usuario y condominio, lotes de hasta 20 (el
 *   máximo que valida el API). 401/403/404/422 descartan el lote: reintentar
 *   no lo arregla. Un error de red lo deja para el próximo intento.
 * - 🔴 El cuerpo lleva sólo identificadores aleatorios, tiempos y el
 *   navegador. Nunca el token ni credenciales: la sesión viaja en el header.
 * - Un FOS (backoffice) no se reporta: es quien mira el tablero.
 *
 * La telemetría nunca puede romper la navegación: todo fallo se traga.
 */

type PresenceEventType =
  | "started"
  | "foreground"
  | "background"
  | "heartbeat"
  | "ended";

type EndReason = "idle_rollover" | "context_changed" | "client_ended";

type DeviceSnapshot = {
  platform: string;
  os_name: string;
  os_version: string;
  manufacturer: string;
  model: string;
  device_name: string;
  browser_name: string;
  browser_version: string;
  app_version: string;
  app_build: string;
  locale: string;
  timezone: string;
};

export type PresenceEvent = {
  event_id: string;
  session_id: string;
  installation_id: string;
  sequence: number;
  type: PresenceEventType;
  occurred_at: string;
  active_seconds: number;
  end_reason?: EndReason;
  device?: DeviceSnapshot;
};

type PresenceHttpClient = {
  post: (url: string, body: unknown, config?: unknown) => Promise<unknown>;
};

export const PRESENCE_EVENTS_URL = "/presence/session-events";
const INSTALLATION_KEY = "condaty_presence_installation_v1";
const QUEUE_KEY = "condaty_presence_events_v1";
export const HEARTBEAT_MS = 2 * 60_000;
const MAX_JITTER_MS = 30_000;
const SESSION_IDLE_MS = 15 * 60_000;
const MAX_QUEUE_SIZE = 50;
const MAX_BATCH_SIZE = 20;
const DISCARD_STATUSES = [401, 403, 404, 422];

const randomUuid = (): string => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (value) => value.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex
    .slice(6, 8)
    .join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10).join("")}`;
};

// El almacenamiento puede no estar (ventana privada, bloqueado): sin él la
// cola vive sólo en memoria y se pierde al cerrar, que es aceptable.
const readStorage = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeStorage = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Sin almacenamiento no hay cola persistente; el evento se intenta igual.
  }
};

const getDeviceSnapshot = (): DeviceSnapshot => {
  const parsed = new UAParser(navigator.userAgent).getResult();
  let locale = navigator.language || "";
  let timezone = "";
  try {
    const intl = Intl.DateTimeFormat().resolvedOptions();
    locale = intl.locale || locale;
    timezone = intl.timeZone || "";
  } catch {
    // Sin Intl se reporta sin zona.
  }
  return {
    platform: "web",
    os_name: parsed.os.name || "Web",
    os_version: parsed.os.version || "",
    manufacturer: parsed.device.vendor || "",
    model: parsed.device.model || "",
    device_name: "",
    browser_name: parsed.browser.name || "Navegador",
    browser_version: parsed.browser.version || "",
    app_version: process.env.NEXT_PUBLIC_APP_VERSION || "web",
    app_build:
      process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 12) || "local",
    locale,
    timezone,
  };
};

export class WebPresenceReporter {
  private activeStartedAt: number | null = null;
  private activeMilliseconds = 0;
  private readonly device = getDeviceSnapshot();
  private heartbeat: number | null = null;
  private inactiveSince: number | null = null;
  private installationId = "";
  private operation: Promise<void> = Promise.resolve();
  private sequence = 0;
  private sessionId = randomUuid();
  private stopped = false;
  private readonly storageKey: string;
  private memoryQueue: PresenceEvent[] = [];

  constructor(
    private readonly http: PresenceHttpClient,
    identityKey: string,
  ) {
    this.storageKey = `${QUEUE_KEY}:${identityKey}`;
  }

  async start() {
    this.installationId = this.getInstallationId();
    setPresenceSessionId(this.sessionId);
    if (document.visibilityState === "visible") {
      this.activeStartedAt = Date.now();
    } else {
      this.inactiveSince = Date.now();
    }
    await this.enqueue("started");
    if (document.visibilityState !== "visible") await this.enqueue("background");
    document.addEventListener("visibilitychange", this.onVisibilityChange);
    window.addEventListener("online", this.onOnline);
    window.addEventListener("pagehide", this.onPageHide);
    this.scheduleHeartbeat();
  }

  stop() {
    if (this.stopped) return;
    this.accountActiveTime();
    this.stopped = true;
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
    window.removeEventListener("online", this.onOnline);
    window.removeEventListener("pagehide", this.onPageHide);
    this.clearHeartbeat();
    if (this.installationId) void this.enqueue("ended", "context_changed");
    setPresenceSessionId(null);
  }

  private onVisibilityChange = () => {
    void this.handleVisibilityChange();
  };

  private onOnline = () => {
    void this.flush();
  };

  // Al cerrar la pestaña no hay tiempo para un POST: el `ended` queda en la
  // cola y sale en la próxima visita.
  private onPageHide = (event: PageTransitionEvent) => {
    if (this.stopped || event.persisted || !this.installationId) return;
    this.accountActiveTime();
    this.clearHeartbeat();
    this.persist(this.createEvent("ended", "client_ended"));
  };

  private async handleVisibilityChange() {
    if (this.stopped) return;
    const now = Date.now();
    if (document.visibilityState === "visible") {
      if (this.inactiveSince && now - this.inactiveSince >= SESSION_IDLE_MS) {
        await this.enqueue("ended", "idle_rollover", this.inactiveSince);
        this.sessionId = randomUuid();
        setPresenceSessionId(this.sessionId);
        this.sequence = 0;
        this.activeMilliseconds = 0;
        this.activeStartedAt = now;
        this.inactiveSince = null;
        await this.enqueue("started");
      } else {
        this.activeStartedAt = now;
        this.inactiveSince = null;
        await this.enqueue("foreground");
      }
      this.scheduleHeartbeat();
      return;
    }
    this.accountActiveTime(now);
    this.activeStartedAt = null;
    this.inactiveSince = now;
    this.clearHeartbeat();
    await this.enqueue("background");
  }

  private scheduleHeartbeat() {
    this.clearHeartbeat();
    if (this.stopped || document.visibilityState !== "visible") return;
    this.heartbeat = window.setTimeout(
      () => {
        void this.enqueue("heartbeat");
        this.scheduleHeartbeat();
      },
      HEARTBEAT_MS + Math.floor(Math.random() * MAX_JITTER_MS),
    );
  }

  private clearHeartbeat() {
    if (this.heartbeat !== null) window.clearTimeout(this.heartbeat);
    this.heartbeat = null;
  }

  /** Acumula el tramo visible en curso y, si sigue visible, abre otro. */
  private accountActiveTime(at = Date.now()) {
    if (this.activeStartedAt === null) return;
    this.activeMilliseconds += Math.max(0, at - this.activeStartedAt);
    this.activeStartedAt = at;
  }

  private activeSeconds() {
    const current =
      this.activeStartedAt === null
        ? 0
        : Math.max(0, Date.now() - this.activeStartedAt);
    return Math.floor((this.activeMilliseconds + current) / 1000);
  }

  private enqueue(
    type: PresenceEventType,
    endReason?: EndReason,
    occurredAt?: number,
  ) {
    const event = this.createEvent(type, endReason, occurredAt);
    this.operation = this.operation
      .then(() => {
        this.persist(event);
        return this.flush();
      })
      .catch(() => undefined);
    return this.operation;
  }

  private createEvent(
    type: PresenceEventType,
    endReason?: EndReason,
    occurredAt = Date.now(),
  ): PresenceEvent {
    return {
      event_id: randomUuid(),
      session_id: this.sessionId,
      installation_id: this.installationId,
      sequence: ++this.sequence,
      type,
      occurred_at: new Date(occurredAt).toISOString(),
      active_seconds: this.activeSeconds(),
      ...(type === "started" ? { device: this.device } : {}),
      
      ...(endReason ? { end_reason: endReason } : {}),
    };
  }

  /** Un solo `heartbeat` por sesión en la cola; si desborda, se tiran los viejos. */
  private persist(event: PresenceEvent) {
    let queue = this.readQueue();
    if (event.type === "heartbeat") {
      queue = queue.filter(
        (item) =>
          !(item.type === "heartbeat" && item.session_id === event.session_id),
      );
    }
    queue.push(event);
    if (queue.length > MAX_QUEUE_SIZE) {
      const transitions = queue.filter((item) => item.type !== "heartbeat");
      const latestHeartbeat = [...queue]
        .reverse()
        .find((item) => item.type === "heartbeat");
      queue = [
        ...transitions.slice(-(MAX_QUEUE_SIZE - 1)),
        ...(latestHeartbeat ? [latestHeartbeat] : []),
      ];
    }
    this.writeQueue(queue);
  }

  private async flush() {
    const batch = this.readQueue().slice(0, MAX_BATCH_SIZE);
    if (!batch.length) return;
    const done = new Set(batch.map((event) => event.event_id));
    try {
      await this.http.post(
        PRESENCE_EVENTS_URL,
        { events: batch },
        { timeout: 5000 },
      );
    } catch (error: unknown) {
      const status = Number(
        (error as { response?: { status?: number } })?.response?.status || 0,
      );
      if (!DISCARD_STATUSES.includes(status)) return;
    }
    this.writeQueue(
      this.readQueue().filter((event) => !done.has(event.event_id)),
    );
  }

  private readQueue(): PresenceEvent[] {
    const raw = readStorage(this.storageKey);
    if (raw === null) return [...this.memoryQueue];
    try {
      const stored = JSON.parse(raw);
      return Array.isArray(stored) ? stored : [];
    } catch {
      return [];
    }
  }

  private writeQueue(queue: PresenceEvent[]) {
    this.memoryQueue = queue;
    writeStorage(this.storageKey, JSON.stringify(queue));
  }

  private getInstallationId() {
    const existing = readStorage(INSTALLATION_KEY);
    if (existing) return existing;
    const created = randomUuid();
    writeStorage(INSTALLATION_KEY, created);
    return created;
  }
}

export default function PresenceReporter() {
  const { user } = useAuth();
  const { contextInstance } = useContext(AxiosContext);
  const identityKey =
    user?.id && user?.client_id && !user?.fosrole_id
      ? `${user.id}:${user.client_id}`
      : "";

  useEffect(() => {
    if (!identityKey || !contextInstance) return;
    // El `setTimeout(0)` absorbe el montar-desmontar-montar de StrictMode:
    // sin él, cada carga en desarrollo abriría y cerraría una sesión fantasma.
    let reporter: WebPresenceReporter | null = null;
    const startTimer = window.setTimeout(() => {
      reporter = new WebPresenceReporter(contextInstance, identityKey);
      void reporter.start().catch(() => reporter?.stop());
    }, 0);
    return () => {
      window.clearTimeout(startTimer);
      reporter?.stop();
    };
  }, [contextInstance, identityKey]);

  return null;
}
