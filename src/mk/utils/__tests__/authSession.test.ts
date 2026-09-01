import { beforeEach, describe, expect, it } from "vitest";
import {
  AUTH_SESSION_EXPIRED_MESSAGE,
  consumeAuthSessionMessage,
  rememberExpiredSession,
} from "../authSession";

describe("authSession", () => {
  beforeEach(() => sessionStorage.clear());

  it("conserva el motivo del cierre sólo hasta que Login lo consume", () => {
    rememberExpiredSession();

    expect(consumeAuthSessionMessage()).toBe(AUTH_SESSION_EXPIRED_MESSAGE);
    expect(consumeAuthSessionMessage()).toBeNull();
  });
});
