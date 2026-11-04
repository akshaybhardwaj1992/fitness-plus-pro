"use client";
import { useFormStatus } from "react-dom";
import { buttonClass } from "./ui";

/** Submit button that shows a "working" label and can't be double-clicked. */
export function SubmitButton({
  children, pendingText = "Saving…", variant = "primary", className = "", name, value,
}: {
  children: React.ReactNode;
  pendingText?: string;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  className?: string;
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" name={name} value={value} disabled={pending} className={buttonClass(variant, className)}>
      {pending ? pendingText : children}
    </button>
  );
}
