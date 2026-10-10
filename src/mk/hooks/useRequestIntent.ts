import { useCallback, useRef, useState } from "react";

const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, canonicalize(item)]),
    );
  }
  return value;
};

/** One synchronous lock and one stable request ID per unchanged create attempt. */
export default function useRequestIntent() {
  const inFlight = useRef(false);
  const attempt = useRef<{ signature: string; requestId: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const begin = useCallback(<T extends Record<string, unknown>>(payload: T): (T & { request_id: string }) | null => {
    if (inFlight.current) return null;
    inFlight.current = true;
    setSubmitting(true);

    const signature = JSON.stringify(canonicalize(payload));
    if (!attempt.current || attempt.current.signature !== signature) {
      attempt.current = { signature, requestId: crypto.randomUUID() };
    }
    return { ...payload, request_id: attempt.current.requestId };
  }, []);

  const finish = useCallback((success: boolean, status?: number) => {
    inFlight.current = false;
    setSubmitting(false);
    // Network errors, timeouts and 5xx may mean that creation committed.
    if (success || (status !== undefined && status !== 0 && status !== 408 && status < 500)) {
      attempt.current = null;
    }
  }, []);

  return { begin, finish, submitting };
}
