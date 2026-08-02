"use client";

import { useEffect, useState } from "react";
import {
  addInvoiceNote,
  deleteInvoice,
  updateInvoiceDetails,
  updateInvoiceStatus,
} from "@/app/actions/invoices";
import { Button, Field, Input, LinkButton, Select, Table, Td, Textarea, Th, Tag } from "@/components/ui";
import { Modal } from "@/components/Modal";
import { DeleteButton } from "@/components/DeleteButton";
import { daysAgo, fmtDate, money, toDateInputValue } from "@/lib/format";
import { INVOICE_STATUSES, REVENUE_STREAMS } from "@/lib/constants";

type Invoice = {
  id: string;
  invoiceNumber: number | null;
  client: string;
  amount: number;
  status: string;
  issuedAt: string;
  dueDate: string | null;
  dealTitle: string | null;
};

type Activity = { id: string; text: string; ts: string };
type InvoiceDetail = Invoice & {
  revenueStream: string;
  notes: string;
  paidAt: string | null;
  deal: { id: string; title: string } | null;
  activities: Activity[];
};

function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return new Date(dateStr).getTime() < Date.now();
}

export function InvoicesTable({ invoices: initialInvoices }: { invoices: Invoice[] }) {
  const [invoices, setInvoices] = useState(initialInvoices);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<InvoiceDetail | null>(null);

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    fetch(`/api/invoices/${selectedId}`)
      .then((r) => r.json())
      .then((d) => !cancelled && setDetail(d));
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const loadedDetail = detail && detail.id === selectedId ? detail : null;

  async function refreshDetail() {
    if (!selectedId) return;
    const res = await fetch(`/api/invoices/${selectedId}`);
    setDetail(await res.json());
  }

  function patchInvoice(id: string, patch: Partial<Invoice>) {
    setInvoices((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
    setDetail((prev) => (prev && prev.id === id ? { ...prev, ...patch } : prev));
  }

  return (
    <>
      <Table>
        <thead>
          <tr>
            <Th>#</Th>
            <Th>Client</Th>
            <Th>Linked deal</Th>
            <Th>Amount</Th>
            <Th>Issued</Th>
            <Th>Due</Th>
            <Th>Status</Th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => (
            <tr
              key={inv.id}
              className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
              onClick={() => setSelectedId(inv.id)}
            >
              <Td className="text-zinc-500 dark:text-zinc-400">
                {inv.invoiceNumber ? `#${inv.invoiceNumber}` : "—"}
              </Td>
              <Td className="font-semibold text-zinc-900 dark:text-zinc-50">
                {inv.client}
              </Td>
              <Td className="text-sm text-zinc-500 dark:text-zinc-400">
                {inv.dealTitle ?? "—"}
              </Td>
              <Td className="font-semibold text-zinc-900 dark:text-zinc-50">
                {money(inv.amount)}
              </Td>
              <Td className="text-sm text-zinc-500 dark:text-zinc-400">
                {fmtDate(inv.issuedAt)}
              </Td>
              <Td className="text-sm text-zinc-500 dark:text-zinc-400">
                {fmtDate(inv.dueDate)}
              </Td>
              <Td onClick={(e) => e.stopPropagation()}>
                <Select
                  value={inv.status}
                  onChange={(e) => {
                    const next = e.target.value;
                    patchInvoice(inv.id, { status: next });
                    updateInvoiceStatus(inv.id, next);
                  }}
                >
                  {INVOICE_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </Td>
            </tr>
          ))}
          {invoices.length === 0 && (
            <tr>
              <Td colSpan={7} className="text-center text-zinc-400">
                No invoices yet.
              </Td>
            </tr>
          )}
        </tbody>
      </Table>

      {selectedId && (
        <Modal
          title={
            loadedDetail
              ? `${loadedDetail.client}${loadedDetail.invoiceNumber ? ` — #${loadedDetail.invoiceNumber}` : ""}`
              : "Loading…"
          }
          subtitle={loadedDetail ? money(loadedDetail.amount) : undefined}
          onClose={() => setSelectedId(null)}
          footer={
            <div className="flex w-full items-center justify-between gap-2">
              {loadedDetail && (
                <DeleteButton
                  onDelete={deleteInvoice.bind(null, loadedDetail.id)}
                  confirmText={`Delete the ${money(loadedDetail.amount)} invoice for ${loadedDetail.client}? This can't be undone.`}
                  onDeleted={() => {
                    setInvoices((prev) => prev.filter((i) => i.id !== loadedDetail.id));
                    setSelectedId(null);
                  }}
                />
              )}
              <div className="flex items-center gap-2">
                {loadedDetail && (
                  <LinkButton href={`/invoices/${loadedDetail.id}/print`} target="_blank">
                    View invoice
                  </LinkButton>
                )}
                <Button onClick={() => setSelectedId(null)}>Close</Button>
              </div>
            </div>
          }
        >
          {!loadedDetail ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
          ) : (
            <InvoiceDetailBody
              key={loadedDetail.id}
              detail={loadedDetail}
              onFieldsCommit={(fields) => patchInvoice(loadedDetail.id, fields)}
              onRefresh={refreshDetail}
            />
          )}
        </Modal>
      )}
    </>
  );
}

function InvoiceDetailBody({
  detail,
  onFieldsCommit,
  onRefresh,
}: {
  detail: InvoiceDetail;
  onFieldsCommit: (fields: Partial<Invoice>) => void;
  onRefresh: () => Promise<void>;
}) {
  const [status, setStatus] = useState(detail.status);
  const [revenueStream, setRevenueStream] = useState(detail.revenueStream);
  const [dueDate, setDueDate] = useState(toDateInputValue(detail.dueDate));
  const [paidAt, setPaidAt] = useState(toDateInputValue(detail.paidAt));
  const [notes, setNotes] = useState(detail.notes);
  const [newNote, setNewNote] = useState("");

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Client</div>
          <div className="text-zinc-900 dark:text-zinc-50">{detail.client}</div>
        </div>
        <div>
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Linked deal</div>
          <div className="text-zinc-900 dark:text-zinc-50">{detail.deal?.title ?? "—"}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Status">
          <Select
            value={status}
            onChange={async (e) => {
              const next = e.target.value;
              setStatus(next);
              onFieldsCommit({ status: next });
              // Mirrors the server's auto-stamp/clear logic locally so the
              // paid-on field reflects it immediately, without waiting on
              // a refetch (this component's local state won't otherwise
              // pick up a prop change on the same mounted instance).
              if (next === "Paid") {
                setPaidAt((prev) => prev || toDateInputValue(new Date()));
              } else {
                setPaidAt("");
              }
              await updateInvoiceStatus(detail.id, next);
              await onRefresh();
            }}
          >
            {INVOICE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Revenue stream">
          <Select
            value={revenueStream}
            onChange={(e) => {
              const next = e.target.value;
              setRevenueStream(next);
              updateInvoiceDetails(detail.id, { revenueStream: next });
            }}
          >
            <option value="">—</option>
            {REVENUE_STREAMS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Due date">
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => {
              setDueDate(e.target.value);
              onFieldsCommit({ dueDate: e.target.value ? new Date(e.target.value).toISOString() : null });
              updateInvoiceDetails(detail.id, { dueDate: e.target.value });
            }}
          />
        </Field>
        <Field label="Paid on">
          <Input
            type="date"
            value={paidAt}
            onChange={(e) => {
              setPaidAt(e.target.value);
              updateInvoiceDetails(detail.id, { paidAt: e.target.value });
            }}
          />
        </Field>
      </div>

      {isOverdue(detail.dueDate) && detail.status !== "Paid" && (
        <Tag variant="accent-2" className="self-start">
          Overdue
        </Tag>
      )}

      <Field label="Notes">
        <Textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => updateInvoiceDetails(detail.id, { notes })}
        />
      </Field>

      <div>
        <div className="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Activity
        </div>
        <div className="flex max-h-40 flex-col gap-2 overflow-y-auto">
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
              await addInvoiceNote(detail.id, newNote);
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
