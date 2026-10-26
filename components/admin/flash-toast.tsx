"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

// Shows a toast once when the URL has ?<param>=1 (set by a redirect after
// creating something), then removes the param.
export function FlashToast({ param = "created", message }: { param?: string; message: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (searchParams.get(param) !== "1") return;
    toast.success(message);
    const rest = new URLSearchParams(searchParams);
    rest.delete(param);
    router.replace(rest.size ? `${pathname}?${rest}` : pathname, { scroll: false });
  }, [searchParams, param, message, router, pathname]);

  return null;
}
