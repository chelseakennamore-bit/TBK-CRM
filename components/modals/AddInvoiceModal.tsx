"use client";

import { useActionState, useState } from "react";
import { createInvoice } from "@/app/actions/invoices";
import { Button, Field, Input, Select } from "@/components/ui";
import { Modal } from "@/components/Modal";

export function AddInvoiceModal({
  wonDeals,
  companyNames = [],
}: {
  wonDeals: { id: string; title: string }[];
  companyNames?: string[];
}) {
  const [open, setOpen] = useState(false);
  const [, formAction, pending] = useActionState(async (_prev: null, formData: FormData) => {
    await createInvoice(formData);
    setOpen(false);
    return null;
  }, null);

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        Add invoice
      </Button>
      {open && (
        <Modal
          title="Add invoice"
          onClose={() => setOpen(false)}
          footer={
            <>
              <Button type="button" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" form="add-invoice-form" variant="primary" disabled={pending}>
                Save
              </Button>
            </>
          }
        >
          <form id="add-invoice-form" action={formAction} className="flex flex-col gap-3">
            <Field label="Client">
              <Input name="client" list="company-names" required />
              <datalist id="company-names">
                {companyNames.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </Field>
            <Field label="Linked deal (optional)">
              <Select name="dealId" defaultValue="">
                <option value="">None</option>
                {wonDeals.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Amount ($)">
                <Input name="amount" type="number" />
              </Field>
              <Field label="Due date">
                <Input name="dueDate" type="date" />
              </Field>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
