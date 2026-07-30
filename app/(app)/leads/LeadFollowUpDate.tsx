"use client";

import { useState, useTransition } from "react";
import { updateLeadFollowUp } from "@/app/actions/leads";
import { Input } from "@/components/ui";

export function LeadFollowUpDate({
  leadId,
  initialDate,
}: {
  leadId: string;
  initialDate: string;
}) {
  const [date, setDate] = useState(initialDate);
  const [, startTransition] = useTransition();

  return (
    <Input
      type="date"
      value={date}
      className="w-[150px]"
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => {
        const next = e.target.value;
        setDate(next);
        startTransition(() => {
          updateLeadFollowUp(leadId, next);
        });
      }}
    />
  );
}
