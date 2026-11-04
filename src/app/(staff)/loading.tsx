export default function Loading() {
  return (
    <div role="status" className="flex items-center gap-3 py-12 text-muted">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      Loading…
    </div>
  );
}
