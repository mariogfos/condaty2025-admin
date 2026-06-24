import React from "react";
import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import RenderForm from "../RenderForm/RenderForm";

const mockChangeInput = vi.fn();
const mockSavePago = vi.fn();

const mockHookBase = {
  formState: {
    paid_at: "2026-06-14",
    dpto_id: "101",
    type: "E",
    method: "T",
    amount: "250.00",
    subcategories: [],
    obs: "",
  },
  setFormState: vi.fn(),
  errors: {},
  deudas: [],
  selectedPeriodo: [],
  periodoTotal: 0,
  isLoadingDeudas: false,
  lDptos: [{ id: "101", name: "Dpto 101 - Mario" }],
  filteredCategories: [],
  showCategoryFields: false,
  isDebtBasedPayment: true,
  handleChangeInput: mockChangeInput,
  handleSelectAllPeriodos: vi.fn(),
  handleSelectPeriodo: vi.fn(),
  _onSavePago: mockSavePago,
  isBankAccountSame: vi.fn(() => false),
  getSubtotal: vi.fn(() => 0),
  getConceptByType: vi.fn(() => ""),
  getDebtType: vi.fn(() => ""),
  simulateResult: null,
  isSimulating: false,
  simulateError: null,
  handleAmountBlur: vi.fn(),
  isSubmitDisabled: false,
};

let mockHookOverrides: Partial<typeof mockHookBase> = {};

vi.mock("../hooks/usePaymentsForm", () => ({
  usePaymentsForm: () => ({ ...mockHookBase, ...mockHookOverrides }),
}));

describe("RenderForm Component", () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    extraData: {
      dptos: [],
      categories: [],
      client_config: { cat_expensas: 1, cat_reservations: 2, cat_forgiveness: 3 },
      bankAccounts: [],
      subcategories: [],
    },
    execute: vi.fn(),
    showToast: vi.fn(),
    reLoad: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockHookOverrides = {};
  });

  it("renderiza todos los campos principales del formulario", () => {
    render(<RenderForm {...defaultProps} />);
    expect(screen.getByLabelText(/seleccionar fecha/i)).toBeInTheDocument();
    expect(screen.getByText("Seleccionar Unidad")).toBeInTheDocument();
    expect(screen.getByText("Tipo")).toBeInTheDocument();
  });

  it('muestra "Calculando..." cuando isSimulating es true', () => {
    mockHookOverrides = { isSimulating: true };
    render(<RenderForm {...defaultProps} />);
    expect(screen.getByText("Calculando...")).toBeInTheDocument();
  });

  it("muestra error inline cuando simulateError tiene valor", () => {
    mockHookOverrides = { simulateError: "El monto supera la deuda total" };
    render(<RenderForm {...defaultProps} />);
    expect(screen.getByText("El monto supera la deuda total")).toBeInTheDocument();
  });

  it("muestra tabla de pago parcial cuando simulateResult.payment_is_partial === true", () => {
    mockHookOverrides = {
      simulateResult: {
        payment_is_partial: true,
        is_overpayment: false,
        items: [
          { debt_dpto_id: 1, applied_amount: 100, balance_before: 200, balance_after: 100, excluded: false },
        ],
      },
    };
    render(<RenderForm {...defaultProps} />);
    expect(screen.getByText("Pago parcial detectado")).toBeInTheDocument();
    expect(screen.getByText("Deuda ID")).toBeInTheDocument();
    expect(screen.getByText("Monto aplicado")).toBeInTheDocument();
  });
});
