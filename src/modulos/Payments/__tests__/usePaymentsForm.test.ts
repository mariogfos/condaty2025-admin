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
      paymentsApi.full,
      "POST",
      expect.objectContaining({
        paid_at: "2026-06-14",
        method: PaymentMethod.CASH,
        type: FormPaymentType.DIRECT,
        amount: 125.5,
        nro_id: "101",
        owner_id: 42,
        bank_account_id: 66,
        subcategory_id: 11,
      })
    );
    expect(mockShowToast).toHaveBeenCalledWith(
      "Pago agregado con éxito",
      "success"
    );
    expect(mockReLoad).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });
});