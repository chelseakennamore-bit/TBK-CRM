"use client";

import { useState, useTransition } from "react";
import { syncNow } from "@/app/actions/leads";
import { Button } from "@/components/ui";

export function SyncNowButton() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleSync() {
    setMessage(null);
    startTransition(async () => {
      try {
        const { importedCount } = await syncNow();
        setMessage(
          importedCount > 0
            ? `Imported ${importedCount} new lead${importedCount === 1 ? "" : "s"}.`
            : "No new leads found."
        );
      } catch (err) {
        setMessage(err instanceof Error ? err.message : "Sync failed.");
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Button disabled={pending} onClick={handleSync}>
        {pending ? "Syncing…" : "Sync now"}
      </Button>
      {message && (
        <span className="text-xs text-zinc-500 dark:text-zinc-400">{message}</span>
      )}
    </div>
  );
}
