import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import useRequestIntent from "../useRequestIntent";

describe("useRequestIntent", () => {
  it("blocks a concurrent submit and reuses the UUID after an ambiguous network failure", () => {
    const { result } = renderHook(() => useRequestIntent());
    const payload = { amount: 100, detail: { b: 2, a: 1 } };
    let first!: ReturnType<typeof result.current.begin>;

    act(() => {
      first = result.current.begin(payload);
      expect(result.current.begin(payload)).toBeNull();
    });
    expect(result.current.submitting).toBe(true);

    act(() => result.current.finish(false));
    let retry!: ReturnType<typeof result.current.begin>;
    act(() => { retry = result.current.begin({ detail: { a: 1, b: 2 }, amount: 100 }); });
    expect(retry?.request_id).toBe(first?.request_id);

    act(() => result.current.finish(true, 200));
    let newAttempt!: ReturnType<typeof result.current.begin>;
    act(() => { newAttempt = result.current.begin(payload); });
    expect(newAttempt?.request_id).not.toBe(first?.request_id);
  });

  it("changes the UUID when fields change and clears it after a definitive validation error", () => {
    const { result } = renderHook(() => useRequestIntent());
    let first!: ReturnType<typeof result.current.begin>;
    act(() => { first = result.current.begin({ name: "Uno" }); });
    act(() => result.current.finish(false));

    let changed!: ReturnType<typeof result.current.begin>;
    act(() => { changed = result.current.begin({ name: "Dos" }); });
    expect(changed?.request_id).not.toBe(first?.request_id);
    act(() => result.current.finish(false, 422));

    let next!: ReturnType<typeof result.current.begin>;
    act(() => { next = result.current.begin({ name: "Dos" }); });
    expect(next?.request_id).not.toBe(changed?.request_id);
  });
});
