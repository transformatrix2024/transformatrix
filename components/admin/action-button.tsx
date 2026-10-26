"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { ActionState } from "@/lib/action-state";

// A button that runs a Server Action straight away and toasts the result.
export function ActionButton({
  action,
  children,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "onClick" | "action"> & {
  action: () => Promise<ActionState>;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      {...props}
      disabled={pending || props.disabled}
      onClick={() =>
        startTransition(async () => {
          const result = await action();
          if (result?.message) (result.ok ? toast.success : toast.error)(result.message);
        })
      }
    >
      {children}
    </Button>
  );
}
