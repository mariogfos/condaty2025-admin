import React from "react";
import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import RenderForm from "../RenderForm/RenderForm";

const mockChangeInput = vi.fn();
const mockSavePago = vi.fn();

vi.mock("../hooks/usePaymentsForm", () => ({
  usePaymentsForm: () => ({
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
  }),
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
  });

  it("renderiza todos los campos principales del formulario", () => {
    render(<RenderForm {...defaultProps} />);
    expect(screen.getByLabelText(/seleccionar fecha/i)).toBeInTheDocument();
    expect(screen.getByText("Seleccionar Unidad")).toBeInTheDocument();
    expect(screen.getByText("Tipo")).toBeInTheDocument();
  });
});
