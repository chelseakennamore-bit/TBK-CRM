"use client";

import { useActionState, useState } from "react";
import { createProject } from "@/app/actions/projects";
import { Button, Field, Input } from "@/components/ui";
import { Modal } from "@/components/Modal";

export function AddProjectModal() {
  const [open, setOpen] = useState(false);
  const [, formAction, pending] = useActionState(async (_prev: null, formData: FormData) => {
    await createProject(formData);
    setOpen(false);
    return null;
  }, null);

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        Add project
      </Button>
      {open && (
        <Modal
          title="Add project"
          onClose={() => setOpen(false)}
          footer={
            <>
              <Button type="button" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" form="add-project-form" variant="primary" disabled={pending}>
                Save
              </Button>
            </>
          }
        >
          <form id="add-project-form" action={formAction} className="flex flex-col gap-3">
            <Field label="Project name">
              <Input name="name" required />
            </Field>
            <Field label="Client">
              <Input name="client" />
            </Field>
            <Field label="Due date">
              <Input name="dueDate" type="date" />
            </Field>
          </form>
        </Modal>
      )}
    </>
  );
}
