"use client";

import { useActionState, useState } from "react";
import { importLeadsCsv } from "@/app/actions/leads";
import { Button, Field, Textarea } from "@/components/ui";
import { Modal } from "@/components/Modal";

export function ImportCsvModal() {
  const [open, setOpen] = useState(false);
  const [, formAction, pending] = useActionState(async (_prev: null, formData: FormData) => {
    await importLeadsCsv(formData);
    setOpen(false);
    return null;
  }, null);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Import CSV</Button>
      {open && (
        <Modal
          title="Import leads from CSV"
          onClose={() => setOpen(false)}
          footer={
            <>
              <Button type="button" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                form="import-csv-form"
                variant="primary"
                disabled={pending}
              >
                Save
              </Button>
            </>
          }
        >
          <form id="import-csv-form" action={formAction}>
            <p className="mb-2 text-sm text-zinc-500 dark:text-zinc-400">
              Paste rows as: name, company, email, message, source (one per line)
            </p>
            <Field label="">
              <Textarea
                name="csvText"
                rows={8}
                placeholder="Jane Doe, Acme Co, jane@acme.com, Needs help with onboarding, Referral"
              />
            </Field>
          </form>
        </Modal>
      )}
    </>
  );
}
