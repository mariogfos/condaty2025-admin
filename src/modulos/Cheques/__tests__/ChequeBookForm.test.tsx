import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ChequeBookForm from "../ChequeBookForm";

vi.mock("@/mk/components/ui/DataModal/DataModal", () => ({
  default: ({ children, open, onSave }: any) => open ? <div>{children}<button onClick={onSave}>Crear talonario</button></div> : null,
}));
vi.mock("@/mk/components/forms/Select/Select", () => ({
  default: ({ name, value, options, onChange }: any) => <select aria-label={name} name={name} value={value} onChange={onChange}>
    <option value="">Elegir</option>{options.map((option: any) => <option key={option.id} value={option.id}>{option.name}</option>)}
  </select>,
}));
vi.mock("@/mk/components/forms/Input/Input", () => ({
  default: ({ name, value, onChange }: any) => <input aria-label={name} name={name} value={value} onChange={onChange} />,
}));

describe("Alta de talonario", () => {
  it("calcula el rango y envía la cuenta y cantidad validadas", async () => {
    const execute = vi.fn().mockResolvedValue({ data: { success: true } });
    const reLoad = vi.fn();
    const getExtraData = vi.fn();
    render(<ChequeBookForm open onClose={vi.fn()} accounts={[{ id: 7, alias_holder: "Cuenta", account_number: "123" }]}
      execute={execute} reLoad={reLoad} getExtraData={getExtraData} showToast={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Crear talonario" }));
    expect(execute).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("bank_account_id"), { target: { value: "7" } });
    fireEvent.change(screen.getByLabelText("first_number"), { target: { value: "0008" } });
    fireEvent.change(screen.getByLabelText("cheque_count"), { target: { value: "3" } });
    expect(screen.getByText(/0008 al 0010/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Crear talonario" }));
    await waitFor(() => expect(execute).toHaveBeenCalledWith("/cheque-books", "POST", {
      bank_account_id: 7, name: null, first_number: "0008", cheque_count: 3,
    }, false, true));
    expect(reLoad).toHaveBeenCalled();
    expect(getExtraData).toHaveBeenCalled();
  });
});
