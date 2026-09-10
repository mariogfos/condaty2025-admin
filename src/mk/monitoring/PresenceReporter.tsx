"use client";

import { useAuth } from "@/mk/contexts/AuthProvider";
import { AxiosContext } from "@/mk/contexts/AxiosInstanceProvider";
import { UAParser } from "ua-parser-js";
import { useContext, useEffect } from "react";
import { setPresenceSessionId } from "./presenceSessionState";

type PresenceEventType = "started" | "foreground" | "background" | "heartbeat" | "ended";

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

type PresenceEvent = {
  event_id: string;
  session_id: string;
  installation_id: string;
  sequence: number;
  type: PresenceEventType;
  occurred_at: string;
  active_seconds: number;
  end_reason?: "idle_rollover" | "context_changed" | "client_ended";
  device?: DeviceSnapshot;
};

const INSTALLATION_KEY = "condaty_presence_installation_v1";
const QUEUE_KEY = "condaty_presence_events_v1";
const HEARTBEAT_MS = 2 * 60_000;
const MAX_JITTER_MS = 30_000;
const SESSION_IDLE_MS = 15 * 60_000;
const MAX_QUEUE_SIZE = 50;

const randomUuid = () => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  const bytes = new Uint8Array(16);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (value) => value.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10).join("")}`;
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
    // La telemetría nunca debe afectar la navegación si Intl no está disponible.
  }
  return {
    platform: "web",
    os_name: parsed.os.name || navigator.platform || "Web",
    os_version: parsed.os.version || "",
    manufacturer: parsed.device.vendor || "",
    model: parsed.device.model || "",
    device_name: "",
    browser_name: parsed.browser.name || "Navegador",
    browser_version: parsed.browser.version || "",
    app_version: process.env.NEXT_PUBLIC_APP_VERSION || "web",
    app_build: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 12) || "local",
    locale,
    timezone,
  };
};

class WebPresenceReporter {
  private activeStartedAt: number | null = null;
  private activeMilliseconds = 0;
  private device = getDeviceSnapshot();
  private heartbeat: number | null = null;
  private inactiveSince: number | null = null;
  private installationId = "";
  private operation = Promise.resolve();
  private sequence = 0;
  private sessionId = randomUuid();
  private stopped = false;

  constructor(
    private readonly axiosInstance: any,
    private readonly identityKey: string,
  ) {}

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
    this.stopped = true;
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
    window.removeEventListener("online", this.onOnline);
    window.removeEventListener("pagehide", this.onPageHide);
    this.clearHeartbeat();
    this.accountActiveTime();
    if (this.installationId) void this.enqueue("ended", "context_changed");
    setPresenceSessionId(null);
  }

  private onVisibilityChange = () => {
    void this.handleVisibilityChange();
  };

  private onOnline = () => {
    void this.flushStoredQueue();
  };

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
    this.inactiveSince = now;
    this.clearHeartbeat();
    await this.enqueue("background");
  }

  private scheduleHeartbeat() {
    this.clearHeartbeat();
    if (this.stopped || document.visibilityState !== "visible") return;
    this.heartbeat = window.setTimeout(() => {
      void this.enqueue("heartbeat");
      this.scheduleHeartbeat();
    }, HEARTBEAT_MS + Math.floor(Math.random() * MAX_JITTER_MS));
  }

  private clearHeartbeat() {
    if (this.heartbeat) window.clearTimeout(this.heartbeat);
    this.heartbeat = null;
  }

  private accountActiveTime(at = Date.now()) {
    if (this.activeStartedAt === null) return;
    this.activeMilliseconds += Math.max(0, at - this.activeStartedAt);
    this.activeStartedAt = document.visibilityState === "visible" && !this.stopped ? at : null;
  }

  private activeSeconds() {
    const current = this.activeStartedAt === null ? 0 : Math.max(0, Date.now() - this.activeStartedAt);
    return Math.floor((this.activeMilliseconds + current) / 1000);
  }

  private enqueue(type: PresenceEventType, endReason?: PresenceEvent["end_reason"], occurredAt?: number) {
    const event = this.createEvent(type, endReason, occurredAt);
    this.operation = this.operation.then(() => this.persistAndFlush(event)).catch(() => undefined);
    return this.operation;
  }

  private createEvent(
    type: PresenceEventType,
    endReason?: PresenceEvent["end_reason"],
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

  private async persistAndFlush(event: PresenceEvent) {
    const storageKey = this.persist(event);
    await this.flush(storageKey, this.readQueue(storageKey));
  }

  private persist(event: PresenceEvent): string {
    const storageKey = `${QUEUE_KEY}:${this.identityKey}`;
    let queue = this.readQueue(storageKey);
    if (event.type === "heartbeat") {
      queue = queue.filter((item) => !(item.type === "heartbeat" && item.session_id === event.session_id));
    }
    queue.push(event);
    if (queue.length > MAX_QUEUE_SIZE) {
      const transitions = queue.filter((item) => item.type !== "heartbeat");
      const latestHeartbeat = [...queue].reverse().find((item) => item.type === "heartbeat");
      queue = [...transitions.slice(-(MAX_QUEUE_SIZE - 1)), ...(latestHeartbeat ? [latestHeartbeat] : [])];
    }
    localStorage.setItem(storageKey, JSON.stringify(queue));
    return storageKey;
  }

  private async flushStoredQueue() {
    const storageKey = `${QUEUE_KEY}:${this.identityKey}`;
    await this.flush(storageKey, this.readQueue(storageKey));
  }

  private async flush(storageKey: string, queue: PresenceEvent[]) {
    const batch = queue.slice(0, 20);
    if (!batch.length) return;
    try {
      await this.axiosInstance.post("/presence/session-events", { events: batch }, { timeout: 5000 });
      const sent = new Set(batch.map((event) => event.event_id));
      localStorage.setItem(storageKey, JSON.stringify(this.readQueue(storageKey).filter((event) => !sent.has(event.event_id))));
    } catch (error: any) {
      const status = Number(error?.response?.status || 0);
      if ([401, 403, 404, 422].includes(status)) {
        const rejected = new Set(batch.map((event) => event.event_id));
        localStorage.setItem(storageKey, JSON.stringify(this.readQueue(storageKey).filter((event) => !rejected.has(event.event_id))));
      }
    }
  }

  private readQueue(storageKey: string): PresenceEvent[] {
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) || "[]");
      return Array.isArray(stored) ? stored : [];
    } catch {
      return [];
    }
  }

  private getInstallationId() {
    const existing = localStorage.getItem(INSTALLATION_KEY);
    if (existing) return existing;
    const created = randomUuid();
    localStorage.setItem(INSTALLATION_KEY, created);
    return created;
  }
}

export default function PresenceReporter() {
  const { user } = useAuth();
  const { contextInstance } = useContext(AxiosContext);
  const identityKey = user?.id && user?.client_id && !user?.fosrole_id
    ? `${user.id}:${user.client_id}`
    : "";

  useEffect(() => {
    if (!identityKey || !contextInstance) return;
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
