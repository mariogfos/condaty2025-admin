/**
 * El reporte de presencia del admin (producción 547edd3f) contra el contrato de
 * `POST /api/presence/session-events` (`PresenceSessionController` del API):
 * qué se manda, cuándo y qué NO se manda. El logout: `logoutPresenceSession.test.tsx`.
 */
import { waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  HEARTBEAT_MS,
  PRESENCE_EVENTS_URL,
  WebPresenceReporter,
  type PresenceEvent,
} from "../PresenceReporter";
import { getPresenceSessionId, setPresenceSessionId } from "../presenceSessionState";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

// Lo que valida el API por evento. Cualquier otra clave es de más.
const EVENT_KEYS = [
  "event_id",
  "session_id",
  "installation_id",
  "sequence",
  "type",
  "occurred_at",
  "active_seconds",
  "end_reason",
  "device",
];

const setVisibility = (state: "visible" | "hidden") => {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => state,
  });
  document.dispatchEvent(new Event("visibilitychange"));
};

const sentEvents = (post: ReturnType<typeof vi.fn>): PresenceEvent[] =>
  post.mock.calls.flatMap(([, body]) => (body as { events: PresenceEvent[] }).events);

describe("WebPresenceReporter", () => {
  beforeEach(() => {
    localStorage.clear();
    setPresenceSessionId(null);
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "visible",
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("started con el dispositivo, sólo las claves del contrato y ningún token", async () => {
    localStorage.setItem("condaty_admin_token", JSON.stringify({ token: "SECRETO" }));
    const post = vi.fn().mockResolvedValue({});
    const reporter = new WebPresenceReporter({ post }, "1:c1");

    await reporter.start();

    expect(post).toHaveBeenCalledTimes(1);
    const [url, body] = post.mock.calls[0];
    expect(url).toBe(PRESENCE_EVENTS_URL);
    expect(Object.keys(body)).toEqual(["events"]);

    const [started] = (body as { events: PresenceEvent[] }).events;
    expect(started.type).toBe("started");
    expect(started.sequence).toBe(1);
    expect(started.event_id).toMatch(UUID);
    expect(started.session_id).toMatch(UUID);
    expect(started.installation_id).toMatch(UUID);
    expect(started.device?.platform).toBe("web");
    expect(Object.keys(started).every((key) => EVENT_KEYS.includes(key))).toBe(true);
    expect(JSON.stringify(body)).not.toContain("SECRETO");

    // El logout la lee de acá.
    expect(getPresenceSessionId()).toBe(started.session_id);
    reporter.stop();
  });

  it("heartbeat con la pestaña visible, background al ocultarla, ended al parar", async () => {
    vi.useFakeTimers();
    const post = vi.fn().mockResolvedValue({});
    const reporter = new WebPresenceReporter({ post }, "1:c1");
    await reporter.start();

    await vi.advanceTimersByTimeAsync(HEARTBEAT_MS + 30_000);
    expect(sentEvents(post).map((e) => e.type)).toEqual(["started", "heartbeat"]);

    setVisibility("hidden");
    await vi.advanceTimersByTimeAsync(0);
    // Oculta no late: el siguiente heartbeat no sale.
    await vi.advanceTimersByTimeAsync(HEARTBEAT_MS * 3);
    expect(sentEvents(post).map((e) => e.type)).toEqual([
      "started",
      "heartbeat",
      "background",
    ]);

    reporter.stop();
    await vi.advanceTimersByTimeAsync(0);
    const last = sentEvents(post).at(-1);
    expect(last).toMatchObject({ type: "ended", end_reason: "context_changed" });
    expect(getPresenceSessionId()).toBeNull();
  });

  it("un 422 descarta el lote; un error de red lo deja en la cola", async () => {
    const post = vi
      .fn()
      .mockRejectedValueOnce({ response: { status: 422 } })
      .mockRejectedValueOnce(new Error("Network Error"))
      .mockResolvedValue({});
    const reporter = new WebPresenceReporter({ post }, "1:c1");
    await reporter.start(); // started → 422, descartado

    setVisibility("hidden"); // background → red caída, queda
    await waitFor(() => expect(post).toHaveBeenCalledTimes(2));

    window.dispatchEvent(new Event("online")); // reintenta lo que quedó
    await waitFor(() => expect(post).toHaveBeenCalledTimes(3));
    const retried = (post.mock.calls[2][1] as { events: PresenceEvent[] }).events;
    expect(retried.map((e) => e.type)).toEqual(["background"]);
    reporter.stop();
  });
});
