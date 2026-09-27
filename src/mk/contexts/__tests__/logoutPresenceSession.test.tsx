/**
 * El logout manda `presence_session_id`: con él el API
 * (`LoginBaseController::logout` → `PresenceSessionService::closeForLogout`)
 * cierra la sesión de presencia como `logout` y no por inactividad horas después.
 */
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.unmock("@/mk/contexts/AuthProvider");

const execute = vi.fn();

vi.mock("../../hooks/useAxios", () => ({
  default: () => ({ error: "", loaded: true, execute, waiting: 0, setWaiting: vi.fn() }),
}));
vi.mock("../../components/auth/Login", () => ({ default: () => <div>login</div> }));
vi.mock("../../../components/req/Splash", () => ({ default: () => null }));
vi.mock("../../components/ui/Toast/ToastViewport", () => ({ default: () => null }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

import AuthProvider, { useAuth } from "../AuthProvider";
import { CLAVE_DEL_TOKEN } from "@/mk/utils/claveDelToken";
import { setPresenceSessionId } from "@/mk/monitoring/presenceSessionState";

const SESSION_ID = "11111111-1111-4111-8111-111111111111";

const LogoutButton = () => {
  const { logout } = useAuth();
  return <button onClick={() => logout()}>salir</button>;
};

describe("AuthProvider.logout", () => {
  it("manda la sesión de presencia en curso", async () => {
    localStorage.setItem(CLAVE_DEL_TOKEN, JSON.stringify({ token: "t", user: { id: 1 } }));
    execute.mockResolvedValue({
      data: { success: true, data: { user: { id: 1, client_id: "c1" } } },
    });
    setPresenceSessionId(SESSION_ID);

    render(
      <AuthProvider>
        <LogoutButton />
      </AuthProvider>,
    );
    fireEvent.click(await screen.findByRole("button", { name: "salir" }));

    await waitFor(() =>
      expect(execute).toHaveBeenCalledWith(
        process.env.NEXT_PUBLIC_AUTH_LOGOUT,
        "POST",
        { presence_session_id: SESSION_ID },
      ),
    );
  });
});
