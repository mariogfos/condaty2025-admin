import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import useSubmissionGuard from "../useSubmissionGuard";

describe("useSubmissionGuard", () => {
  it("blocks concurrent submissions and permits a later retry", () => {
    const { result } = renderHook(() => useSubmissionGuard());

    act(() => {
      expect(result.current.begin()).toBe(true);
      expect(result.current.begin()).toBe(false);
    });
    expect(result.current.submitting).toBe(true);

    act(() => result.current.finish());
    expect(result.current.submitting).toBe(false);
    act(() => expect(result.current.begin()).toBe(true));
  });
});
