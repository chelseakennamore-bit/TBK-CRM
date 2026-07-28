"use client";

import { useActionState, useState } from "react";
import { createContact } from "@/app/actions/contacts";
import { Button, Field, Input } from "@/components/ui";
import { Modal } from "@/components/Modal";

export function AddContactModal() {
  const [open, setOpen] = useState(false);
  const [, formAction, pending] = useActionState(async (_prev: null, formData: FormData) => {
    await createContact(formData);
    setOpen(false);
    return null;
  }, null);

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
              <Input name="company" />
            </Field>
            <Field label="Title">
              <Input name="title" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Email">
                <Input name="email" type="email" />
              </Field>
              <Field label="Phone">
                <Input name="phone" type="tel" />
              </Field>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
