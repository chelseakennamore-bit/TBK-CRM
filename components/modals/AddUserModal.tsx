"use client";

import { useActionState, useState } from "react";
import { createUser } from "@/app/actions/users";
import { Button, Field, Input } from "@/components/ui";
import { Modal } from "@/components/Modal";

export function AddUserModal() {
  const [open, setOpen] = useState(false);
  const [, formAction, pending] = useActionState(async (_prev: null, formData: FormData) => {
    await createUser(formData);
    setOpen(false);
    return null;
  }, null);

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        Add user
      </Button>
      {open && (
        <Modal
          title="Add user"
          onClose={() => setOpen(false)}
          footer={
            <>
              <Button type="button" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" form="add-user-form" variant="primary" disabled={pending}>
                Save
              </Button>
            </>
          }
        >
          <form id="add-user-form" action={formAction} className="flex flex-col gap-3">
            <Field label="Name">
              <Input name="name" required />
            </Field>
            <Field label="Email">
              <Input name="email" type="email" required />
            </Field>
            <Field label="Password">
              <Input name="password" type="password" minLength={8} required />
            </Field>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              At least 8 characters. Share it with them directly -- there&apos;s no invite email.
            </p>
          </form>
        </Modal>
      )}
    </>
  );
}
