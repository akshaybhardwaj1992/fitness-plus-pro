import { buttonClass } from "@/components/ui";

const TABLES = [
  { key: "members", label: "Members" },
  { key: "weight_logs", label: "Weight history" },
  { key: "plans", label: "Plans" },
  { key: "foods", label: "Foods" },
  { key: "exercises", label: "Exercises" },
];

/** CSV backup links. Free Supabase has no automatic backups — download these regularly. */
export function ExportMenu() {
  return (
    <details className="rounded-2xl border border-line bg-card p-4">
      <summary className="cursor-pointer font-semibold">Backup: download data as CSV (Excel)</summary>
      <p className="mt-2 text-muted">
        The free database has no automatic backups. Download these files once a week and keep them safe
        (e.g. Google Drive).
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {TABLES.map((t) => (
          <a key={t.key} href={`/api/export/${t.key}`} className={buttonClass("secondary")}>
            {t.label}
          </a>
        ))}
      </div>
    </details>
  );
}
