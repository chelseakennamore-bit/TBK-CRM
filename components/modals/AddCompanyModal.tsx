"use client";

import { useActionState, useState } from "react";
import { createCompany } from "@/app/actions/companies";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";
import { Modal } from "@/components/Modal";
import { COMPANY_SIZES } from "@/lib/constants";

export function AddCompanyModal() {
  const [open, setOpen] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [, formAction, pending] = useActionState(async (_prev: null, formData: FormData) => {
    await createCompany(formData);
    setOpen(false);
    setShowMore(false);
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

            {!showMore ? (
              <button
                type="button"
                onClick={() => setShowMore(true)}
                className="self-start text-sm text-indigo-600 hover:underline dark:text-indigo-400"
              >
                + Add industry, size, GovCon status…
              </button>
            ) : (
              <div className="flex flex-col gap-3 border-t border-zinc-200 pt-3 dark:border-zinc-800">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Industry">
                    <Input name="industry" />
                  </Field>
                  <Field label="Company size">
                    <Select name="companySize" defaultValue="">
                      <option value="">—</option>
                      {COMPANY_SIZES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
                <Field label="ICP tier">
                  <Input name="icpTier" placeholder="e.g. Tier 1" />
                </Field>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="governmentContractor" />
                  <span className="text-zinc-700 dark:text-zinc-300">
                    Government contractor
                  </span>
                </label>
              </div>
            )}
          </form>
        </Modal>
      )}
    </>
  );
}
