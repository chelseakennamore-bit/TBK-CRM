"use client";

import { useEffect, useState } from "react";
import { deleteLead } from "@/app/actions/leads";
import { Button, Table, Td, Th, Tag } from "@/components/ui";
import { Modal } from "@/components/Modal";
import { DeleteButton } from "@/components/DeleteButton";
import { SendEmailModal } from "@/components/modals/SendEmailModal";
import { ConvertButton } from "./ConvertButton";
import { LeadFollowUpDate } from "./LeadFollowUpDate";
import { daysAgo, fmtDate, toDateInputValue } from "@/lib/format";

type Lead = {
  id: string;
  name: string;
  company: string;
  email: string;
  message: string;
  source: string;
  receivedAt: string;
  status: string;
  nextFollowUpAt: string | null;
};

function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return new Date(dateStr).getTime() < Date.now();
}

export function LeadsTable({ leads: initialLeads }: { leads: Lead[] }) {
  const [leads, setLeads] = useState(initialLeads);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Lead | null>(null);

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    fetch(`/api/leads/${selectedId}`)
      .then((r) => r.json())
      .then((d) => !cancelled && setDetail(d));
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const loadedDetail = detail && detail.id === selectedId ? detail : null;

  return (
    <>
      <Table>
        <thead>
          <tr>
            <Th>Name</Th>
            <Th>Company</Th>
            <Th>Email</Th>
            <Th>Inquiry</Th>
            <Th>Source</Th>
            <Th>Received</Th>
            <Th>Status</Th>
            <Th>Follow-up</Th>
            <Th />
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr
              key={lead.id}
              className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
              onClick={() => setSelectedId(lead.id)}
            >
              <Td className="font-semibold text-zinc-900 dark:text-zinc-50">
                {lead.name}
              </Td>
              <Td>{lead.company}</Td>
              <Td>
                <a
                  href={`mailto:${lead.email}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  {lead.email}
                </a>
              </Td>
              <Td className="max-w-[220px] truncate text-sm text-zinc-500 dark:text-zinc-400">
                {lead.message}
              </Td>
              <Td className="text-sm text-zinc-500 dark:text-zinc-400">
                {lead.source}
              </Td>
              <Td className="text-sm text-zinc-500 dark:text-zinc-400">
                {daysAgo(lead.receivedAt)}
              </Td>
              <Td>
                <Tag variant={lead.status === "new" ? "accent" : "neutral"}>
                  {lead.status === "new" ? "New" : "In pipeline"}
                </Tag>
              </Td>
              <Td onClick={(e) => e.stopPropagation()}>
                <LeadFollowUpDate
                  leadId={lead.id}
                  initialDate={toDateInputValue(lead.nextFollowUpAt)}
                />
              </Td>
              <Td onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-2">
                  {lead.status === "new" && <ConvertButton leadId={lead.id} />}
                  <SendEmailModal
                    triggerLabel="Email"
                    defaultTo={lead.email}
                    defaultSubject=""
                    defaultMessage=""
                  />
                  <DeleteButton
                    onDelete={deleteLead.bind(null, lead.id)}
                    confirmText={`Delete the lead "${lead.name}"? This can't be undone.`}
                    onDeleted={() => {
                      setLeads((prev) => prev.filter((l) => l.id !== lead.id));
                      if (selectedId === lead.id) setSelectedId(null);
                    }}
                  />
                </div>
              </Td>
            </tr>
          ))}
          {leads.length === 0 && (
            <tr>
              <Td colSpan={9} className="text-center text-zinc-400">
                No leads yet.
              </Td>
            </tr>
          )}
        </tbody>
      </Table>

      {selectedId && (
        <Modal
          title={loadedDetail ? loadedDetail.name : "Loading…"}
          subtitle={loadedDetail ? loadedDetail.company : undefined}
          onClose={() => setSelectedId(null)}
          footer={
            <div className="flex w-full items-center justify-between gap-2">
              {loadedDetail && (
                <DeleteButton
                  onDelete={deleteLead.bind(null, loadedDetail.id)}
                  confirmText={`Delete the lead "${loadedDetail.name}"? This can't be undone.`}
                  onDeleted={() => {
                    setLeads((prev) => prev.filter((l) => l.id !== loadedDetail.id));
                    setSelectedId(null);
                  }}
                />
              )}
              <div className="flex items-center gap-2">
                {loadedDetail && (
                  <SendEmailModal
                    triggerLabel="Send email"
                    defaultTo={loadedDetail.email}
                    defaultSubject=""
                    defaultMessage=""
                  />
                )}
                {loadedDetail && loadedDetail.status === "new" && (
                  <ConvertButton leadId={loadedDetail.id} />
                )}
                <Button onClick={() => setSelectedId(null)}>Close</Button>
              </div>
            </div>
          }
        >
          {!loadedDetail ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Email
                  </div>
                  <a
                    href={`mailto:${loadedDetail.email}`}
                    className="text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    {loadedDetail.email || "—"}
                  </a>
                </div>
                <div>
                  <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Company
                  </div>
                  <div className="text-zinc-900 dark:text-zinc-50">
                    {loadedDetail.company}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Source
                  </div>
                  <div className="text-zinc-900 dark:text-zinc-50">
                    {loadedDetail.source}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Received
                  </div>
                  <div className="text-zinc-900 dark:text-zinc-50">
                    {fmtDate(loadedDetail.receivedAt)} ({daysAgo(loadedDetail.receivedAt)})
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Inquiry
                </div>
                <div className="whitespace-pre-wrap text-sm text-zinc-900 dark:text-zinc-50">
                  {loadedDetail.message}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Status
                  </div>
                  <Tag variant={loadedDetail.status === "new" ? "accent" : "neutral"}>
                    {loadedDetail.status === "new" ? "New" : "In pipeline"}
                  </Tag>
                </div>
                <div>
                  <div className="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Next follow-up
                  </div>
                  <LeadFollowUpDate
                    leadId={loadedDetail.id}
                    initialDate={toDateInputValue(loadedDetail.nextFollowUpAt)}
                  />
                  {isOverdue(loadedDetail.nextFollowUpAt) && (
                    <Tag variant="accent-2" className="ml-2">
                      Overdue
                    </Tag>
                  )}
                </div>
              </div>
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
