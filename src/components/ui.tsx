import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const variants: Record<Variant, string> = {
  primary: "bg-brand text-ink hover:bg-brand-dark font-semibold",
  secondary: "bg-raised text-white border border-line hover:border-brand",
  danger: "bg-danger/15 text-danger border border-danger/50 hover:bg-danger/25",
  ghost: "text-muted hover:text-white",
};

export function buttonClass(variant: Variant = "primary", extra = "") {
  return `inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${extra}`;
}

export function Button({ variant = "primary", className = "", ...props }: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={buttonClass(variant, className)} {...props} />;
}

export function LinkButton({ variant = "primary", className = "", ...props }: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={buttonClass(variant, className)} {...props} />;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-line bg-card p-4 sm:p-6 ${className}`}>{children}</section>;
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-line p-8 text-center">
      <p className="text-lg font-semibold">{title}</p>
      {children && <div className="mt-2 text-muted">{children}</div>}
    </div>
  );
}

export function Notice({ tone = "info", title, children }: { tone?: "info" | "warn" | "error" | "ok"; title?: string; children?: ReactNode }) {
  const tones = {
    info: "border-line bg-raised",
    warn: "border-warn/60 bg-warn/10",
    error: "border-danger/60 bg-danger/10",
    ok: "border-brand/60 bg-brand/10",
  };
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`rounded-xl border p-4 ${tones[tone]}`}>
      {title && <p className="font-semibold">{title}</p>}
      {children && <div className={title ? "mt-1" : ""}>{children}</div>}
    </div>
  );
}

export function Badge({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "green" | "warn" | "red" }) {
  const tones = {
    muted: "bg-raised text-muted",
    green: "bg-brand/15 text-brand",
    warn: "bg-warn/15 text-warn",
    red: "bg-danger/15 text-danger",
  };
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-sm font-medium ${tones[tone]}`}>{children}</span>;
}

export function Field({
  label, name, error, hint, children,
}: { label: string; name: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block font-medium">{label}</label>
      {children}
      {hint && !error && <p className="mt-1 text-sm text-muted">{hint}</p>}
      {error && <p id={`${name}-error`} className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  );
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="rounded-xl bg-raised p-3">
      <p className="text-sm text-muted">{label}</p>
      <p className="text-xl font-bold">{value}</p>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </div>
  );
}
