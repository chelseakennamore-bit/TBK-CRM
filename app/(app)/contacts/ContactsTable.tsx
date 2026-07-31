"use client";

import { useEffect, useState } from "react";
import {
  addContactNote,
  updateContactDetails,
  updateContactFollowUp,
  updateContactMarketingConsent,
} from "@/app/actions/contacts";
import { Button, Field, Input, Table, Td, Th, Tag } from "@/components/ui";
import { Modal } from "@/components/Modal";
import { daysAgo, fmtDate, toDateInputValue } from "@/lib/format";

type Contact = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  title: string;
  nextFollowUpAt: string | null;
};
type Activity = { id: string; text: string; ts: string };
type ContactDetail = Contact & { activities: Activity[]; marketingConsent: boolean };

function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return new Date(dateStr).getTime() < Date.now();
}

export function ContactsTable({
  contacts: initialContacts,
  companyNames = [],
}: {
  contacts: Contact[];
  companyNames?: string[];
}) {
  const [contacts, setContacts] = useState(initialContacts);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ContactDetail | null>(null);

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    fetch(`/api/contacts/${selectedId}`)
      .then((r) => r.json())
      .then((d) => !cancelled && setDetail(d));
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const loadedDetail = detail && detail.id === selectedId ? detail : null;

  async function refreshDetail() {
    if (!selectedId) return;
    const res = await fetch(`/api/contacts/${selectedId}`);
    setDetail(await res.json());
  }

  function patchContact(id: string, patch: Partial<Contact>) {
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    setDetail((prev) => (prev && prev.id === id ? { ...prev, ...patch } : prev));
  }

  return (
    <>
      <Table>
        <thead>
          <tr>
            <Th>Name</Th>
            <Th>Company</Th>
            <Th>Email</Th>
            <Th>Phone</Th>
            <Th>Title</Th>
            <Th>Follow-up</Th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((c) => (
            <tr
              key={c.id}
              className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
              onClick={() => setSelectedId(c.id)}
            >
              <Td className="font-semibold text-zinc-900 dark:text-zinc-50">
                {c.name}
              </Td>
              <Td>{c.company}</Td>
              <Td>
                <a
                  href={`mailto:${c.email}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  {c.email}
                </a>
              </Td>
              <Td className="text-zinc-500 dark:text-zinc-400">{c.phone}</Td>
              <Td className="text-zinc-500 dark:text-zinc-400">{c.title}</Td>
              <Td>
                {c.nextFollowUpAt ? (
                  <Tag variant={isOverdue(c.nextFollowUpAt) ? "accent-2" : "neutral"}>
                    {fmtDate(c.nextFollowUpAt)}
                  </Tag>
                ) : (
                  <span className="text-zinc-400">—</span>
                )}
              </Td>
            </tr>
          ))}
          {contacts.length === 0 && (
            <tr>
              <Td colSpan={6} className="text-center text-zinc-400">
                No contacts yet.
              </Td>
            </tr>
          )}
        </tbody>
      </Table>

      {selectedId && (
        <Modal
          title={loadedDetail ? loadedDetail.name : "Loading…"}
          subtitle={
            loadedDetail ? `${loadedDetail.title} · ${loadedDetail.company}` : undefined
          }
          onClose={() => setSelectedId(null)}
          footer={<Button onClick={() => setSelectedId(null)}>Close</Button>}
        >
          {!loadedDetail ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
          ) : (
            <ContactDetailBody
              key={loadedDetail.id}
              detail={loadedDetail}
              companyNames={companyNames}
              onFieldsCommit={(fields) => patchContact(loadedDetail.id, fields)}
              onRefresh={refreshDetail}
            />
          )}
        </Modal>
      )}
    </>
  );
}

function ContactDetailBody({
  detail,
  companyNames,
  onFieldsCommit,
  onRefresh,
}: {
  detail: ContactDetail;
  companyNames: string[];
  onFieldsCommit: (fields: Partial<Contact>) => void;
  onRefresh: () => Promise<void>;
}) {
  const [name, setName] = useState(detail.name);
  const [company, setCompany] = useState(detail.company);
  const [title, setTitle] = useState(detail.title);
  const [email, setEmail] = useState(detail.email);
  const [phone, setPhone] = useState(detail.phone);
  const [followUpDate, setFollowUpDate] = useState(toDateInputValue(detail.nextFollowUpAt));
  const [consent, setConsent] = useState(detail.marketingConsent);
  const [newNote, setNewNote] = useState("");

  function commitFields() {
    const fields = { name, company, title, email, phone };
    onFieldsCommit(fields);
    updateContactDetails(detail.id, fields);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} onBlur={commitFields} />
        </Field>
        <Field label="Company">
          <Input
            value={company}
            list="contact-drawer-company-names"
            onChange={(e) => setCompany(e.target.value)}
            onBlur={commitFields}
          />
          <datalist id="contact-drawer-company-names">
            {companyNames.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
        </Field>
      </div>

      <Field label="Title">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} onBlur={commitFields} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Email">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={commitFields}
          />
        </Field>
        <Field label="Phone">
          <Input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onBlur={commitFields}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Next follow-up">
          <Input
            type="date"
            value={followUpDate}
            onChange={(e) => {
              setFollowUpDate(e.target.value);
              updateContactFollowUp(detail.id, e.target.value);
            }}
          />
        </Field>
        <label className="flex items-center gap-2 pt-5 text-sm">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => {
              setConsent(e.target.checked);
              updateContactMarketingConsent(detail.id, e.target.checked);
            }}
          />
          <span className="text-zinc-700 dark:text-zinc-300">
            OK to send marketing emails
          </span>
        </label>
      </div>

      <div>
        <div className="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Activity
        </div>
        <div className="flex max-h-56 flex-col gap-2 overflow-y-auto">
          {detail.activities.map((a) => (
            <div key={a.id} className="text-sm">
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {daysAgo(a.ts)}
              </div>
              <div>{a.text}</div>
            </div>
          ))}
          {detail.activities.length === 0 && (
            <div className="text-sm text-zinc-400">No activity yet.</div>
          )}
        </div>
        <div className="mt-2 flex gap-2">
          <Input
            placeholder="Add a note"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
          />
          <Button
            onClick={async () => {
              if (!newNote.trim()) return;
              await addContactNote(detail.id, newNote);
              setNewNote("");
              await onRefresh();
            }}
          >
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}
