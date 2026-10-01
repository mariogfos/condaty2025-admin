/**
 * `/create-reservas` reserva a nombre de la persona ELEGIDA en "Unidad y
 * persona", no del titular ni del propietario.
 *
 * Se renderiza la pantalla y se recorren los tres pasos: se mide el `owner_id`
 * que de verdad sale en el `GET /v3/reservations/calendar` y en el
 * `POST /v3/reservations`. Un pin de fuente no alcanzaba: seguía verde si el
 * POST mandaba `homeowner.id`.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const execute = vi.fn();

vi.mock("@/mk/hooks/useAxios", () => ({ default: () => ({ execute }) }));
vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({ showToast: vi.fn() }),
}));
// El Select real es un combo con buscador; acá basta un <select> nativo con
// el mismo contrato (`name`, `value`, `options` con `id`/`name`, `onChange`).
vi.mock("@/mk/components/forms/Select/Select", () => ({
  default: ({ label, name, value, options = [], onChange, optionLabel = "name", optionValue = "id" }: any) => (
    <select aria-label={label} name={name} value={value} onChange={onChange}>
      <option value="" />
      {options.map((option: any) => (
        <option key={option[optionValue]} value={option[optionValue]}>
          {option[optionLabel]}
        </option>
      ))}
    </select>
  ),
}));
// El Avatar real pide el ImageModalProvider; acá no aporta nada.
vi.mock("@/mk/components/ui/Avatar/Avatar", () => ({ Avatar: () => null }));
vi.mock("../CalendarPicker/CalendarPicker", () => ({
  default: ({ onDateChange }: any) => (
    <button type="button" onClick={() => onDateChange("2026-10-10")}>
      elegir fecha
    </button>
  ),
}));

import CreateReserva from "../CreateReserva";

const homeowner = {
  id: 11,
  name: "Ana",
  last_name: "Perez",
  dependientes: [{ owner_id: 33, owner: { id: 33, name: "Lucia", last_name: "Perez" } }],
};

const extraData = {
  areas: [
    {
      id: "7",
      title: "Churrasquera",
      status: 1,
      available_days: [],
      max_capacity: 10,
      price: 0,
      is_free: 1,
    },
  ],
  dptos: [
    {
      id: 5,
      nro: "5",
      description: "Unidad",
      defaulter: "X",
      titular: homeowner,
      homeowner,
      tenant: null,
    },
  ],
};

const calendarResponse = {
  data: {
    success: true,
    data: {
      reserved: [],
      maintenance: [],
      days: { 10: { available: ["10:00-12:00"], unavailable: [], maintenance: [] } },
    },
  },
};

describe("el alta desde /create-reservas", () => {
  beforeEach(() => {
    execute.mockReset();
    execute.mockImplementation(async (url: string) =>
      url === "/v3/reservations/calendar"
        ? calendarResponse
        : { data: { success: true, data: {} } },
    );
  });

  it("manda como owner_id a la dependiente elegida, en el calendario y en el POST", async () => {
    render(
      <CreateReserva
        extraData={extraData}
        setOpenList={vi.fn()}
        onClose={vi.fn()}
        reLoad={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText("Área social"), {
      target: { name: "area_social", value: "7" },
    });
    const personSelect = screen.getByLabelText("Unidad y persona");
    const lucia = screen.getByRole("option", { name: /Lucia Perez/ }) as HTMLOptionElement;
    fireEvent.change(personSelect, { target: { name: "unidad", value: lucia.value } });

    await waitFor(() =>
      expect(execute).toHaveBeenCalledWith(
        "/v3/reservations/calendar",
        "GET",
        expect.objectContaining({ owner_id: "33" }),
        false,
        true,
      ),
    );

    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    fireEvent.click(await screen.findByRole("button", { name: "elegir fecha" }));
    fireEvent.click(await screen.findByRole("button", { name: /10:00 a 12:00/ }));
    fireEvent.click(screen.getByRole("button", { name: "Aumentar cantidad" }));
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

    expect(await screen.findByText("Lucia Perez")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reservar" }));

    await waitFor(() =>
      expect(execute).toHaveBeenCalledWith(
        "/v3/reservations",
        "POST",
        expect.objectContaining({ owner_id: "33", dpto_id: 5 }),
        false,
        true,
      ),
    );
    const ownerIds = execute.mock.calls
      .filter(([, method]) => method === "POST" || method === "GET")
      .map(([, , params]) => params?.owner_id);
    expect(ownerIds.every((ownerId) => ownerId === "33")).toBe(true);
  });
});
