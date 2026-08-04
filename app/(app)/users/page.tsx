import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { AddUserModal } from "@/components/modals/AddUserModal";
import { UsersTable } from "./UsersTable";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const [users, session] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, email: true, active: true, createdAt: true },
    }),
    auth(),
  ]);

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle="Who has access to this CRM"
        action={<AddUserModal />}
      />
      <UsersTable
        key={users.map((u) => u.id).join(",")}
        users={users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }))}
        currentUserId={session?.user.id ?? ""}
      />
    </div>
  );
}
