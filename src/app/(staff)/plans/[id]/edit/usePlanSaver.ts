"use client";
import { useState, useTransition } from "react";
import { publishPlan, savePlan, unpublishPlan, type SaveResult } from "../../actions";
import type { PlanStatus } from "@/lib/types";

/** Shared save / publish / unpublish state for both editors. */
export function usePlanSaver<T>(planId: string, initial: { title: string; status: PlanStatus; content: T }) {
  const [content, setContentRaw] = useState<T>(initial.content);
  const [title, setTitleRaw] = useState(initial.title);
  const [status, setStatus] = useState<PlanStatus>(initial.status);
  const [dirty, setDirty] = useState(false);
  const [result, setResult] = useState<SaveResult | null>(null);
  const [busy, startTransition] = useTransition();

  const setContent = (updater: (c: T) => T) => {
    setContentRaw(updater);
    setDirty(true);
    setResult(null);
  };
  const setTitle = (t: string) => {
    setTitleRaw(t);
    setDirty(true);
  };

  const run = (fn: () => Promise<SaveResult>) =>
    startTransition(async () => {
      try {
        const r = await fn();
        setResult(r);
        setStatus(r.status);
      } catch {
        setResult({
          ok: false, message: "Could not reach the server. Check your internet and try again.",
          errors: [], warnings: [], status,
        });
      }
    });

  const save = () =>
    run(async () => {
      const r = await savePlan({ id: planId, title, content });
      if (r.ok) setDirty(false);
      return r;
    });

  const publish = () =>
    run(async () => {
      if (dirty) {
        const s = await savePlan({ id: planId, title, content });
        if (!s.ok || s.errors.length > 0) return s;
        setDirty(false);
      }
      return publishPlan(planId);
    });

  const unpublish = () => run(() => unpublishPlan(planId));

  return { content, setContent, title, setTitle, status, dirty, result, busy, save, publish, unpublish };
}
