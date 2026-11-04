"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { FormState } from "@/lib/form";

/** After a successful save, open the page the action named. */
export function useRedirectOnSave(state: FormState) {
  const router = useRouter();
  useEffect(() => {
    if (state.redirectTo) router.push(state.redirectTo);
  }, [state, router]);
}
