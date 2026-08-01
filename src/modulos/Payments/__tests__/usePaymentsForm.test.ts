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

  it("ordena deudas por year/month a nivel dpto (no via debt head)", async () => {
    const localExecute = vi.fn().mockImplementation((url: string) => {
      if (url === paymentsApi.adminDebts) {
        return Promise.resolve({
          data: {
            success: true,
            data: {
              deudas: [
                { id: "2", month: 6, year: 2024, debt: { month: 1, year: 2099 } },
                { id: "1", month: 3, year: 2024, debt: { month: 12, year: 2099 } },
              ],
            },
          },
        });
      }
      return Promise.resolve({ data: { success: true } });
    });

    const props = {
      item: {
        paid_at: "2026-06-25",
        type: FormPaymentType.EXPENSE,
        dpto_id: "101",
        method: String(PaymentMethod.CASH),
        amount: "",
      },
      extraData: {
        dptos: [{ id: 5, nro: "101", description: "Dpto 101", homeowner: { id: 9, name: "Mario" } }],
        categories: [],
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
      expect(result.current.deudas).toHaveLength(2);
    });

    // Sorted by dpto-level month/year: Mar 2024 (id=1) before Jun 2024 (id=2)
    // NOT by debt head 2099 values
    expect(result.current.deudas[0].id).toBe("1");
    expect(result.current.deudas[1].id).toBe("2");
  });

  it("getConceptByType devuelve periodo desde dpto-level para tipo 1 (EXPENSE)", () => {
    const props = makeExpenseProps() as any;
    const { result } = renderHook(() => usePaymentsForm(props, false));

    const periodo = { type: 1, month: 4, year: 2025, debt: { month: 99, year: 9999 }, shared: { month: 11, year: 2020 } } as any;
    const concept = result.current.getConceptByType(periodo);

    // dpto-level year used (2025), NOT debt head (9999)
    expect(concept).toContain("2025");
  });

  it("getConceptByType usa shared fallback para tipo 1 cuando dpto month/year son null (SHARED row)", () => {
    const props = makeExpenseProps() as any;
    const { result } = renderHook(() => usePaymentsForm(props, false));

    const periodo = { type: 1, month: null, year: null, shared: { month: 8, year: 2023 } } as any;
    const concept = result.current.getConceptByType(periodo);

    expect(concept).toContain("2023");
  });

  it("getConceptByType default no incluye debt.description", () => {
    const props = makeExpenseProps() as any;
    const { result } = renderHook(() => usePaymentsForm(props, false));

    const periodo = { type: 99, description: null, shared: { description: null }, debt: { description: "debe ignorarse" } } as any;
    const concept = result.current.getConceptByType(periodo);

    expect(concept).toBe("-/-");
  });

  // ============== S87 inline-create-expense (modal, multi) ==============

  it("S87-modal: addNewExpense agrega al array y actualiza amount con el total", () => {
    const props = makeExpenseProps({ amount: "100" }) as any;
    const { result } = renderHook(() => usePaymentsForm(props, true));

    let r: any;
    act(() => {
      r = result.current.addNewExpense({
        month: 8,
        year: 2026,
        description: "Pago adelantado",
        amount: 1500,
      });
    });

    expect(r.ok).toBe(true);
    expect(result.current.formState.newExpenses).toHaveLength(1);
    expect(result.current.formState.newExpenses?.[0]?.month).toBe(8);
    expect(result.current.formState.newExpenses?.[0]?.year).toBe(2026);
    expect(result.current.formState.newExpenses?.[0]?.amount).toBe(1500);
    // amount del form se auto-pinea con la suma de las virtuales
    expect(result.current.formState.amount).toBe("1500");
    expect(result.current.newExpensesTotal).toBe(1500);
  });

  it("S87-modal: addNewExpense permite N virtuales y suma al total", () => {
    const props = makeExpenseProps() as any;
    const { result } = renderHook(() => usePaymentsForm(props, true));

    act(() => {
      result.current.addNewExpense({ month: 8, year: 2026, description: "Ago", amount: 1000 });
    });
    act(() => {
      result.current.addNewExpense({ month: 9, year: 2026, description: "Sep", amount: 2000 });
    });
    act(() => {
      result.current.addNewExpense({ month: 10, year: 2026, description: "Oct", amount: 1500 });
    });

    expect(result.current.formState.newExpenses).toHaveLength(3);
    expect(result.current.newExpensesTotal).toBe(4500);
  });

  it("S87-modal: addNewExpense rechaza duplicado contra deudas pre-existentes", async () => {
    const localExecute = vi.fn().mockImplementation((url: string) => {
      if (url === paymentsApi.adminDebts) {
        return Promise.resolve({
          data: {
            success: true,
            data: {
              deudas: [{ id: "1", month: 7, year: 2026, amount: 1000, type: 1 }],
            },
          },
        });
      }
      return Promise.resolve({ data: { success: true } });
    });

    const props = makeExpenseProps({ execute: localExecute }) as any;
    const { result } = renderHook(() => usePaymentsForm(props, true));

    await waitFor(() => {
      expect(result.current.deudas).toHaveLength(1);
    });

    let r: any;
    act(() => {
      r = result.current.addNewExpense({
        month: 7,
        year: 2026,
        description: "Duplicado",
        amount: 1500,
      });
    });

    expect(r.ok).toBe(false);
    expect(r.error).toContain("Ya existe una deuda");
    expect(result.current.formState.newExpenses).toHaveLength(0);
  });

  it("S87-modal: addNewExpense rechaza duplicado entre virtuales del mismo mes/año", () => {
    const props = makeExpenseProps() as any;
    const { result } = renderHook(() => usePaymentsForm(props, true));

    act(() => {
      result.current.addNewExpense({ month: 8, year: 2026, description: "Ago 1", amount: 1000 });
    });
    let r2: any;
    act(() => {
      r2 = result.current.addNewExpense({ month: 8, year: 2026, description: "Ago 2", amount: 1500 });
    });
    expect(r2.ok).toBe(false);
    expect(r2.error).toContain("Ya creaste una expensa");
    // Solo quedó 1 en el array
    expect(result.current.formState.newExpenses).toHaveLength(1);
  });

  it("S87-modal: updateNewExpense edita por virtualId sin chocar consigo mismo", () => {
    const props = makeExpenseProps() as any;
    const { result } = renderHook(() => usePaymentsForm(props, true));

    let vid: any;
    act(() => {
      vid = result.current.addNewExpense({
        month: 8,
        year: 2026,
        description: "Original",
        amount: 1000,
      }).virtualId;
    });

    // Editar (mismo mes/año que la original) — NO debe rechazarse por sí misma
    let r: any;
    act(() => {
      r = result.current.updateNewExpense(vid, {
        month: 8,
        year: 2026,
        description: "Editado",
        amount: 2000,
      });
    });
    expect(r.ok).toBe(true);
    expect(result.current.formState.newExpenses?.[0]?.description).toBe("Editado");
    expect(result.current.formState.newExpenses?.[0]?.amount).toBe(2000);
  });

  it("S87-modal: updateNewExpense rechaza si choca con OTRA virtual", () => {
    const props = makeExpenseProps() as any;
    const { result } = renderHook(() => usePaymentsForm(props, true));

    let vidA: any;
    let vidB: any;
    act(() => {
      vidA = result.current.addNewExpense({ month: 8, year: 2026, description: "A", amount: 1000 }).virtualId;
    });
    act(() => {
      vidB = result.current.addNewExpense({ month: 9, year: 2026, description: "B", amount: 2000 }).virtualId;
    });

    // Intentar mover B al periodo de A
    let r: any;
    act(() => {
      r = result.current.updateNewExpense(vidB, {
        month: 8,
        year: 2026,
        description: "B movida",
        amount: 2500,
      });
    });
    expect(r.ok).toBe(false);
    expect(r.error).toContain("Ya creaste una expensa");
  });

  it("S87-modal: removeNewExpense(virtualId) quita solo ese item", () => {
    const props = makeExpenseProps() as any;
    const { result } = renderHook(() => usePaymentsForm(props, true));

    let vidA: any;
    act(() => {
      vidA = result.current.addNewExpense({ month: 8, year: 2026, description: "A", amount: 1000 }).virtualId;
    });
    act(() => {
      result.current.addNewExpense({ month: 9, year: 2026, description: "B", amount: 2000 });
    });
    expect(result.current.formState.newExpenses).toHaveLength(2);

    act(() => {
      result.current.removeNewExpense(vidA);
    });
    expect(result.current.formState.newExpenses).toHaveLength(1);
    expect(result.current.formState.newExpenses?.[0]?.month).toBe(9);
  });

  it("S87-modal: cambiar de tipo limpia el array y amount", () => {
    const props = makeExpenseProps() as any;
    const { result } = renderHook(() => usePaymentsForm(props, true));

    act(() => {
      result.current.addNewExpense({ month: 8, year: 2026, description: "", amount: 1500 });
    });
    expect(result.current.formState.newExpenses).toHaveLength(1);

    act(() => {
      result.current.handleChangeInput({
        target: { name: "type", value: FormPaymentType.DIRECT, type: "text" },
      } as any);
    });

    expect(result.current.formState.newExpenses).toHaveLength(0);
    expect(result.current.formState.amount).toBe("");
  });

  it("S87-modal: cambiar de dpto limpia el array y amount", () => {
    const props = makeExpenseProps() as any;
    const { result } = renderHook(() => usePaymentsForm(props, true));

    act(() => {
      result.current.addNewExpense({ month: 8, year: 2026, description: "", amount: 1500 });
    });
    expect(result.current.formState.newExpenses).toHaveLength(1);

    act(() => {
      result.current.handleChangeInput({
        target: { name: "dpto_id", value: "202", type: "text" },
      } as any);
    });

    expect(result.current.formState.newExpenses).toHaveLength(0);
    expect(result.current.formState.amount).toBe("");
  });

  it("S87-modal: submit con array de 2 virtuales pinea create_expenses: [] con 2 items", async () => {
    const localExecute = vi
      .fn()
      .mockImplementation((url: string) => {
        if (url === paymentsApi.adminDebts) {
          return Promise.resolve({ data: { success: true, data: { deudas: [] } } });
        }
        return Promise.resolve({ data: { success: true, data: "payment-s87" } });
      });

    const props = {
      item: {
        paid_at: "2026-08-01",
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
      execute: localExecute,
      showToast: mockShowToast,
      reLoad: mockReLoad,
      onClose: mockOnClose,
    } as any;

    const { result } = renderHook(() => usePaymentsForm(props, true));

    await waitFor(() => {
      expect(result.current.deudas).toHaveLength(0);
    });

    act(() => {
      result.current.addNewExpense({
        month: 8,
        year: 2026,
        description: "Agosto",
        amount: 1500,
      });
    });
    act(() => {
      result.current.addNewExpense({
        month: 9,
        year: 2026,
        description: "Septiembre",
        amount: 1000,
      });
    });

    await act(async () => {
      await result.current._onSavePago();
    });

    const createCall = localExecute.mock.calls.find((c: any[]) => c[0] === paymentsApi.create);
    expect(createCall).toBeDefined();
    const payload = createCall![2];

    // S87: array de expensas
    expect(payload.create_expenses).toHaveLength(2);
    expect(payload.create_expenses[0].month).toBe(8);
    expect(payload.create_expenses[0].year).toBe(2026);
    expect(payload.create_expenses[0].amount).toBe(1500);
    expect(payload.create_expenses[0].due_at).toBe("2026-08-31");
    expect(payload.create_expenses[0].subcategory_id).toBe(100);
    expect(payload.create_expenses[1].month).toBe(9);
    expect(payload.create_expenses[1].amount).toBe(1000);
    expect(payload.create_expenses[1].due_at).toBe("2026-09-30");
    expect(payload.debt_dpto_ids).toEqual([]);
    // amount total = 1500 + 1000
    expect(payload.amount).toBe(2500);
    expect(payload.bank_account_id).toBe(7);
  });

  it("S87-modal: validación rechaza month/year/amount inválido en addNewExpense", () => {
    const props = makeExpenseProps() as any;
    const { result } = renderHook(() => usePaymentsForm(props, true));

    const tryAdd = (data: any) => {
      let r: any;
      act(() => {
        r = result.current.addNewExpense(data);
      });
      return r;
    };

    expect(tryAdd({ month: 13, year: 2026, description: "", amount: 100 }).ok).toBe(false);
    expect(tryAdd({ month: 0, year: 2026, description: "", amount: 100 }).ok).toBe(false);
    expect(tryAdd({ month: 8, year: 1999, description: "", amount: 100 }).ok).toBe(false);
    expect(tryAdd({ month: 8, year: 2026, description: "", amount: 0 }).ok).toBe(false);
    expect(tryAdd({ month: 8, year: 2026, description: "", amount: -10 }).ok).toBe(false);
  });
});