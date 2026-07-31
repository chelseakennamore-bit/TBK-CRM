import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { AddProjectModal } from "@/components/modals/AddProjectModal";
import { ProjectsGrid } from "./ProjectsGrid";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const [projects, companies, contacts] = await Promise.all([
    prisma.project.findMany({
      orderBy: { createdAt: "desc" },
      include: { subtasks: { orderBy: { order: "asc" } } },
    }),
    prisma.company.findMany({ select: { name: true }, orderBy: { name: "asc" } }),
    prisma.contact.findMany({
      select: { id: true, name: true, company: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const initialProjects = projects.map((p) => ({
    id: p.id,
    name: p.name,
    client: p.client,
    status: p.status,
    progress: p.progress,
    dueDate: p.dueDate ? p.dueDate.toISOString() : null,
    health: p.health,
    nextDeliverable: p.nextDeliverable,
    nextMeetingAt: p.nextMeetingAt ? p.nextMeetingAt.toISOString() : null,
    subtasks: p.subtasks.map((t) => ({
      id: t.id,
      text: t.text,
      done: t.done,
      dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    })),
  }));

  return (
    <div>
      <PageHeader
        title="Projects"
        subtitle="Delivery work for won engagements"
        action={<AddProjectModal />}
      />
      <ProjectsGrid
        key={initialProjects.map((p) => p.id).join(",")}
        initialProjects={initialProjects}
        companyNames={companies.map((c) => c.name)}
        contacts={contacts}
      />
    </div>
  );
}
