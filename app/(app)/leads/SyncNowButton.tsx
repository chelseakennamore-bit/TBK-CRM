"use client";

import { useTransition } from "react";
import { syncNow } from "@/app/actions/leads";
import { Button } from "@/components/ui";

export function SyncNowButton() {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      disabled={pending}
      onClick={() => startTransition(() => syncNow())}
    >
      {pending ? "Syncing…" : "Sync now"}
    </Button>
  );
}
