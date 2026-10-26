"use client";

import { startTransition, useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import type { ActionState } from "@/lib/action-state";

type Action = (state: ActionState, formData: FormData) => Promise<ActionState>;

// Wires a form to a Server Action: shows a toast with the result and exposes
// field errors. Submitting through onSubmit (not the form's `action` prop)
// stops React from clearing the fields when validation fails.
export function useActionForm(action: Action, { onSuccess }: { onSuccess?: () => void } = {}) {
  const [state, formAction, pending] = useActionState(action, null);
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  useEffect(() => {
    if (!state) return;
    if (state.message) (state.ok ? toast.success : toast.error)(state.message);
    if (state.ok) onSuccessRef.current?.();
  }, [state]);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Include the clicked button's name/value (e.g. intent=publish).
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const formData = new FormData(event.currentTarget, submitter);
    startTransition(() => formAction(formData));
  }

  return {
    state,
    pending,
    onSubmit,
    error: (name: string) => state?.errors?.[name]?.[0],
  };
}
