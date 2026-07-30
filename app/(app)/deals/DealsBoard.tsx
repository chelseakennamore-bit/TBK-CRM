"use client";

import { useEffect, useMemo, useState, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import {
  addDealNote,
  addDealTask,
  toggleDealTask,
  updateDealCloseDate,
  updateDealClosedLostReason,
  updateDealCompany,
  updateDealContact,
  updateDealNextStep,
  updateDealNotes,
  updateDealProbability,
  updateDealRevenueStream,
  updateDealStage,
  updateDealTitle,
  updateDealValue,
} from "@/app/actions/deals";
import { Button, Field, Input, LinkButton, Select, Tag, Textarea } from "@/components/ui";
import { Modal } from "@/components/Modal";
import { daysAgo, fmtDate, money, toDateInputValue } from "@/lib/format";
import { REVENUE_STREAMS, STAGES, STAGE_PROBABILITY } from "@/lib/constants";

type ContactOption = { id: string; name: string; company: string };

type DealSummary = {
  id: string;
  title: string;
  company: string;
  value: number;
  stage: string;
  closeDate: string | null;
  nextStep: string;
  nextStepDueAt: string | null;
};

type Task = { id: string; text: string; done: boolean };
type Activity = { id: string; text: string; ts: string };
type DealDetail = DealSummary & {
  contactName: string;
  contactId: string | null;
  notes: string;
  revenueStream: string;
  closedLostReason: string;
  probability: number;
  tasks: Task[];
  activities: Activity[];
};

function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return new Date(dateStr).getTime() < Date.now();
}

export function DealsBoard({
  initialDeals,
  initialSelectedId,
  companyNames = [],
  contacts = [],
}: {
  initialDeals: DealSummary[];
  initialSelectedId?: string;
  companyNames?: string[];
  contacts?: ContactOption[];
}) {
  const router = useRouter();
  const [deals, setDeals] = useState(initialDeals);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialSelectedId ?? null
  );
  const [detail, setDetail] = useState<DealDetail | null>(null);

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    fetch(`/api/deals/${selectedId}`)
      .then((r) => r.json())
      .then((d) => !cancelled && setDetail(d));
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const loadedDetail = detail && detail.id === selectedId ? detail : null;

  function openDeal(id: string) {
    setSelectedId(id);
    router.replace(`/deals?deal=${id}`, { scroll: false });
  }

  function closeDrawer() {
    setSelectedId(null);
    router.replace("/deals", { scroll: false });
  }

  async function refreshDetail() {
    if (!selectedId) return;
    const res = await fetch(`/api/deals/${selectedId}`);
    setDetail(await res.json());
  }

  function patchSummary(id: string, patch: Partial<DealSummary>) {
    setDeals((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  }

  const columns = useMemo(
    () =>
      STAGES.map((stage) => {
        const stageDeals = deals.filter((d) => d.stage === stage);
        return {
          stage,
          deals: stageDeals,
          count: stageDeals.length,
          value: stageDeals.reduce((a, d) => a + d.value, 0),
        };
      }),
    [deals]
  );

  function handleDrop(stage: string) {
    return (e: DragEvent) => {
      e.preventDefault();
      const dealId = e.dataTransfer.getData("text/plain");
      const deal = deals.find((d) => d.id === dealId);
      if (!deal || deal.stage === stage) return;
      patchSummary(dealId, { stage });
      updateDealStage(dealId, stage);
      if (selectedId === dealId) refreshDetail();
    };
  }

  const openDeals = deals.filter((d) => d.stage !== "Won" && d.stage !== "Lost");
  const pipelineValue = openDeals.reduce((a, d) => a + d.value, 0);

  return (
    <div>
      <p className="mt-0 mb-4 text-sm text-zinc-500 dark:text-zinc-400">
        <strong className="text-zinc-900 dark:text-zinc-50">
          {openDeals.length}
        </strong>{" "}
        open deals ·{" "}
        <strong className="text-zinc-900 dark:text-zinc-50">
          {money(pipelineValue)}
        </strong>{" "}
        pipeline value
      </p>
      <div className="flex gap-6 overflow-x-auto pb-3">
        {columns.map((col) => (
          <div
            key={col.stage}
            className="w-[260px] shrink-0"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop(col.stage)}
          >
            <div className="mb-3 flex items-baseline justify-between">
              <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                {col.stage}
              </h3>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {col.count} · {money(col.value)}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {col.deals.map((deal) => (
                <div
                  key={deal.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/plain", deal.id)}
                  onClick={() => openDeal(deal.id)}
                  className="cursor-grab rounded-lg border border-zinc-200 bg-white p-3 shadow-sm hover:border-indigo-300 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {deal.title}
                  </div>
                  <div className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
                    {deal.company}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      {money(deal.value)}
                    </div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      {fmtDate(deal.closeDate)}
                    </div>
                  </div>
                  {deal.stage !== "Won" && deal.stage !== "Lost" && (
                    <div className="mt-2 border-t border-zinc-100 pt-2 dark:border-zinc-800">
                      {deal.nextStep ? (
                        <div className="flex items-center justify-between gap-2">
                          <div className="truncate text-xs text-zinc-600 dark:text-zinc-300">
                            {deal.nextStep}
                          </div>
                          {isOverdue(deal.nextStepDueAt) && (
                            <Tag variant="accent-2" className="shrink-0">
                              Overdue
                            </Tag>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs text-zinc-400">No next step</div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {col.deals.length === 0 && (
                <div className="rounded-lg border border-dashed border-zinc-200 p-3 text-center text-xs text-zinc-400 dark:border-zinc-800">
                  No deals
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedId && (
        <Modal
          title={loadedDetail?.title ?? "Loading…"}
          subtitle={
            loadedDetail ? `${loadedDetail.company} · ${loadedDetail.contactName}` : undefined
          }
          width="560px"
          onClose={closeDrawer}
          footer={
            <>
              {loadedDetail && (
                <LinkButton href={`/deals/${loadedDetail.id}/quote`} target="_blank">
                  View quote
                </LinkButton>
              )}
              <Button onClick={closeDrawer}>Close</Button>
            </>
          }
        >
          {!loadedDetail ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
          ) : (
            <DealDrawerBody
              key={loadedDetail.id}
              detail={loadedDetail}
              companyNames={companyNames}
              contacts={contacts}
              onTitleCommit={(title) => {
                patchSummary(loadedDetail.id, { title });
                setDetail((prev) => (prev ? { ...prev, title } : prev));
                updateDealTitle(loadedDetail.id, title);
              }}
              onValueCommit={(value) => {
                patchSummary(loadedDetail.id, { value });
                updateDealValue(loadedDetail.id, value);
              }}
              onCloseDateCommit={(closeDate) => {
                patchSummary(loadedDetail.id, { closeDate });
                updateDealCloseDate(loadedDetail.id, closeDate);
              }}
              onNotesCommit={(notes) => updateDealNotes(loadedDetail.id, notes)}
              onStageChange={(stage) => {
                patchSummary(loadedDetail.id, { stage });
                updateDealStage(loadedDetail.id, stage).then(refreshDetail);
              }}
              onNextStepCommit={(nextStep, nextStepDueAt) => {
                patchSummary(loadedDetail.id, { nextStep, nextStepDueAt: nextStepDueAt || null });
                updateDealNextStep(loadedDetail.id, nextStep, nextStepDueAt);
              }}
              onRevenueStreamCommit={(revenueStream) =>
                updateDealRevenueStream(loadedDetail.id, revenueStream)
              }
              onClosedLostReasonCommit={(reason) =>
                updateDealClosedLostReason(loadedDetail.id, reason)
              }
              onProbabilityCommit={(probability) =>
                updateDealProbability(loadedDetail.id, probability)
              }
              onCompanyCommit={(company) => {
                patchSummary(loadedDetail.id, { company });
                setDetail((prev) => (prev ? { ...prev, company } : prev));
                updateDealCompany(loadedDetail.id, company);
              }}
              onContactCommit={(contactId, contactName) => {
                setDetail((prev) => (prev ? { ...prev, contactId, contactName } : prev));
                updateDealContact(loadedDetail.id, contactId, contactName);
              }}
              onAddNote={async (text) => {
                await addDealNote(loadedDetail.id, text);
                await refreshDetail();
              }}
              onAddTask={async (text) => {
                await addDealTask(loadedDetail.id, text);
                await refreshDetail();
              }}
              onToggleTask={async (taskId, done) => {
                setDetail((prev) =>
                  prev
                    ? {
                        ...prev,
                        tasks: prev.tasks.map((t) =>
                          t.id === taskId ? { ...t, done } : t
                        ),
                      }
                    : prev
                );
                await toggleDealTask(taskId, done);
              }}
            />
          )}
        </Modal>
      )}
    </div>
  );
}

function DealDrawerBody({
  detail,
  companyNames,
  contacts,
  onTitleCommit,
  onValueCommit,
  onCloseDateCommit,
  onNotesCommit,
  onStageChange,
  onNextStepCommit,
  onRevenueStreamCommit,
  onClosedLostReasonCommit,
  onProbabilityCommit,
  onCompanyCommit,
  onContactCommit,
  onAddNote,
  onAddTask,
  onToggleTask,
}: {
  detail: DealDetail;
  companyNames: string[];
  contacts: ContactOption[];
  onTitleCommit: (title: string) => void;
  onValueCommit: (value: number) => void;
  onCloseDateCommit: (closeDate: string) => void;
  onNotesCommit: (notes: string) => void;
  onStageChange: (stage: string) => void;
  onNextStepCommit: (nextStep: string, nextStepDueAt: string) => void;
  onRevenueStreamCommit: (revenueStream: string) => void;
  onClosedLostReasonCommit: (reason: string) => void;
  onProbabilityCommit: (probability: number) => void;
  onCompanyCommit: (company: string) => void;
  onContactCommit: (contactId: string, contactName: string) => void;
  onAddNote: (text: string) => Promise<void>;
  onAddTask: (text: string) => Promise<void>;
  onToggleTask: (taskId: string, done: boolean) => Promise<void>;
}) {
  const [title, setTitle] = useState(detail.title);
  const [company, setCompany] = useState(detail.company);
  const [contactId, setContactId] = useState(detail.contactId ?? "");
  const [contactName, setContactName] = useState(detail.contactName);
  const [value, setValue] = useState(String(detail.value));
  const [closeDate, setCloseDate] = useState(toDateInputValue(detail.closeDate));
  const [notes, setNotes] = useState(detail.notes);
  const [stage, setStage] = useState(detail.stage);
  const [nextStep, setNextStep] = useState(detail.nextStep);
  const [nextStepDueAt, setNextStepDueAt] = useState(toDateInputValue(detail.nextStepDueAt));
  const [revenueStream, setRevenueStream] = useState(detail.revenueStream);
  const [closedLostReason, setClosedLostReason] = useState(detail.closedLostReason);
  const [probability, setProbability] = useState(String(detail.probability));
  const [newNote, setNewNote] = useState("");
  const [newTask, setNewTask] = useState("");
  const weightedValue = Math.round((Number(value) || 0) * (Number(probability) || 0)) / 100;

  return (
    <div className="flex flex-col gap-4">
      <Field label="Deal title">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => {
            const trimmed = title.trim() || "New Engagement";
            setTitle(trimmed);
            onTitleCommit(trimmed);
          }}
        />
      </Field>

      <Field label="Company">
        <Input
          value={company}
          list="drawer-company-names"
          onChange={(e) => setCompany(e.target.value)}
          onBlur={() => onCompanyCommit(company)}
        />
        <datalist id="drawer-company-names">
          {companyNames.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Link to an existing contact">
          <Select
            value={contactId}
            onChange={(e) => {
              const id = e.target.value;
              const match = contacts.find((c) => c.id === id);
              setContactId(id);
              if (match) {
                setContactName(match.name);
                onContactCommit(id, match.name);
              } else {
                onContactCommit("", contactName);
              }
            }}
          >
            <option value="">None</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.company})
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Contact name">
          <Input
            value={contactName}
            onChange={(e) => {
              setContactName(e.target.value);
              setContactId("");
            }}
            onBlur={() => onContactCommit(contactId, contactName)}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Value">
          <Input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={() => onValueCommit(Number(value) || 0)}
          />
        </Field>
        <Field label="Close date">
          <Input
            type="date"
            value={closeDate}
            onChange={(e) => {
              setCloseDate(e.target.value);
              onCloseDateCommit(e.target.value);
            }}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Probability">
          <Input
            type="number"
            min={0}
            max={100}
            value={probability}
            onChange={(e) => setProbability(e.target.value)}
            onBlur={() => {
              const clamped = Math.max(0, Math.min(100, Number(probability) || 0));
              setProbability(String(clamped));
              onProbabilityCommit(clamped);
            }}
          />
        </Field>
        <div className="pt-5 text-sm text-zinc-500 dark:text-zinc-400">
          Weighted value: <span className="font-semibold text-zinc-900 dark:text-zinc-50">{money(weightedValue)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Stage">
          <Select
            value={stage}
            onChange={(e) => {
              const next = e.target.value;
              setStage(next);
              setProbability(String(STAGE_PROBABILITY[next] ?? 0));
              onStageChange(next);
            }}
          >
            {STAGES.map((s) => (
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
              setRevenueStream(e.target.value);
              onRevenueStreamCommit(e.target.value);
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

      {stage === "Lost" && (
        <Field label="Why was this lost?">
          <Input
            value={closedLostReason}
            placeholder="e.g. went with an in-house hire"
            onChange={(e) => setClosedLostReason(e.target.value)}
            onBlur={() => onClosedLostReasonCommit(closedLostReason)}
          />
        </Field>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Next step">
          <Input
            value={nextStep}
            placeholder="e.g. send proposal"
            onChange={(e) => setNextStep(e.target.value)}
            onBlur={() => onNextStepCommit(nextStep, nextStepDueAt)}
          />
        </Field>
        <Field label="Next step due">
          <Input
            type="date"
            value={nextStepDueAt}
            onChange={(e) => {
              setNextStepDueAt(e.target.value);
              onNextStepCommit(nextStep, e.target.value);
            }}
          />
        </Field>
      </div>

      <Field label="Notes">
        <Textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => onNotesCommit(notes)}
        />
      </Field>

      <div>
        <Label>Activity</Label>
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
              await onAddNote(newNote);
              setNewNote("");
            }}
          >
            Add
          </Button>
        </div>
      </div>

      <div>
        <Label>Tasks</Label>
        <div className="flex flex-col gap-2">
          {detail.tasks.map((task) => (
            <label
              key={task.id}
              className="flex items-center gap-2 text-sm"
            >
              <input
                type="checkbox"
                checked={task.done}
                onChange={(e) => onToggleTask(task.id, e.target.checked)}
              />
              <span
                className={
                  task.done ? "text-zinc-400 line-through" : "text-zinc-900 dark:text-zinc-100"
                }
              >
                {task.text}
              </span>
            </label>
          ))}
          {detail.tasks.length === 0 && (
            <div className="text-sm text-zinc-400">No tasks yet.</div>
          )}
        </div>
        <div className="mt-2 flex gap-2">
          <Input
            placeholder="Add a follow-up task"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
          />
          <Button
            onClick={async () => {
              if (!newTask.trim()) return;
              await onAddTask(newTask);
              setNewTask("");
            }}
          >
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
      {children}
    </div>
  );
}
