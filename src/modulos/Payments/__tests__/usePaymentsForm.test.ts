import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { usePaymentsForm } from "../hooks/usePaymentsForm";
import { FormPaymentType, PaymentMethod } from "../Type/PaymentType";
import { paymentsApi } from "../api";

const mockExecute = vi.fn();
const mockShowToast = vi.fn();
const mockReLoad = vi.fn();
const mockOnClose = vi.fn();

vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({
    store: { Unitstype: null },
  }),
}));

describe("usePaymentsForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("postea pagos directos con el helper v3 y enums numéricos canónicos", async () => {
    mockExecute.mockResolvedValueOnce({
      data: { success: true, data: "payment-1" },
    });

    const props = {
      item: {
        paid_at: "2026-06-14",
        type: FormPaymentType.DIRECT,
        dpto_id: "101",
        category_id: 10,
        subcategory_id: 11,
        method: PaymentMethod.CASH,
        amount: 125.5,
        obs: "Pago directo",
        owner_id: 42,
        url_file: [],
        voucher: "",
      },
      extraData: {
        dptos: [],
        categories: [
          {
            id: 10,
            name: "Administración",
            fixed: "N",
            bank_account_id: 55,
            hijos: [
              {
                id: 11,
                name: "Servicios",
                fixed: "N",
                bank_account_id: 66,
              },
            ],
          },
        ],
        client_config: {
          cat_expensas: 100,
          cat_reservations: 200,
          cat_forgiveness: 300,
        },
        bankAccounts: [],
        subcategories: [],
      },
      execute: mockExecute,
      showToast: mockShowToast,
      reLoad: mockReLoad,
      onClose: mockOnClose,
    } as any;

    const { result } = renderHook(() => usePaymentsForm(props, true));

    await waitFor(() => {
      expect(result.current.formState.subcategories).toHaveLength(1);
    });

    await act(async () => {
      result.current.handleChangeInput({
        target: { name: "type", value: FormPaymentType.DIRECT, type: "text" },
      } as any);
      result.current.handleChangeInput({
        target: { name: "dpto_id", value: "101", type: "text" },
      } as any);
      result.current.handleChangeInput({
        target: { name: "method", value: PaymentMethod.CASH, type: "text" },
      } as any);
      result.current.handleChangeInput({
        target: { name: "amount", value: 125.5, type: "number" },
      } as any);
      result.current.handleChangeInput({
        target: { name: "paid_at", value: "2026-06-14", type: "date" },
      } as any);
      result.current.handleChangeInput({
        target: { name: "category_id", value: 10, type: "text" },
      } as any);
      result.current.handleChangeInput({
        target: { name: "subcategory_id", value: 11, type: "text" },
      } as any);
    });

    await act(async () => {
      await result.current._onSavePago();
    });

    expect(mockExecute).toHaveBeenCalledWith(
      paymentsApi.create,
      "POST",
      expect.objectContaining({
        paid_at: "2026-06-14",
        method: Number(PaymentMethod.CASH),
        amount: 125.5,
        bank_account_id: 66,
        debt_dpto_ids: [],
      })
    );
    expect(mockShowToast).toHaveBeenCalledWith(
      "Pago agregado con éxito",
      "success"
    );
    expect(mockReLoad).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  const makeExpenseProps = (overrides: any = {}) => ({
    item: {
      paid_at: "2026-06-24",
      type: FormPaymentType.EXPENSE,
      dpto_id: "101",
      method: String(PaymentMethod.CASH),
      amount: "",
    },
    extraData: {
      dptos: [{ id: 5, nro: "101", description: "Dpto 101", homeowner: { id: 9, name: "Mario" } }],
      categories: [],
      client_config: { cat_expensas: 100, cat_reservations: 200, cat_forgiveness: 300 },
      bankAccounts: [{ id: 7, is_expense: 1 }],
      subcategories: [],
    },
    execute: mockExecute,
    showToast: mockShowToast,
    reLoad: mockReLoad,
    onClose: mockOnClose,
    ...overrides,
  });

  const makeSimulateExecute = (simulateResponse: any) =>
    vi.fn().mockImplementation((url: string) => {
      if (url === paymentsApi.simulate) {
        return Promise.resolve({ data: { success: true, data: simulateResponse } });
      }
      // adminDebts or anything else
      return Promise.resolve({ data: { success: true, data: { deudas: [] } } });
    });

  it("simulate: llama paymentsApi.simulate al hacer onBlur en amount", async () => {
    const localExecute = makeSimulateExecute({ is_overpayment: false, payment_is_partial: false, items: [] });
    const props = makeExpenseProps({ execute: localExecute }) as any;
    const { result } = renderHook(() => usePaymentsForm(props, true));

    await act(async () => {
      result.current.handleChangeInput({ target: { name: "amount", value: "100", type: "text" } } as any);
    });
    await act(async () => {
      result.current.handleSelectPeriodo({ id: 1, amount: 100 } as any);
    });
    await act(async () => {
      await result.current.handleAmountBlur();
    });

    const simulateCall = localExecute.mock.calls.find((c: any[]) => c[0] === paymentsApi.simulate);
    expect(simulateCall).toBeDefined();
  });

  it("simulate: is_overpayment establece simulateError e isSubmitDisabled", async () => {
    const localExecute = makeSimulateExecute({ is_overpayment: true, payment_is_partial: false, items: [] });
    const props = makeExpenseProps({ execute: localExecute }) as any;
    const { result } = renderHook(() => usePaymentsForm(props, true));

    await act(async () => {
      result.current.handleChangeInput({ target: { name: "amount", value: "9999", type: "text" } } as any);
    });
    await act(async () => {
      result.current.handleSelectPeriodo({ id: 1, amount: 100 } as any);
    });
    await act(async () => {
      await result.current.handleAmountBlur();
    });

    await waitFor(() => {
      expect(result.current.simulateError).toBe("El monto supera la deuda total");
      expect(result.current.isSubmitDisabled).toBe(true);
    });
  });

  it("simulate: payment_is_partial guarda simulateResult con items", async () => {
    const mockItems = [{ debt_dpto_id: 1, applied_amount: 100, balance_before: 200, balance_after: 100, excluded: false }];
    const localExecute = makeSimulateExecute({ is_overpayment: false, payment_is_partial: true, items: mockItems });
    const props = makeExpenseProps({ execute: localExecute }) as any;
    const { result } = renderHook(() => usePaymentsForm(props, true));

    await act(async () => {
      result.current.handleChangeInput({ target: { name: "amount", value: "100", type: "text" } } as any);
    });
    await act(async () => {
      result.current.handleSelectPeriodo({ id: 1, amount: 200 } as any);
    });
    await act(async () => {
      await result.current.handleAmountBlur();
    });

    await waitFor(() => {
      expect(result.current.simulateResult?.payment_is_partial).toBe(true);
      expect(result.current.simulateResult?.items).toEqual(mockItems);
    });
  });

  it("submit: llama paymentsApi.create con payload unificado", async () => {
    const localExecute = vi.fn().mockResolvedValue({ data: { success: true } });

    const props = {
      item: {
        paid_at: "2026-06-24",
        type: FormPaymentType.DIRECT,
        dpto_id: "101",
        method: String(PaymentMethod.TRANSFER),
        amount: "150",
        category_id: 10,
        subcategory_id: 11,
        owner_id: 9,
        url_file: [],
      },
      extraData: {
        dptos: [{ id: 5, nro: "101", description: "Dpto 101", homeowner: { id: 9, name: "Mario" } }],
        categories: [
          { id: 10, name: "Admin", fixed: "N", bank_account_id: 55, hijos: [{ id: 11, name: "Servicios", fixed: "N", bank_account_id: 66 }] },
        ],
        client_config: { cat_expensas: 100, cat_reservations: 200, cat_forgiveness: 300 },
        bankAccounts: [],
        subcategories: [],
      },
      execute: localExecute,
      showToast: mockShowToast,
      reLoad: mockReLoad,
      onClose: mockOnClose,
    } as any;

    const { result } = renderHook(() => usePaymentsForm(props, true));

    await waitFor(() => {
      expect(result.current.formState.subcategories).toHaveLength(1);
    });

    await act(async () => {
      result.current.handleChangeInput({ target: { name: "type", value: FormPaymentType.DIRECT, type: "text" } } as any);
      result.current.handleChangeInput({ target: { name: "dpto_id", value: "101", type: "text" } } as any);
      result.current.handleChangeInput({ target: { name: "method", value: String(PaymentMethod.TRANSFER), type: "text" } } as any);
      result.current.handleChangeInput({ target: { name: "amount", value: "150", type: "text" } } as any);
      result.current.handleChangeInput({ target: { name: "paid_at", value: "2026-06-24", type: "date" } } as any);
      result.current.handleChangeInput({ target: { name: "category_id", value: 10, type: "text" } } as any);
      result.current.handleChangeInput({ target: { name: "subcategory_id", value: 11, type: "text" } } as any);
    });

    await act(async () => {
      await result.current._onSavePago();
    });

    const createCall = localExecute.mock.calls.find((c: any[]) => c[0] === paymentsApi.create);
    expect(createCall).toBeDefined();
    const payload = createCall![2];
    expect(typeof payload.dpto_id).toBe("number");
    expect(Array.isArray(payload.debt_dpto_ids)).toBe(true);
    expect(payload.debt_dpto_ids.every((id: any) => typeof id === "number")).toBe(true);
    expect(typeof payload.method).toBe("number");
  });
});