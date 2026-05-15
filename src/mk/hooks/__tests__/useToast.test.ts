import { describe, expect, it, vi } from "vitest";
import { appendToastItem, createToastItem, type ToastItem } from "../useToast";

describe("useToast queue helpers", () => {
  it("deduplicates identical realtime toasts within the short protection window", () => {
    vi.spyOn(Date, "now")
      .mockReturnValueOnce(1_000)
      .mockReturnValueOnce(1_000)
      .mockReturnValueOnce(2_000)
      .mockReturnValueOnce(2_000);

    const firstToast = createToastItem(
      "¡Revisa tus ingresos, tienes un nuevo comprobante de pago!",
      "info",
      5000,
    );
    const secondToast = createToastItem(
      "¡Revisa tus ingresos, tienes un nuevo comprobante de pago!",
      "info",
      5000,
    );

    const queueWithFirst = appendToastItem([], firstToast);
    const queueWithDuplicate = appendToastItem(queueWithFirst, secondToast);

    expect(queueWithFirst).toHaveLength(1);
    expect(queueWithDuplicate).toHaveLength(1);

    vi.restoreAllMocks();
  });

  it("keeps only the most recent four toasts in the queue", () => {
    const toasts = Array.from({ length: 5 }, (_, index) => ({
      id: `toast-${index + 1}`,
      msg: `Toast ${index + 1}`,
      type: "info" as const,
      time: 5000,
      createdAt: (index + 1) * 10_000,
    }));

    const finalQueue = toasts.reduce(
      (queue, toast) => appendToastItem(queue, toast),
      [] as ToastItem[],
    );

    expect(finalQueue).toHaveLength(4);
    expect(finalQueue.map((toast) => toast.msg)).toEqual([
      "Toast 2",
      "Toast 3",
      "Toast 4",
      "Toast 5",
    ]);
  });
});
