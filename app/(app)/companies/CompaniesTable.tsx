"use client";

import { useEffect, useState } from "react";
import { Button, Table, Td, Th, Tag } from "@/components/ui";
import { Modal } from "@/components/Modal";
import { money, fmtDate } from "@/lib/format";

type Company = {
  id: string;
  name: string;
  website: string;
  notes: string;
  contactCount: number;
  dealCount: number;
  invoiceCount: number;
};

type CompanyDetail = {
  id: string;
  name: string;
  website: string;
  notes: string;
  contacts: { id: string; name: string; title: string; email: string }[];
  deals: { id: string; title: string; stage: string; value: number }[];
  invoices: { id: string; amount: number; status: string; dueDate: string | null }[];
};

export function CompaniesTable({ companies }: { companies: Company[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<CompanyDetail | null>(null);

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    fetch(`/api/companies/${selectedId}`)
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
            <Th>Website</Th>
            <Th>Contacts</Th>
            <Th>Deals</Th>
            <Th>Invoices</Th>
          </tr>
        </thead>
        <tbody>
          {companies.map((c) => (
            <tr
              key={c.id}
              className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
              onClick={() => setSelectedId(c.id)}
            >
              <Td className="font-semibold text-zinc-900 dark:text-zinc-50">
                {c.name}
              </Td>
              <Td className="text-zinc-500 dark:text-zinc-400">
                {c.website || "—"}
              </Td>
              <Td>{c.contactCount}</Td>
              <Td>{c.dealCount}</Td>
              <Td>{c.invoiceCount}</Td>
            </tr>
          ))}
          {companies.length === 0 && (
            <tr>
              <Td colSpan={5} className="text-center text-zinc-400">
                No companies yet.
              </Td>
            </tr>
          )}
        </tbody>
      </Table>

      {selectedId && (
        <Modal
          title={loadedDetail ? loadedDetail.name : "Loading…"}
          subtitle={loadedDetail?.website || undefined}
          onClose={() => setSelectedId(null)}
          footer={<Button onClick={() => setSelectedId(null)}>Close</Button>}
        >
          {!loadedDetail ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
          ) : (
            <div className="flex flex-col gap-5">
              {loadedDetail.notes && (
                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                  {loadedDetail.notes}
                </p>
              )}

              <div>
                <div className="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Contacts ({loadedDetail.contacts.length})
                </div>
                <div className="flex flex-col gap-1.5">
                  {loadedDetail.contacts.map((p) => (
                    <div key={p.id} className="text-sm">
                      <span className="font-medium text-zinc-900 dark:text-zinc-50">
                        {p.name}
                      </span>
                      {p.title && (
                        <span className="text-zinc-500 dark:text-zinc-400"> · {p.title}</span>
                      )}
                      {p.email && (
                        <span className="text-zinc-500 dark:text-zinc-400"> · {p.email}</span>
                      )}
                    </div>
                  ))}
                  {loadedDetail.contacts.length === 0 && (
                    <div className="text-sm text-zinc-400">No contacts yet.</div>
                  )}
                </div>
              </div>

              <div>
                <div className="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Deals ({loadedDetail.deals.length})
                </div>
                <div className="flex flex-col gap-1.5">
                  {loadedDetail.deals.map((d) => (
                    <div key={d.id} className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-zinc-900 dark:text-zinc-50">
                        {d.title}
                      </span>
                      <Tag variant="outline">{d.stage}</Tag>
                      <span className="text-zinc-500 dark:text-zinc-400">{money(d.value)}</span>
                    </div>
                  ))}
                  {loadedDetail.deals.length === 0 && (
                    <div className="text-sm text-zinc-400">No deals yet.</div>
                  )}
                </div>
              </div>

              <div>
                <div className="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Invoices ({loadedDetail.invoices.length})
                </div>
                <div className="flex flex-col gap-1.5">
                  {loadedDetail.invoices.map((inv) => (
                    <div key={inv.id} className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-zinc-900 dark:text-zinc-50">
                        {money(inv.amount)}
                      </span>
                      <Tag variant="outline">{inv.status}</Tag>
                      <span className="text-zinc-500 dark:text-zinc-400">
                        Due {fmtDate(inv.dueDate)}
                      </span>
                    </div>
                  ))}
                  {loadedDetail.invoices.length === 0 && (
                    <div className="text-sm text-zinc-400">No invoices yet.</div>
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
