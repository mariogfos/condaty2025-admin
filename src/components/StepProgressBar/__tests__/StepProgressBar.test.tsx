import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import StepProgressBar from "../StepProgressBar";

describe("Pasos del formulario", () => {
  it("permite volver y evita saltarse pasos pendientes", () => {
    const change = vi.fn();
    render(<StepProgressBar currentStep={2} totalSteps={3} steps={["Deudas", "Pago", "Confirmar"]} onStepChange={change} />);
    expect(screen.getByRole("button", { name: "Confirmar" })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Pago/ })).toHaveAttribute("aria-current", "step");
    fireEvent.click(screen.getByRole("button", { name: "Deudas" }));
    expect(change).toHaveBeenCalledWith(1);
  });
  it("conserva la barra existente si no se proporcionan pasos", () => {
    render(<StepProgressBar currentStep={2} totalSteps={3} />);
    expect(screen.getByText("2 de 3 pasos")).toBeInTheDocument();
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });
});
