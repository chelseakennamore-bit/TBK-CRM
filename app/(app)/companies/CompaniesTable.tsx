"use client";

import { useEffect, useState } from "react";
import { Button, Field, Input, Select, Table, Td, Th, Tag } from "@/components/ui";
import { Modal } from "@/components/Modal";
import { updateCompanyDetails } from "@/app/actions/companies";
import { money, fmtDate } from "@/lib/format";
import { COMPANY_SIZES } from "@/lib/constants";

type Company = {
  id: string;
  name: string;
  website: string;
  notes: string;
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
  deals: DealSummary[];
  projects: ProjectSummary[];
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
              <Td>{c.contactCount}</Td>
              <Td>{c.dealCount}</Td>
              <Td>{c.projectCount}</Td>
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
            <CompanyDetailBody key={loadedDetail.id} detail={loadedDetail} />
          )}
        </Modal>
      )}
    </>
  );
}

function CompanyDetailBody({ detail }: { detail: CompanyDetail }) {
  const [showMore, setShowMore] = useState(
    Boolean(detail.industry || detail.companySize || detail.icpTier || detail.governmentContractor)
  );
  const [industry, setIndustry] = useState(detail.industry);
  const [companySize, setCompanySize] = useState(detail.companySize);
  const [icpTier, setIcpTier] = useState(detail.icpTier);
  const [govContractor, setGovContractor] = useState(detail.governmentContractor);
  const wonDeals = detail.deals.filter((d) => d.stage === "Won");

  return (
    <div className="flex flex-col gap-5">
      {detail.notes && (
        <p className="text-sm text-zinc-600 dark:text-zinc-300">{detail.notes}</p>
      )}

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
        <div className="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Contacts ({detail.contacts.length})
        </div>
        <div className="flex flex-col gap-1.5">
          {detail.contacts.map((p) => (
            <div key={p.id} className="text-sm">
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
    </div>
  );
}
