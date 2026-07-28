"use client";

import { useActionState, useState } from "react";
import { createLead } from "@/app/actions/leads";
import { Button, Field, Input, Textarea } from "@/components/ui";
import { Modal } from "@/components/Modal";

export function AddLeadModal() {
  const [open, setOpen] = useState(false);
  const [, formAction, pending] = useActionState(async (_prev: null, formData: FormData) => {
    await createLead(formData);
    setOpen(false);
    return null;
  }, null);

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        Add lead
      </Button>
      {open && (
        <Modal
          title="Add lead"
          onClose={() => setOpen(false)}
          footer={
            <>
              <Button type="button" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                form="add-lead-form"
                variant="primary"
                disabled={pending}
              >
                Save
              </Button>
            </>
          }
        >
          <form
            id="add-lead-form"
            action={formAction}
            className="flex flex-col gap-3"
          >
            <Field label="Contact name">
              <Input name="name" required />
            </Field>
            <Field label="Company">
              <Input name="company" />
            </Field>
            <Field label="Email">
              <Input name="email" type="email" />
            </Field>
            <Field label="What do they need?">
              <Textarea name="message" rows={3} />
            </Field>
          </form>
        </Modal>
      )}
    </>
  );
}
