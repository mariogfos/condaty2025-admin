import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import FeaturesConfig from "../FeaturesConfig";

vi.mock("@/mk/components/forms/Switch/Switch", () => ({
  default: ({ checked, disabled, name, onChange }: any) => (
    <input
      aria-label={name}
      checked={checked}
      disabled={disabled}
      onChange={(event) =>
        onChange({ target: { name, value: event.target.checked ? "Y" : "N" } })
      }
      type="checkbox"
    />
  ),
}));

vi.mock("@/mk/components/forms/Select/Select", () => ({
  default: ({ disabled, name, onChange, options, value }: any) => (
    <select
      aria-label={name}
      disabled={disabled}
      onChange={onChange}
      value={value}
    >
      {options.map((option: any) => (
        <option key={option.id} value={option.id}>
          {option.name}
        </option>
      ))}
    </select>
  ),
}));

describe("Configuración de funcionalidades", () => {
  it("conserva los valores existentes y guarda solo las funcionalidades", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(
      <FeaturesConfig
        client_config={{
          has_tasks_visible: false,
          has_financial_data: true,
          has_financial_debt: true,
          financial_mode: 2,
          has_marketplace_visible: true,
          payment_time_limit: 24,
        }}
        onSave={onSave}
      />
    );

    expect(screen.getByLabelText("has_marketplace_visible")).toBeChecked();
    expect(screen.getByLabelText("financial_mode")).toHaveValue("2");
    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    fireEvent.click(screen.getByLabelText("has_marketplace_visible"));
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({
        has_tasks_visible: false,
        has_financial_data: true,
        has_financial_debt: true,
        financial_mode: 2,
        has_marketplace_visible: false,
      })
    );
  });

  it("mantiene Marketplace encendido si la API antigua no devuelve el campo", () => {
    render(<FeaturesConfig client_config={{}} onSave={vi.fn()} />);

    expect(screen.getByLabelText("has_marketplace_visible")).toBeChecked();
  });
});
