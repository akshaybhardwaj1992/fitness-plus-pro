"use client";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { buttonClass } from "./ui";

/**
 * Two-step button for delete / deactivate: first tap asks "Are you sure?",
 * second tap submits the surrounding form. Must be placed inside a <form>.
 */
export function ConfirmButton({
  children, question, confirmText = "Yes, do it", variant = "danger", pendingText = "Working…",
}: {
  children: React.ReactNode;
  question: string;
  confirmText?: string;
  variant?: "danger" | "secondary";
  pendingText?: string;
}) {
  const [asking, setAsking] = useState(false);
  const { pending } = useFormStatus();

  if (!asking) {
    return (
      <button type="button" className={buttonClass(variant)} onClick={() => setAsking(true)}>
        {children}
      </button>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-danger/50 bg-danger/10 p-3">
      <span className="font-medium">{question}</span>
      <button type="submit" disabled={pending} className={buttonClass("danger")}>
        {pending ? pendingText : confirmText}
      </button>
      <button type="button" disabled={pending} className={buttonClass("secondary")} onClick={() => setAsking(false)}>
        No, go back
      </button>
    </div>
  );
}
