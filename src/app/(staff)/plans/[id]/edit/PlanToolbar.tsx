"use client";
import Link from "next/link";
import { useEffect } from "react";
import type { SaveResult } from "../../actions";
import type { PlanStatus } from "@/lib/types";
import { Badge, Button, Notice, buttonClass } from "@/components/ui";

export function PlanToolbar({
  planId, memberId, memberName, title, onTitle, status, dirty, busy, result, blockers, onSave, onPublish, onUnpublish,
}: {
  planId: string;
  memberId: string;
  memberName: string;
  title: string;
  onTitle: (t: string) => void;
  status: PlanStatus;
  dirty: boolean;
  busy: boolean;
  result: SaveResult | null;
  blockers: number;
  onSave: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
}) {
  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  return (
    <div className="sticky top-0 z-[5] -mx-4 mb-4 border-b border-line bg-ink/95 px-4 py-3 backdrop-blur sm:top-[73px]">
      <div className="flex flex-wrap items-center gap-2">
        <Link href={`/members/${memberId}`} className="text-muted hover:text-white">← {memberName}</Link>
        {status === "published" ? <Badge tone="green">Published</Badge> : <Badge>Draft</Badge>}
        {dirty ? <Badge tone="warn">Unsaved changes</Badge> : <Badge>All saved</Badge>}
      </div>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
        <label htmlFor="plan-title" className="sr-only">Plan title</label>
        <input id="plan-title" value={title} maxLength={120} onChange={(e) => onTitle(e.target.value)} className="input sm:flex-1" />
        <div className="flex flex-wrap gap-2">
          <Button onClick={onSave} disabled={busy || !dirty}>{busy ? "Saving…" : "Save"}</Button>
          {status === "draft" ? (
            <Button
              variant="secondary"
              onClick={onPublish}
              disabled={busy || blockers > 0}
              title={blockers > 0 ? "Fix the problems listed below first" : undefined}
            >
              Publish
            </Button>
          ) : (
            <Button variant="secondary" onClick={onUnpublish} disabled={busy}>Back to draft</Button>
          )}
          <Link href={`/plans/${planId}/print`} className={buttonClass("ghost")} aria-disabled={dirty}>
            Print / PDF{dirty ? " (save first)" : ""}
          </Link>
        </div>
      </div>
      {result && (
        <div className="mt-2">
          <Notice tone={result.ok && result.errors.length === 0 ? "ok" : "error"}>
            {result.message}
            {result.errors.length > 0 && (
              <ul className="mt-1 list-disc pl-5">{result.errors.map((e) => <li key={e}>{e}</li>)}</ul>
            )}
          </Notice>
        </div>
      )}
    </div>
  );
}
