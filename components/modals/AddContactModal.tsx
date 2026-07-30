"use client";

import { useActionState, useState } from "react";
import { createContact, findContactByEmail } from "@/app/actions/contacts";
import { Button, Field, Input } from "@/components/ui";
import { Modal } from "@/components/Modal";

export function AddContactModal({ companyNames = [] }: { companyNames?: string[] }) {
  const [open, setOpen] = useState(false);
  const [duplicate, setDuplicate] = useState<{ name: string; company: string } | null>(null);
  const [, formAction, pending] = useActionState(async (_prev: null, formData: FormData) => {
    await createContact(formData);
    setOpen(false);
    setDuplicate(null);
    return null;
  }, null);

  async function checkEmail(email: string) {
    if (!email.trim()) {
      setDuplicate(null);
      return;
    }
    const existing = await findContactByEmail(email);
    setDuplicate(existing ? { name: existing.name, company: existing.company } : null);
  }

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        Add contact
      </Button>
      {open && (
        <Modal
          title="Add contact"
          onClose={() => setOpen(false)}
          footer={
            <>
              <Button type="button" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" form="add-contact-form" variant="primary" disabled={pending}>
                Save
              </Button>
            </>
          }
        >
          <form id="add-contact-form" action={formAction} className="flex flex-col gap-3">
            <Field label="Name">
              <Input name="name" required />
            </Field>
            <Field label="Company">
              <Input name="company" list="company-names" />
              <datalist id="company-names">
                {companyNames.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </Field>
            <Field label="Title">
              <Input name="title" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Email">
                <Input
                  name="email"
                  type="email"
                  onBlur={(e) => checkEmail(e.target.value)}
                />
              </Field>
              <Field label="Phone">
                <Input name="phone" type="tel" />
              </Field>
            </div>
            {duplicate && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                {duplicate.name} at {duplicate.company} already has this email — saving will
                add a second contact.
              </p>
            )}
          </form>
        </Modal>
      )}
    </>
  );
}
