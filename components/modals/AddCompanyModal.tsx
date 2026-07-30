"use client";

import { useActionState, useState } from "react";
import { createCompany } from "@/app/actions/companies";
import { Button, Field, Input, Textarea } from "@/components/ui";
import { Modal } from "@/components/Modal";

export function AddCompanyModal() {
  const [open, setOpen] = useState(false);
  const [, formAction, pending] = useActionState(async (_prev: null, formData: FormData) => {
    await createCompany(formData);
    setOpen(false);
    return null;
  }, null);

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        Add company
      </Button>
      {open && (
        <Modal
          title="Add company"
          onClose={() => setOpen(false)}
          footer={
            <>
              <Button type="button" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" form="add-company-form" variant="primary" disabled={pending}>
                Save
              </Button>
            </>
          }
        >
          <form id="add-company-form" action={formAction} className="flex flex-col gap-3">
            <Field label="Name">
              <Input name="name" required />
            </Field>
            <Field label="Website">
              <Input name="website" placeholder="https://" />
            </Field>
            <Field label="Notes">
              <Textarea name="notes" rows={3} />
            </Field>
          </form>
        </Modal>
      )}
    </>
  );
}
