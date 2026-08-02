"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui";

type DeleteResult = { ok: boolean; error?: string };

export function DeleteButton({
  onDelete,
  confirmText,
  label = "Delete",
  className,
  onDeleted,
}: {
  onDelete: () => Promise<DeleteResult>;
  confirmText: string;
  label?: string;
  className?: string;
  onDeleted?: () => void;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="danger"
      disabled={pending}
      className={className}
      onClick={() => {
        if (!window.confirm(confirmText)) return;
        startTransition(async () => {
          const result = await onDelete();
          if (!result.ok) {
            window.alert(result.error ?? "Couldn't delete this record.");
            return;
          }
          onDeleted?.();
        });
      }}
    >
      {pending ? "Deleting…" : label}
    </Button>
  );
}
