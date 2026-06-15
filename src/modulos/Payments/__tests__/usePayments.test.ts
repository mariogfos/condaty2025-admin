import { renderHook, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import usePayments from "../hooks/usePayments";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const mockExecute = vi.fn();
const mockReLoad = vi.fn();
const mockShowToast = vi.fn();
const mockOnView = vi.fn();
const mockOnDel = vi.fn();

vi.mock("@/mk/hooks/useCrud/useCrud", () => ({
  default: vi.fn(({ paramsInitial, mod, fields }: any) => ({
    List: () => null,
    searchs: { searchBy: "" },
    userCan: vi.fn(() => true),
    extraData: {},
    execute: mockExecute,
    reLoad: mockReLoad,
    showToast: mockShowToast,
    onView: mockOnView,
    onDel: mockOnDel,
  })),
}));

describe("usePayments Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("inicializa el hook y define goToCategories correctamente", () => {
    const { result } = renderHook(() => usePayments());
    expect(result.current.modPermission).toBe("payments");

    act(() => {
      result.current.goToCategories("I");
    });
    expect(mockPush).toHaveBeenCalledWith("/categories?type=I");
  });

  it("ejecuta confirmación de pago correctamente", async () => {
    mockExecute.mockResolvedValue({ data: { success: true, message: "Aprobado" } });
    const { result } = renderHook(() => usePayments());

    await act(async () => {
      const items = result.current.rowContextMenu.items;
      if (typeof items === "function") {
        const menuItems = items({ id: "pay-1", status: "S" }, 0);
        const approveItem = menuItems[1];
        if (approveItem && typeof approveItem.onClick === "function") {
          await (approveItem.onClick as any)({ id: "pay-1", status: "S" });
        }
      }
    });

    expect(mockExecute).toHaveBeenCalled();
    expect(mockShowToast).toHaveBeenCalledWith("Aprobado", "success");
    expect(mockReLoad).toHaveBeenCalled();
  });
});
