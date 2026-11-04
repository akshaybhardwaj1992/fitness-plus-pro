"use client";
import { useEffect } from "react";
import { Button } from "@/components/ui";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="rounded-2xl border border-danger/60 bg-card p-6">
      <h1 className="text-xl font-bold">Something went wrong</h1>
      <p className="mt-2 text-muted">
        The page could not load. This is usually a weak internet connection or the database is paused
        (free Supabase projects pause after a week without use — see README). Please try again.
      </p>
      <Button className="mt-4" onClick={reset}>Try again</Button>
    </div>
  );
}
