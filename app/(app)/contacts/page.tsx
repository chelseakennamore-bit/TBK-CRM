import { prisma } from "@/lib/prisma";
import { LinkButton, PageHeader } from "@/components/ui";
import { AddContactModal } from "@/components/modals/AddContactModal";
import { ContactsTable } from "./ContactsTable";

export const dynamic = "force-dynamic";

export default async function ContactsPage() {
  const [contacts, companies] = await Promise.all([
    prisma.contact.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        company: true,
        email: true,
        phone: true,
        title: true,
      },
    }),
    prisma.company.findMany({ select: { name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Contacts"
        subtitle="People and companies you work with"
        action={
          <div className="flex gap-2">
            <LinkButton href="/api/export/contacts">Export CSV</LinkButton>
            <AddContactModal companyNames={companies.map((c) => c.name)} />
          </div>
        }
      />
      <ContactsTable contacts={contacts} />
    </div>
  );
}
