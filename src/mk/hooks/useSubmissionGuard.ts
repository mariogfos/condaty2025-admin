import { useCallback, useRef, useState } from "react";

/** Lock synchronously so two clicks in the same render cannot submit twice. */
export default function useSubmissionGuard() {
  const inFlight = useRef(false);
  const [submitting, setSubmitting] = useState(false);

  const begin = useCallback(() => {
    if (inFlight.current) return false;
    inFlight.current = true;
    setSubmitting(true);
    return true;
  }, []);

  const finish = useCallback(() => {
    inFlight.current = false;
    setSubmitting(false);
  }, []);

  return { begin, finish, submitting };
}
