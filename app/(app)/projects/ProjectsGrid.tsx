"use client";

import { useState } from "react";
import {
  addSubtask,
  toggleSubtask,
  updateProjectDetails,
  updateProjectStatus,
} from "@/app/actions/projects";
import { Button, Card, Field, Input, Select, Tag } from "@/components/ui";
import { fmtDate, toDateInputValue } from "@/lib/format";
import { PROJECT_HEALTH, PROJECT_STATUSES } from "@/lib/constants";

type Subtask = {
  id: string;
  text: string;
  done: boolean;
  dueDate: string | null;
};
type Project = {
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

export function ProjectsGrid({ initialProjects }: { initialProjects: Project[] }) {
  const [projects, setProjects] = useState(initialProjects);

  function patchProject(id: string, patch: Partial<Project>) {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
      {projects.map((project) => {
        const doneCount = project.subtasks.filter((t) => t.done).length;
        const progress = project.subtasks.length
          ? Math.round((doneCount / project.subtasks.length) * 100)
          : project.progress;

        return (
          <Card key={project.id} className="flex flex-col gap-3">
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

            <div className="grid grid-cols-2 gap-2">
              <Field label="Next deliverable">
                <Input
                  value={project.nextDeliverable}
                  placeholder="e.g. draft report"
                  onChange={(e) => patchProject(project.id, { nextDeliverable: e.target.value })}
                  onBlur={() =>
                    updateProjectDetails(project.id, { nextDeliverable: project.nextDeliverable })
                  }
                />
              </Field>
              <Field label="Next meeting">
                <Input
                  type="date"
                  value={toDateInputValue(project.nextMeetingAt)}
                  onChange={(e) => {
                    patchProject(project.id, {
                      nextMeetingAt: e.target.value ? new Date(e.target.value).toISOString() : null,
                    });
                    updateProjectDetails(project.id, { nextMeetingAt: e.target.value });
                  }}
                />
              </Field>
            </div>

            <div className="flex flex-col gap-2">
              {project.subtasks.map((task) => (
                <label key={task.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={task.done}
                    onChange={(e) => {
                      const done = e.target.checked;
                      patchProject(project.id, {
                        subtasks: project.subtasks.map((t) =>
                          t.id === task.id ? { ...t, done } : t
                        ),
                      });
                      toggleSubtask(task.id, done);
                    }}
                  />
                  <span
                    className={
                      "flex-1 " +
                      (task.done
                        ? "text-zinc-400 line-through"
                        : "text-zinc-900 dark:text-zinc-100")
                    }
                  >
                    {task.text}
                  </span>
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {fmtDate(task.dueDate)}
                  </span>
                </label>
              ))}
            </div>

            <AddSubtaskRow
              projectId={project.id}
              onAdded={(subtask) =>
                patchProject(project.id, {
                  subtasks: [...project.subtasks, subtask],
                })
              }
            />

            <div className="grid grid-cols-2 gap-2">
              <Select
                value={project.status}
                onChange={(e) => {
                  const status = e.target.value;
                  patchProject(project.id, { status });
                  updateProjectStatus(project.id, status);
                }}
              >
                {PROJECT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
              <Select
                value={project.health}
                onChange={(e) => {
                  const health = e.target.value;
                  patchProject(project.id, { health });
                  updateProjectDetails(project.id, { health });
                }}
              >
                {PROJECT_HEALTH.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </Select>
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
  );
}

function AddSubtaskRow({
  projectId,
  onAdded,
}: {
  projectId: string;
  onAdded: (subtask: Subtask) => void;
}) {
  const [text, setText] = useState("");
  const [due, setDue] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <div className="flex gap-2">
      <Input
        placeholder="Add a task"
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="flex-1"
      />
      <Input
        type="date"
        value={due}
        onChange={(e) => setDue(e.target.value)}
        className="w-[130px]"
      />
      <Button
        disabled={pending}
        onClick={async () => {
          if (!text.trim()) return;
          setPending(true);
          const created = await addSubtask(projectId, text, due);
          if (created) onAdded(created);
          setText("");
          setDue("");
          setPending(false);
        }}
      >
        Add
      </Button>
    </div>
  );
}
