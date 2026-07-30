"use client";

import { useActionState, useState } from "react";
import { createDeal } from "@/app/actions/deals";
import { Button, Field, Input, Select } from "@/components/ui";
import { Modal } from "@/components/Modal";
import { REVENUE_STREAMS } from "@/lib/constants";

type ContactOption = { id: string; name: string; company: string };

export function AddDealModal({
  companyNames = [],
  contacts = [],
}: {
  companyNames?: string[];
  contacts?: ContactOption[];
}) {
  const [open, setOpen] = useState(false);
  const [contactId, setContactId] = useState("");
  const [contactName, setContactName] = useState("");
  const [, formAction, pending] = useActionState(async (_prev: null, formData: FormData) => {
    await createDeal(formData);
    setOpen(false);
    setContactId("");
    setContactName("");
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
            <Field label="Link to an existing contact (optional)">
              <Select
                value={contactId}
                onChange={(e) => {
                  const id = e.target.value;
                  setContactId(id);
                  const match = contacts.find((c) => c.id === id);
                  if (match) setContactName(match.name);
                }}
              >
                <option value="">None</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.company})
                  </option>
                ))}
              </Select>
            </Field>
            <input type="hidden" name="contactId" value={contactId} />
            <Field label="Contact name">
              <Input
                name="contactName"
                value={contactName}
                onChange={(e) => {
                  setContactName(e.target.value);
                  setContactId("");
                }}
              />
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
