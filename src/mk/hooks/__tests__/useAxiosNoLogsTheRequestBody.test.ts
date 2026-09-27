import { describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import React from "react";
import { AxiosContext } from "../../contexts/AxiosInstanceProvider";
import { logError } from "../../utils/logs";
import useAxios from "../useAxios";

vi.mock("../../utils/logs", () => ({ logError: vi.fn(), log: vi.fn(), logInfo: vi.fn(), logWaning: vi.fn() }));

/**
 * 🔴 Un login fallido no deja la contraseña en la consola: `useAxios` loguea
 * `errorForTheConsole(err)`, nunca el error de axios con su `config.data`.
 */
describe("useAxios ante un pedido que falla", () => {
  it("no manda el cuerpo del pedido a la consola", async () => {
    const body = JSON.stringify({ email: "a@b.c", password: "secreta" });
    const instance = {
      request: vi.fn().mockRejectedValue({
        message: "Request failed with status code 401",
        config: { url: "/v3/adm-login", data: body },
        response: { status: 401, data: { success: false } },
      }),
    };
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        AxiosContext.Provider,
        { value: { contextInstance: instance, waiting: 0, setWaiting: () => {} } as any },
        children,
      );

    const { result } = renderHook(() => useAxios(), { wrapper });
    await act(async () => {
      await result.current.execute("/v3/adm-login", "POST", { email: "a@b.c", password: "secreta" });
    });

    expect(logError).toHaveBeenCalled();
    expect(JSON.stringify(vi.mocked(logError).mock.calls)).not.toContain("secreta");
  });
});
