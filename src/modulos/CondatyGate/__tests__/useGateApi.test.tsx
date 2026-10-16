import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import useGateApi, { gateRequestScope } from "../useGateApi";

const mocks = vi.hoisted(() => ({
  execute: vi.fn(),
  user: { client_id: "selected-a", fosrole_id: "fos" } as { client_id?: string; fosrole_id: string | null },
}));
vi.mock("@/mk/contexts/AuthProvider", () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock("@/mk/hooks/useAxios", () => ({ default: () => ({ execute: mocks.execute }) }));

beforeEach(() => {
  mocks.execute.mockReset();
  mocks.user = { client_id: "selected-a", fosrole_id: "fos" };
});

describe("Gate condominium scope", () => {
  it("uses the selected FOS condominium in reads and writes after switching", async () => {
    const hook = renderHook(() => useGateApi());
    await act(async () => { await hook.result.current.execute("/gate-plugin", "GET"); });
    expect(mocks.execute).toHaveBeenLastCalledWith("/gate-plugin", "GET", { operfos: 1, client_id: "selected-a" }, false, false);
    mocks.user = { client_id: "selected-b", fosrole_id: "fos" };
    hook.rerender();
    await act(async () => { await hook.result.current.execute("/gate-plugin/preview", "POST", { entity_id: "target", client_id: "stale-a" }); });
    expect(mocks.execute).toHaveBeenLastCalledWith("/gate-plugin/preview", "POST", { entity_id: "target", operfos: 1, client_id: "selected-b" }, false, false);
  });

  it("never sends a FOS request without a selected source", () => {
    expect(() => gateRequestScope({ fosrole_id: "fos" })).toThrow("Selecciona el condominio de origen");
    expect(gateRequestScope({ client_id: "member-client", fosrole_id: null })).toEqual({});
  });
});
