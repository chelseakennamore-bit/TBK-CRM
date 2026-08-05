"use client";

import { useState } from "react";
import { sendCrmEmail } from "@/app/actions/email";
import { Button, Field, Input, Textarea } from "@/components/ui";
import { Modal } from "@/components/Modal";

export function SendEmailModal({
  triggerLabel = "Send email",
  defaultTo,
  defaultSubject,
  defaultMessage,
  contactId,
  dealId,
  invoiceId,
  projectId,
  onSent,
}: {
  triggerLabel?: string;
  defaultTo: string;
  defaultSubject: string;
  defaultMessage: string;
  contactId?: string;
  dealId?: string;
  invoiceId?: string;
  projectId?: string;
  onSent?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [to, setTo] = useState(defaultTo);
  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState(defaultMessage);
  const [pending, setPending] = useState(false);

  function reset() {
    setTo(defaultTo);
    setSubject(defaultSubject);
    setMessage(defaultMessage);
  }

  return (
    <>
      <Button
        type="button"
        onClick={() => {
          reset();
          setOpen(true);
        }}
      >
        {triggerLabel}
      </Button>
      {open && (
        <Modal
          title="Send email"
          onClose={() => setOpen(false)}
          footer={
            <>
              <Button type="button" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                disabled={pending}
                onClick={async () => {
                  setPending(true);
                  const result = await sendCrmEmail({
                    to,
                    subject,
                    message,
                    contactId,
                    dealId,
                    invoiceId,
                    projectId,
                  });
                  setPending(false);
                  if (!result.ok) {
                    window.alert(result.error ?? "Couldn't send this email.");
                    return;
                  }
                  setOpen(false);
                  onSent?.();
                }}
              >
                {pending ? "Sending…" : "Send"}
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-3">
            <Field label="To">
              <Input
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                required
              />
            </Field>
            <Field label="Subject">
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </Field>
            <Field label="Message">
              <Textarea
                rows={8}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </Field>
          </div>
        </Modal>
      )}
    </>
  );
}
