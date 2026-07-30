"use client";

import { useActionState, useState } from "react";
import { createDeal } from "@/app/actions/deals";
import { Button, Field, Input, Select } from "@/components/ui";
import { Modal } from "@/components/Modal";
import { REVENUE_STREAMS } from "@/lib/constants";

export function AddDealModal({ companyNames = [] }: { companyNames?: string[] }) {
  const [open, setOpen] = useState(false);
  const [, formAction, pending] = useActionState(async (_prev: null, formData: FormData) => {
    await createDeal(formData);
    setOpen(false);
    return null;
  }, null);

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        Add deal
      </Button>
      {open && (
        <Modal
          title="Add deal"
          onClose={() => setOpen(false)}
          footer={
            <>
              <Button type="button" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" form="add-deal-form" variant="primary" disabled={pending}>
                Save
              </Button>
            </>
          }
        >
          <form id="add-deal-form" action={formAction} className="flex flex-col gap-3">
            <Field label="Deal title">
              <Input name="title" required />
            </Field>
            <Field label="Company">
              <Input name="company" list="company-names" />
              <datalist id="company-names">
                {companyNames.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </Field>
            <Field label="Contact name">
              <Input name="contactName" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Value ($)">
                <Input name="value" type="number" />
              </Field>
              <Field label="Close date">
                <Input name="closeDate" type="date" />
              </Field>
            </div>
            <Field label="Revenue stream">
              <Select name="revenueStream" defaultValue="">
                <option value="">—</option>
                {REVENUE_STREAMS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>
          </form>
        </Modal>
      )}
    </>
  );
}
