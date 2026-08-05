"use client";

import { useEffect, useState } from "react";
import {
  addDeliverable,
  addMilestone,
  addProjectNote,
  addRisk,
  addStakeholder,
  addSubtask,
  deleteMilestone,
  deleteProject,
  deleteRisk,
  deleteSubtask,
  removeStakeholder,
  toggleSubtask,
  updateMilestoneStatus,
  updateProjectCompany,
  updateProjectContact,
  updateProjectDetails,
  updateProjectName,
  updateProjectStatus,
  updateRiskMitigation,
  updateRiskStatus,
} from "@/app/actions/projects";
import { Button, Card, Field, Input, LinkButton, Select, Tag, Textarea } from "@/components/ui";
import { Modal } from "@/components/Modal";
import { DeleteButton } from "@/components/DeleteButton";
import { SendEmailModal } from "@/components/modals/SendEmailModal";
import { AddInvoiceModal } from "@/components/modals/AddInvoiceModal";
import { daysAgo, fmtDate, money, toDateInputValue } from "@/lib/format";
import {
  MILESTONE_STATUSES,
  PROJECT_HEALTH,
  PROJECT_STATUSES,
  RISK_SEVERITIES,
  RISK_STATUSES,
} from "@/lib/constants";

type ContactOption = { id: string; name: string; company: string };
type DealOption = { id: string; title: string };

type Subtask = {
  id: string;
  text: string;
  done: boolean;
  dueDate: string | null;
};
type ProjectSummary = {
  id: string;
  name: string;
  client: string;
  status: string;
  progress: number;
  dueDate: string | null;
  health: string;
  nextDeliverable: string;
  nextMeetingAt: string | null;
  subtasks: Subtask[];
};

type Activity = { id: string; text: string; ts: string };
type Invoice = { id: string; amount: number; status: string; dueDate: string | null };
type Deliverable = { id: string; name: string; deliveredAt: string };
type Milestone = { id: string; name: string; status: string; dueDate: string | null };
type Risk = { id: string; description: string; severity: string; status: string; mitigation: string };
type Stakeholder = { id: string; role: string; contact: { id: string; name: string; email: string } };
type ProjectDetail = ProjectSummary & {
  contactId: string | null;
  contactEmail: string;
  notes: string;
  contractedValue: number;
  actualCost: number;
  driveFolderUrl: string;
  activities: Activity[];
  deliverables: Deliverable[];
  milestones: Milestone[];
  risks: Risk[];
  stakeholders: Stakeholder[];
  deal: { id: string; title: string; stage: string; invoices: Invoice[] } | null;
};

const STATUS_TAG: Record<string, "neutral" | "accent" | "accent-2" | "outline"> = {
  "Not started": "neutral",
  "In progress": "accent",
  Blocked: "accent-2",
  Complete: "outline",
};

const HEALTH_DOT: Record<string, string> = {
  Green: "bg-emerald-500",
  Yellow: "bg-amber-500",
  Red: "bg-rose-500",
};

const SEVERITY_TAG: Record<string, "neutral" | "accent-2" | "accent"> = {
  Low: "neutral",
  Medium: "accent",
  High: "accent-2",
};

const RISK_STATUS_TAG: Record<string, "accent-2" | "accent" | "outline"> = {
  Open: "accent-2",
  Mitigated: "accent",
  Closed: "outline",
};

export function ProjectsGrid({
  initialProjects,
  companyNames = [],
  contacts = [],
  wonDeals = [],
}: {
  initialProjects: ProjectSummary[];
  companyNames?: string[];
  contacts?: ContactOption[];
  wonDeals?: DealOption[];
}) {
  const [projects, setProjects] = useState(initialProjects);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ProjectDetail | null>(null);

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    fetch(`/api/projects/${selectedId}`)
      .then((r) => r.json())
      .then((d) => !cancelled && setDetail(d));
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const loadedDetail = detail && detail.id === selectedId ? detail : null;

  async function refreshDetail() {
    if (!selectedId) return;
    const res = await fetch(`/api/projects/${selectedId}`);
    setDetail(await res.json());
  }

  function patchProject(id: string, patch: Partial<ProjectSummary>) {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    setDetail((prev) => (prev && prev.id === id ? { ...prev, ...patch } : prev));
  }

  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
        {projects.map((project) => {
          const doneCount = project.subtasks.filter((t) => t.done).length;
          const progress = project.subtasks.length
            ? Math.round((doneCount / project.subtasks.length) * 100)
            : project.progress;

          return (
            <Card
              key={project.id}
              className="flex cursor-pointer flex-col gap-3 hover:border-indigo-300"
              onClick={() => setSelectedId(project.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2">
                  <span
                    title={`Health: ${project.health}`}
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${HEALTH_DOT[project.health] ?? "bg-zinc-300"}`}
                  />
                  <div>
                    <div className="font-semibold text-zinc-900 dark:text-zinc-50">
                      {project.name}
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                      {project.client}
                    </div>
                  </div>
                </div>
                <Tag variant={STATUS_TAG[project.status] ?? "neutral"}>
                  {project.status}
                </Tag>
              </div>

              <div>
                <div className="h-1.5 overflow-hidden rounded-md bg-zinc-200 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-md bg-indigo-600"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                  <div>
                    {project.subtasks.length
                      ? `${doneCount} of ${project.subtasks.length} tasks done`
                      : "No tasks yet"}
                  </div>
                  <div>Due {fmtDate(project.dueDate)}</div>
                </div>
              </div>
            </Card>
          );
        })}
        {projects.length === 0 && (
          <div className="col-span-full text-center text-sm text-zinc-400">
            No projects yet.
          </div>
        )}
      </div>

      {selectedId && (
        <Modal
          title={loadedDetail?.name ?? "Loading…"}
          subtitle={loadedDetail ? loadedDetail.client : undefined}
          width="560px"
          onClose={() => setSelectedId(null)}
          footer={
            <div className="flex w-full items-center justify-between gap-2">
              {loadedDetail && (
                <DeleteButton
                  onDelete={deleteProject.bind(null, loadedDetail.id)}
                  confirmText={`Delete the project "${loadedDetail.name}"? This can't be undone.`}
                  onDeleted={() => {
                    setProjects((prev) => prev.filter((p) => p.id !== loadedDetail.id));
                    setSelectedId(null);
                  }}
                />
              )}
              <div className="flex items-center gap-2">
                {loadedDetail && (
                  <>
                    {loadedDetail.driveFolderUrl && (
                      <LinkButton href={loadedDetail.driveFolderUrl} target="_blank">
                        View in Drive
                      </LinkButton>
                    )}
                    <AddInvoiceModal
                      triggerLabel="New invoice"
                      wonDeals={wonDeals}
                      companyNames={companyNames}
                      defaultClient={loadedDetail.client}
                      defaultDealId={loadedDetail.deal?.id ?? ""}
                    />
                    <SendEmailModal
                      triggerLabel="Send email"
                      defaultTo={loadedDetail.contactEmail}
                      defaultSubject=""
                      defaultMessage=""
                      contactId={loadedDetail.contactId ?? undefined}
                      projectId={loadedDetail.id}
                    />
                  </>
                )}
                <Button onClick={() => setSelectedId(null)}>Close</Button>
              </div>
            </div>
          }
        >
          {!loadedDetail ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
          ) : (
            <ProjectDetailBody
              key={loadedDetail.id}
              detail={loadedDetail}
              companyNames={companyNames}
              contacts={contacts}
              onFieldsCommit={(fields) => patchProject(loadedDetail.id, fields)}
              onRefresh={refreshDetail}
            />
          )}
        </Modal>
      )}
    </>
  );
}

function ProjectDetailBody({
  detail,
  companyNames,
  contacts,
  onFieldsCommit,
  onRefresh,
}: {
  detail: ProjectDetail;
  companyNames: string[];
  contacts: ContactOption[];
  onFieldsCommit: (fields: Partial<ProjectSummary>) => void;
  onRefresh: () => Promise<void>;
}) {
  const [name, setName] = useState(detail.name);
  const [client, setClient] = useState(detail.client);
  const [contactId, setContactId] = useState(detail.contactId ?? "");
  const [status, setStatus] = useState(detail.status);
  const [health, setHealth] = useState(detail.health);
  const [dueDate, setDueDate] = useState(toDateInputValue(detail.dueDate));
  const [contractedValue, setContractedValue] = useState(String(detail.contractedValue));
  const [actualCost, setActualCost] = useState(String(detail.actualCost));
  const [nextDeliverable, setNextDeliverable] = useState(detail.nextDeliverable);
  const [nextMeetingAt, setNextMeetingAt] = useState(toDateInputValue(detail.nextMeetingAt));
  const [notes, setNotes] = useState(detail.notes);
  const [newNote, setNewNote] = useState("");
  const [newTask, setNewTask] = useState("");
  const [newTaskDue, setNewTaskDue] = useState("");
  const [taskPending, setTaskPending] = useState(false);
  const [deliverables, setDeliverables] = useState(detail.deliverables);
  const [newDeliverable, setNewDeliverable] = useState("");
  const [newDeliverableDate, setNewDeliverableDate] = useState(toDateInputValue(new Date().toISOString()));
  const [deliverablePending, setDeliverablePending] = useState(false);
  const [milestones, setMilestones] = useState(detail.milestones);
  const [newMilestone, setNewMilestone] = useState("");
  const [newMilestoneDue, setNewMilestoneDue] = useState("");
  const [milestonePending, setMilestonePending] = useState(false);
  const [risks, setRisks] = useState(detail.risks);
  const [newRisk, setNewRisk] = useState("");
  const [newRiskSeverity, setNewRiskSeverity] = useState<string>(RISK_SEVERITIES[1]);
  const [riskPending, setRiskPending] = useState(false);
  const [stakeholders, setStakeholders] = useState(detail.stakeholders);
  const [newStakeholderId, setNewStakeholderId] = useState("");
  const [newStakeholderRole, setNewStakeholderRole] = useState("");
  const [stakeholderPending, setStakeholderPending] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <Field label="Project name">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => {
            const trimmed = name.trim() || "New Engagement";
            setName(trimmed);
            onFieldsCommit({ name: trimmed });
            updateProjectName(detail.id, trimmed);
          }}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Client">
          <Input
            value={client}
            list="project-drawer-company-names"
            onChange={(e) => setClient(e.target.value)}
            onBlur={() => {
              onFieldsCommit({ client });
              updateProjectCompany(detail.id, client);
            }}
          />
          <datalist id="project-drawer-company-names">
            {companyNames.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
        </Field>
        <Field label="Contact">
          <Select
            value={contactId}
            onChange={(e) => {
              setContactId(e.target.value);
              updateProjectContact(detail.id, e.target.value);
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
      </div>

      <div>
        <div className="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Stakeholders
        </div>
        <div className="flex flex-col gap-1.5">
          {stakeholders.map((s) => (
            <div key={s.id} className="flex items-center gap-2 text-sm">
              <span className="text-zinc-900 dark:text-zinc-100">{s.contact.name}</span>
              {s.role && <Tag variant="neutral">{s.role}</Tag>}
              <button
                type="button"
                onClick={() => {
                  setStakeholders((prev) => prev.filter((x) => x.id !== s.id));
                  removeStakeholder(s.id);
                }}
                className="ml-auto text-zinc-400 hover:text-red-500"
                aria-label="Remove stakeholder"
              >
                ×
              </button>
            </div>
          ))}
          {stakeholders.length === 0 && (
            <div className="text-sm text-zinc-400">No stakeholders added yet.</div>
          )}
        </div>
        <div className="mt-2 flex gap-2">
          <div className="min-w-0 flex-1">
            <Select
              value={newStakeholderId}
              onChange={(e) => setNewStakeholderId(e.target.value)}
            >
              <option value="">Select a contact…</option>
              {contacts
                .filter((c) => !stakeholders.some((s) => s.contact.id === c.id))
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.company})
                  </option>
                ))}
            </Select>
          </div>
          <div className="w-36 shrink-0">
            <Input
              placeholder="Role"
              value={newStakeholderRole}
              onChange={(e) => setNewStakeholderRole(e.target.value)}
            />
          </div>
          <Button
            disabled={stakeholderPending}
            onClick={async () => {
              if (!newStakeholderId) return;
              setStakeholderPending(true);
              const created = await addStakeholder(detail.id, newStakeholderId, newStakeholderRole);
              if (created) {
                setStakeholders((prev) => [...prev, created]);
              }
              setNewStakeholderId("");
              setNewStakeholderRole("");
              setStakeholderPending(false);
            }}
          >
            Add
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Status">
          <Select
            value={status}
            onChange={(e) => {
              const next = e.target.value;
              setStatus(next);
              onFieldsCommit({ status: next });
              updateProjectStatus(detail.id, next);
            }}
          >
            {PROJECT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Health">
          <Select
            value={health}
            onChange={(e) => {
              const next = e.target.value;
              setHealth(next);
              onFieldsCommit({ health: next });
              updateProjectDetails(detail.id, { health: next });
            }}
          >
            {PROJECT_HEALTH.map((h) => (
              <option key={h} value={h}>
                {h}
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
              onFieldsCommit({
                dueDate: e.target.value ? new Date(e.target.value).toISOString() : null,
              });
              updateProjectDetails(detail.id, { dueDate: e.target.value });
            }}
          />
        </Field>
        <Field label="Contracted value">
          <Input
            type="number"
            value={contractedValue}
            onChange={(e) => setContractedValue(e.target.value)}
            onBlur={() => updateProjectDetails(detail.id, { contractedValue: Number(contractedValue) || 0 })}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Actual cost so far">
          <Input
            type="number"
            value={actualCost}
            onChange={(e) => setActualCost(e.target.value)}
            onBlur={() => updateProjectDetails(detail.id, { actualCost: Number(actualCost) || 0 })}
          />
        </Field>
        <div className="pt-5 text-sm text-zinc-500 dark:text-zinc-400">
          {(() => {
            const variance = (Number(contractedValue) || 0) - (Number(actualCost) || 0);
            return variance >= 0 ? (
              <span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-50">{money(variance)}</span>{" "}
                under budget
              </span>
            ) : (
              <span>
                <span className="font-semibold text-rose-600 dark:text-rose-400">{money(-variance)}</span>{" "}
                over budget
              </span>
            );
          })()}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Next deliverable">
          <Input
            value={nextDeliverable}
            placeholder="e.g. draft report"
            onChange={(e) => setNextDeliverable(e.target.value)}
            onBlur={() => {
              onFieldsCommit({ nextDeliverable });
              updateProjectDetails(detail.id, { nextDeliverable });
            }}
          />
        </Field>
        <Field label="Next meeting">
          <Input
            type="date"
            value={nextMeetingAt}
            onChange={(e) => {
              setNextMeetingAt(e.target.value);
              onFieldsCommit({
                nextMeetingAt: e.target.value ? new Date(e.target.value).toISOString() : null,
              });
              updateProjectDetails(detail.id, { nextMeetingAt: e.target.value });
            }}
          />
        </Field>
      </div>

      <Field label="Notes">
        <Textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => updateProjectDetails(detail.id, { notes })}
        />
      </Field>

      {detail.deal && (
        <div className="text-sm text-zinc-500 dark:text-zinc-400">
          Converted from deal:{" "}
          <a
            href={`/deals?deal=${detail.deal.id}`}
            className="text-indigo-600 hover:underline dark:text-indigo-400"
          >
            {detail.deal.title}
          </a>{" "}
          · {detail.deal.stage}
        </div>
      )}

      {detail.deal && detail.deal.invoices.length > 0 && (
        <div>
          <div className="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Invoices
          </div>
          <div className="flex flex-col gap-1.5">
            {detail.deal.invoices.map((inv) => (
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
          </div>
        </div>
      )}

      <div>
        <div className="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Milestones
        </div>
        <div className="flex flex-col gap-2">
          {milestones.map((m) => (
            <div key={m.id} className="flex items-center gap-2 text-sm">
              <span className="min-w-0 flex-1 truncate text-zinc-900 dark:text-zinc-100">
                {m.name}
              </span>
              <span className="shrink-0 text-[11px] text-zinc-500 dark:text-zinc-400">
                {fmtDate(m.dueDate)}
              </span>
              <div className="w-32 shrink-0">
                <Select
                  value={m.status}
                  onChange={(e) => {
                    const next = e.target.value;
                    setMilestones((prev) =>
                      prev.map((x) => (x.id === m.id ? { ...x, status: next } : x))
                    );
                    updateMilestoneStatus(m.id, next);
                  }}
                >
                  {MILESTONE_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMilestones((prev) => prev.filter((x) => x.id !== m.id));
                  deleteMilestone(m.id);
                }}
                className="shrink-0 text-zinc-400 hover:text-red-500"
                aria-label="Delete milestone"
              >
                ×
              </button>
            </div>
          ))}
          {milestones.length === 0 && (
            <div className="text-sm text-zinc-400">No milestones yet.</div>
          )}
        </div>
        <div className="mt-2 flex gap-2">
          <div className="min-w-0 flex-1">
            <Input
              placeholder="e.g. Discovery, Design, Delivery"
              value={newMilestone}
              onChange={(e) => setNewMilestone(e.target.value)}
            />
          </div>
          <div className="w-36 shrink-0">
            <Input
              type="date"
              value={newMilestoneDue}
              onChange={(e) => setNewMilestoneDue(e.target.value)}
            />
          </div>
          <Button
            disabled={milestonePending}
            onClick={async () => {
              if (!newMilestone.trim()) return;
              setMilestonePending(true);
              const created = await addMilestone(detail.id, newMilestone, newMilestoneDue);
              if (created) {
                setMilestones((prev) => [...prev, created]);
              }
              setNewMilestone("");
              setNewMilestoneDue("");
              setMilestonePending(false);
            }}
          >
            Add
          </Button>
        </div>
      </div>

      <div>
        <div className="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Tasks
        </div>
        <div className="flex flex-col gap-2">
          {detail.subtasks.map((task) => (
            <div key={task.id} className="flex items-center gap-2 text-sm">
              <label className="flex flex-1 min-w-0 cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={task.done}
                  onChange={(e) => {
                    const done = e.target.checked;
                    onFieldsCommit({
                      subtasks: detail.subtasks.map((t) =>
                        t.id === task.id ? { ...t, done } : t
                      ),
                    });
                    toggleSubtask(task.id, done);
                  }}
                />
                <span
                  className={
                    "flex-1 truncate " +
                    (task.done ? "text-zinc-400 line-through" : "text-zinc-900 dark:text-zinc-100")
                  }
                >
                  {task.text}
                </span>
              </label>
              <span className="shrink-0 text-[11px] text-zinc-500 dark:text-zinc-400">
                {fmtDate(task.dueDate)}
              </span>
              <button
                type="button"
                onClick={() => {
                  onFieldsCommit({
                    subtasks: detail.subtasks.filter((t) => t.id !== task.id),
                  });
                  deleteSubtask(task.id);
                }}
                className="shrink-0 text-zinc-400 hover:text-red-500"
                aria-label="Delete task"
              >
                ×
              </button>
            </div>
          ))}
          {detail.subtasks.length === 0 && (
            <div className="text-sm text-zinc-400">No tasks yet.</div>
          )}
        </div>
        <div className="mt-2 flex gap-2">
          <div className="min-w-0 flex-1">
            <Input
              placeholder="Add a task"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
            />
          </div>
          <div className="w-36 shrink-0">
            <Input
              type="date"
              value={newTaskDue}
              onChange={(e) => setNewTaskDue(e.target.value)}
            />
          </div>
          <Button
            disabled={taskPending}
            onClick={async () => {
              if (!newTask.trim()) return;
              setTaskPending(true);
              const created = await addSubtask(detail.id, newTask, newTaskDue);
              if (created) {
                onFieldsCommit({ subtasks: [...detail.subtasks, created] });
              }
              setNewTask("");
              setNewTaskDue("");
              setTaskPending(false);
            }}
          >
            Add
          </Button>
        </div>
      </div>

      <div>
        <div className="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Deliverables
        </div>
        <div className="flex flex-col gap-2">
          {deliverables.map((d) => (
            <div key={d.id} className="flex items-center justify-between text-sm">
              <span className="text-zinc-900 dark:text-zinc-100">{d.name}</span>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {fmtDate(d.deliveredAt)}
              </span>
            </div>
          ))}
          {deliverables.length === 0 && (
            <div className="text-sm text-zinc-400">No deliverables logged yet.</div>
          )}
        </div>
        <div className="mt-2 flex gap-2">
          <div className="min-w-0 flex-1">
            <Input
              placeholder="Add a delivered item"
              value={newDeliverable}
              onChange={(e) => setNewDeliverable(e.target.value)}
            />
          </div>
          <div className="w-36 shrink-0">
            <Input
              type="date"
              value={newDeliverableDate}
              onChange={(e) => setNewDeliverableDate(e.target.value)}
            />
          </div>
          <Button
            disabled={deliverablePending}
            onClick={async () => {
              if (!newDeliverable.trim()) return;
              setDeliverablePending(true);
              const created = await addDeliverable(detail.id, newDeliverable, newDeliverableDate);
              if (created) {
                setDeliverables((prev) => [created, ...prev]);
              }
              setNewDeliverable("");
              setDeliverablePending(false);
            }}
          >
            Add
          </Button>
        </div>
      </div>

      <div>
        <div className="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Risk log
        </div>
        <div className="flex flex-col gap-2">
          {risks.map((r) => (
            <div key={r.id} className="rounded-md border border-zinc-200 p-2.5 dark:border-zinc-800">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Tag variant={SEVERITY_TAG[r.severity] ?? "neutral"}>{r.severity}</Tag>
                  <Tag variant={RISK_STATUS_TAG[r.status] ?? "neutral"}>{r.status}</Tag>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-28 shrink-0">
                    <Select
                      value={r.status}
                      onChange={(e) => {
                        const next = e.target.value;
                        setRisks((prev) =>
                          prev.map((x) => (x.id === r.id ? { ...x, status: next } : x))
                        );
                        updateRiskStatus(r.id, next);
                      }}
                    >
                      {RISK_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setRisks((prev) => prev.filter((x) => x.id !== r.id));
                      deleteRisk(r.id);
                    }}
                    className="shrink-0 text-zinc-400 hover:text-red-500"
                    aria-label="Delete risk"
                  >
                    ×
                  </button>
                </div>
              </div>
              <div className="mt-1.5 text-sm text-zinc-900 dark:text-zinc-100">
                {r.description}
              </div>
              <div className="mt-1.5">
                <Input
                  placeholder="Mitigation"
                  defaultValue={r.mitigation}
                  onBlur={(e) => updateRiskMitigation(r.id, e.target.value)}
                />
              </div>
            </div>
          ))}
          {risks.length === 0 && (
            <div className="text-sm text-zinc-400">No risks logged.</div>
          )}
        </div>
        <div className="mt-2 flex gap-2">
          <div className="min-w-0 flex-1">
            <Input
              placeholder="Describe a risk or issue"
              value={newRisk}
              onChange={(e) => setNewRisk(e.target.value)}
            />
          </div>
          <div className="w-28 shrink-0">
            <Select
              value={newRiskSeverity}
              onChange={(e) => setNewRiskSeverity(e.target.value)}
            >
              {RISK_SEVERITIES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
          <Button
            disabled={riskPending}
            onClick={async () => {
              if (!newRisk.trim()) return;
              setRiskPending(true);
              const created = await addRisk(detail.id, newRisk, newRiskSeverity);
              if (created) {
                setRisks((prev) => [created, ...prev]);
              }
              setNewRisk("");
              setRiskPending(false);
            }}
          >
            Add
          </Button>
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
              await addProjectNote(detail.id, newNote);
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
