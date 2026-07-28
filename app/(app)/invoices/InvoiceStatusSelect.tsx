"use client";

import { useState, useTransition } from "react";
import { updateInvoiceStatus } from "@/app/actions/invoices";
import { Select } from "@/components/ui";
import { INVOICE_STATUSES } from "@/lib/constants";

export function InvoiceStatusSelect({
  invoiceId,
  initialStatus,
}: {
  invoiceId: string;
  initialStatus: string;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [, startTransition] = useTransition();

  return (
    <Select
      value={status}
      onChange={(e) => {
        const next = e.target.value;
        setStatus(next);
        startTransition(() => {
          updateInvoiceStatus(invoiceId, next);
        });
      }}
    >
      {INVOICE_STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </Select>
  );
}
