"use client";

import { useEffect, useState } from "react";
import { Button, Field, Input, Select, Table, Td, Th, Tag } from "@/components/ui";
import { Modal } from "@/components/Modal";
import {
  addCompanyNote,
  deleteCompany,
  setPrimaryContact,
  updateCompanyDetails,
} from "@/app/actions/companies";
import { DeleteButton } from "@/components/DeleteButton";
import { money, fmtDate, daysAgo } from "@/lib/format";
import { COMPANY_SIZES } from "@/lib/constants";

type Company = {
  id: string;
  name: string;
  website: string;
  notes: string;
  primaryContactName: string | null;
  contactCount: number;
  dealCount: number;
  projectCount: number;
  invoiceCount: number;
};

type LineItem = { id: string; description: string; detail: string; amount: number };
type DealSummary = {
  id: string;
  title: string;
  stage: string;
  value: number;
  revenueStream: string;
  paymentTerms: string;
  lineItems: LineItem[];
};
type ProjectSummary = {
  id: string;
  name: string;
  status: string;
  health: string;
  dueDate: string | null;
};
type InvoiceSummary = { id: string; amount: number; status: string; dueDate: string | null };
type CompanyActivity = { id: string; text: string; ts: string };

type CompanyDetail = {
  id: string;
  name: string;
  website: string;
  notes: string;
  industry: string;
  companySize: string;
  icpTier: string;
  governmentContractor: boolean;
  contacts: { id: string; name: string; title: string; email: string }[];
  primaryContact: { id: string; name: string } | null;
  deals: DealSummary[];
  projects: ProjectSummary[];
  invoices: InvoiceSummary[];
  activities: CompanyActivity[];
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

  async function refreshDetail() {
    if (!selectedId) return;
    const res = await fetch(`/api/companies/${selectedId}`);
    setDetail(await res.json());
  }

  return (
    <>
      <Table>
        <thead>
          <tr>
            <Th>Name</Th>
            <Th>Website</Th>
            <Th>Primary contact</Th>
            <Th>Contacts</Th>
            <Th>Deals</Th>
            <Th>Projects</Th>
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
              <Td className="text-zinc-500 dark:text-zinc-400">
                {c.primaryContactName || "—"}
              </Td>
              <Td>{c.contactCount}</Td>
              <Td>{c.dealCount}</Td>
              <Td>{c.projectCount}</Td>
              <Td>{c.invoiceCount}</Td>
            </tr>
          ))}
          {companies.length === 0 && (
            <tr>
              <Td colSpan={7} className="text-center text-zinc-400">
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
          footer={
            <div className="flex w-full items-center justify-between gap-2">
              {loadedDetail && (
                <DeleteButton
                  onDelete={deleteCompany.bind(null, loadedDetail.id)}
                  confirmText={`Delete the company "${loadedDetail.name}"? This can't be undone.`}
                  onDeleted={() => setSelectedId(null)}
                />
              )}
              <Button onClick={() => setSelectedId(null)}>Close</Button>
            </div>
          }
        >
          {!loadedDetail ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
          ) : (
            <CompanyDetailBody
              key={loadedDetail.id}
              detail={loadedDetail}
              onRefresh={refreshDetail}
            />
          )}
        </Modal>
      )}
    </>
  );
}

function CompanyDetailBody({
  detail,
  onRefresh,
}: {
  detail: CompanyDetail;
  onRefresh: () => Promise<void>;
}) {
  const [showMore, setShowMore] = useState(
    Boolean(detail.industry || detail.companySize || detail.icpTier || detail.governmentContractor)
  );
  const [industry, setIndustry] = useState(detail.industry);
  const [companySize, setCompanySize] = useState(detail.companySize);
  const [icpTier, setIcpTier] = useState(detail.icpTier);
  const [govContractor, setGovContractor] = useState(detail.governmentContractor);
  const [primaryContactId, setPrimaryContactId] = useState(detail.primaryContact?.id ?? "");
  const [newNote, setNewNote] = useState("");
  const wonDeals = detail.deals.filter((d) => d.stage === "Won");
  const lifetimeValue = detail.invoices
    .filter((i) => i.status === "Paid")
    .reduce((a, i) => a + i.amount, 0);

  return (
    <div className="flex flex-col gap-5">
      {detail.notes && (
        <p className="text-sm text-zinc-600 dark:text-zinc-300">{detail.notes}</p>
      )}

      <div className="flex gap-8 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
        <div>
          <div className="text-[11px] font-medium tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
            Lifetime value
          </div>
          <div className="mt-0.5 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {money(lifetimeValue)}
          </div>
        </div>
        <div>
          <div className="text-[11px] font-medium tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
            Primary contact
          </div>
          <div className="mt-0.5 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {detail.primaryContact?.name ?? "—"}
          </div>
        </div>
      </div>

      {!showMore ? (
        <button
          type="button"
          onClick={() => setShowMore(true)}
          className="self-start text-sm text-indigo-600 hover:underline dark:text-indigo-400"
        >
          + Add industry, size, GovCon status…
        </button>
      ) : (
        <div className="flex flex-col gap-3 border-b border-zinc-200 pb-4 dark:border-zinc-800">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Industry">
              <Input
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                onBlur={() => updateCompanyDetails(detail.id, { industry })}
              />
            </Field>
            <Field label="Company size">
              <Select
                value={companySize}
                onChange={(e) => {
                  setCompanySize(e.target.value);
                  updateCompanyDetails(detail.id, { companySize: e.target.value });
                }}
              >
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
            <Input
              value={icpTier}
              placeholder="e.g. Tier 1"
              onChange={(e) => setIcpTier(e.target.value)}
              onBlur={() => updateCompanyDetails(detail.id, { icpTier })}
            />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={govContractor}
              onChange={(e) => {
                setGovContractor(e.target.checked);
                updateCompanyDetails(detail.id, { governmentContractor: e.target.checked });
              }}
            />
            <span className="text-zinc-700 dark:text-zinc-300">Government contractor</span>
          </label>
        </div>
      )}

      <div>
        <div className="mb-1 flex items-center justify-between">
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Contacts ({detail.contacts.length})
          </div>
          {detail.contacts.length > 0 && (
            <Select
              value={primaryContactId}
              onChange={(e) => {
                const next = e.target.value;
                setPrimaryContactId(next);
                setPrimaryContact(detail.id, next || null);
              }}
              className="max-w-[220px]"
            >
              <option value="">No primary contact</option>
              {detail.contacts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          {detail.contacts.map((p) => (
            <div key={p.id} className="text-sm">
              {p.id === primaryContactId && <span title="Primary contact">★ </span>}
              <span className="font-medium text-zinc-900 dark:text-zinc-50">{p.name}</span>
              {p.title && (
                <span className="text-zinc-500 dark:text-zinc-400"> · {p.title}</span>
              )}
              {p.email && (
                <span className="text-zinc-500 dark:text-zinc-400"> · {p.email}</span>
              )}
            </div>
          ))}
          {detail.contacts.length === 0 && (
            <div className="text-sm text-zinc-400">No contacts yet.</div>
          )}
        </div>
      </div>

      <div>
        <div className="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Deals ({detail.deals.length})
        </div>
        <div className="flex flex-col gap-1.5">
          {detail.deals.map((d) => (
            <div key={d.id} className="flex items-center gap-2 text-sm">
              <span className="font-medium text-zinc-900 dark:text-zinc-50">{d.title}</span>
              <Tag variant="outline">{d.stage}</Tag>
              <span className="text-zinc-500 dark:text-zinc-400">{money(d.value)}</span>
            </div>
          ))}
          {detail.deals.length === 0 && (
            <div className="text-sm text-zinc-400">No deals yet.</div>
          )}
        </div>
      </div>

      <div>
        <div className="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Projects ({detail.projects.length})
        </div>
        <div className="flex flex-col gap-1.5">
          {detail.projects.map((p) => (
            <div key={p.id} className="flex items-center gap-2 text-sm">
              <span className="font-medium text-zinc-900 dark:text-zinc-50">{p.name}</span>
              <Tag variant="outline">{p.status}</Tag>
              <Tag variant="neutral">{p.health}</Tag>
              {p.dueDate && (
                <span className="text-zinc-500 dark:text-zinc-400">Due {fmtDate(p.dueDate)}</span>
              )}
            </div>
          ))}
          {detail.projects.length === 0 && (
            <div className="text-sm text-zinc-400">No projects yet.</div>
          )}
        </div>
      </div>

      <div>
        <div className="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Contracts ({wonDeals.length})
        </div>
        <div className="flex flex-col gap-3">
          {wonDeals.map((d) => (
            <div
              key={d.id}
              className="rounded-lg border border-zinc-200 p-2.5 dark:border-zinc-800"
            >
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-zinc-900 dark:text-zinc-50">{d.title}</span>
                {d.revenueStream && <Tag variant="accent">{d.revenueStream}</Tag>}
                {d.paymentTerms && <Tag variant="outline">{d.paymentTerms}</Tag>}
              </div>
              {d.lineItems.length > 0 && (
                <div className="mt-1.5 flex flex-col gap-0.5 pl-0.5">
                  {d.lineItems.map((li) => (
                    <div
                      key={li.id}
                      className="flex items-center justify-between gap-2 text-xs text-zinc-500 dark:text-zinc-400"
                    >
                      <span>
                        {li.description}
                        {li.detail && ` — ${li.detail}`}
                      </span>
                      <span className="whitespace-nowrap">{money(li.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Total {money(d.value)}
              </div>
            </div>
          ))}
          {wonDeals.length === 0 && (
            <div className="text-sm text-zinc-400">No contracts yet.</div>
          )}
        </div>
      </div>

      <div>
        <div className="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Invoices ({detail.invoices.length})
        </div>
        <div className="flex flex-col gap-1.5">
          {detail.invoices.map((inv) => (
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
          {detail.invoices.length === 0 && (
            <div className="text-sm text-zinc-400">No invoices yet.</div>
          )}
        </div>
      </div>

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
              await addCompanyNote(detail.id, newNote);
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
