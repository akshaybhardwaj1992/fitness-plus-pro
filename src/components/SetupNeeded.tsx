/** Shown instead of the app when Supabase keys are missing. Nothing pretends to work. */
export function SetupNeeded() {
  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="rounded-2xl border border-warn/60 bg-card p-6">
        <h1 className="text-2xl font-bold">Almost there — connect the database</h1>
        <p className="mt-2 text-muted">
          The app is installed but not connected to Supabase yet, so nothing can be saved. Do these steps once:
        </p>
        <ol className="mt-4 list-decimal space-y-2 pl-6">
          <li>Create a free project at <b>supabase.com</b> (pick the region closest to you, e.g. Mumbai).</li>
          <li>In Supabase open <b>SQL Editor</b> and run the two files in <code>supabase/migrations/</code>, in order, then <code>supabase/seed.sql</code>.</li>
          <li>Open <b>Project Settings → API</b>. Copy the <b>Project URL</b> and the <b>anon public</b> key.</li>
          <li>
            Put them in the file <code>.env.local</code> (local) or in Vercel → Settings → Environment Variables as{" "}
            <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.
          </li>
          <li>Restart the app (or redeploy on Vercel). Full steps are in the README.</li>
        </ol>
        <p className="mt-4 text-sm text-muted">Never paste the <b>service_role</b> key here — the app does not need it.</p>
      </div>
    </main>
  );
}
