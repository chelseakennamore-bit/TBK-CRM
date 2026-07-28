"use client";

import { useTransition } from "react";
import { convertLead } from "@/app/actions/leads";
import { Button } from "@/components/ui";

export function ConvertButton({ leadId }: { leadId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="primary"
      disabled={pending}
      onClick={() => startTransition(() => convertLead(leadId))}
    >
      Convert to deal
    </Button>
  );
}
