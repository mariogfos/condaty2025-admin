import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CashFlowReportModal from "../CashFlowReportModal";

const mockShowToast = vi.fn();
const mockOnClose = vi.fn();
const mockAnchorClick = vi.fn();
const mockGlobals = vi.hoisted(() => {
  const mockGet = vi.fn();
  const mockInterceptorUse = vi.fn();
  const mockCreate = vi.fn(() => ({
    interceptors: {
      request: {
        use: mockInterceptorUse,
      },
    },
    get: mockGet,
  }));

  return {
    mockGet,
    mockCreate,
  };
});

vi.mock("axios", () => ({
  default: {
    create: mockGlobals.mockCreate,
  },
  create: mockGlobals.mockCreate,
}));

vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({
    showToast: mockShowToast,
  }),
}));

vi.mock("@/mk/components/ui/DataModal/DataModal", () => ({
  default: ({ children, onSave, onClose, open, buttonText, buttonCancel }: any) =>
    open ? (
      <div>
        <button type="button" onClick={onSave}>
          {buttonText}
        </button>
        <button type="button" onClick={onClose}>
          {buttonCancel}
        </button>
        {children}
      </div>
    ) : null,
}));

vi.mock("@/mk/components/forms/Input/Input", () => ({
  default: ({ label, name, value, onChange }: any) => (
    <label>
      {label}
      <input aria-label={label} name={name} value={value} onChange={onChange} />
    </label>
  ),
}));

describe("CashFlowReportModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGlobals.mockGet.mockResolvedValue({
      data: new Blob(["cash-flow"]),
      headers: {
        "content-disposition": 'attachment; filename="cash-flow-report.xlsx"',
      },
    });

    Object.defineProperty(window.URL, "createObjectURL", {
      value: vi.fn(() => "blob:cash-flow"),
      writable: true,
    });
    Object.defineProperty(window.URL, "revokeObjectURL", {
      value: vi.fn(),
      writable: true,
    });
  });

  it("descarga el reporte desde el endpoint v3 de payments", async () => {
    render(<CashFlowReportModal open onClose={mockOnClose} />);

    fireEvent.change(screen.getByLabelText("Fecha Inicio"), {
      target: { value: "2026-06-01" },
    });
    fireEvent.change(screen.getByLabelText("Fecha Fin"), {
      target: { value: "2026-06-30" },
    });

    const realCreateElement = document.createElement.bind(document);
    const anchorSpy = vi.spyOn(document, "createElement").mockImplementation((tagName: string, options?: any) => {
      const element = realCreateElement(tagName, options);
      if (tagName === "a") {
        Object.defineProperty(element, "click", {
          value: mockAnchorClick,
          configurable: true,
        });
      }
      return element;
    });

    fireEvent.click(screen.getByRole("button", { name: "Descargar" }));

    await waitFor(() => {
      expect(mockGlobals.mockGet).toHaveBeenCalledWith(
        expect.stringContaining(
          "/v3/payments/export-cash-flow?start_date=2026-06-01&end_date=2026-06-30",
        ),
        expect.objectContaining({
          responseType: "blob",
        }),
      );
    });

    expect(mockShowToast).toHaveBeenCalledWith(
      "Reporte descargado exitosamente",
      "success",
    );
    expect(mockOnClose).toHaveBeenCalled();
    expect(mockAnchorClick).toHaveBeenCalled();
    anchorSpy.mockRestore();
  });
});
