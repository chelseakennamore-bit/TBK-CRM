"use client";

import { useEffect, useState } from "react";
import { addContactNote } from "@/app/actions/contacts";
import { Button, Field, Input, Table, Td, Th } from "@/components/ui";
import { Modal } from "@/components/Modal";
import { daysAgo } from "@/lib/format";

type Contact = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  title: string;
};
type Activity = { id: string; text: string; ts: string };
type ContactDetail = Contact & { activities: Activity[] };

export function ContactsTable({ contacts }: { contacts: Contact[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ContactDetail | null>(null);
  const [newNote, setNewNote] = useState("");

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
            </tr>
          ))}
          {contacts.length === 0 && (
            <tr>
              <Td colSpan={5} className="text-center text-zinc-400">
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
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Email">
                  <div className="text-sm">{loadedDetail.email || "—"}</div>
                </Field>
                <Field label="Phone">
                  <div className="text-sm">{loadedDetail.phone || "—"}</div>
                </Field>
              </div>
              <div>
                <div className="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Activity
                </div>
                <div className="flex max-h-56 flex-col gap-2 overflow-y-auto">
                  {loadedDetail.activities.map((a) => (
                    <div key={a.id} className="text-sm">
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        {daysAgo(a.ts)}
                      </div>
                      <div>{a.text}</div>
                    </div>
                  ))}
                  {loadedDetail.activities.length === 0 && (
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
                      if (!newNote.trim() || !loadedDetail) return;
                      await addContactNote(loadedDetail.id, newNote);
                      setNewNote("");
                      await refreshDetail();
                    }}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
