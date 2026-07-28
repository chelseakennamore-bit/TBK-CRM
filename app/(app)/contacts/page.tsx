import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { AddContactModal } from "@/components/modals/AddContactModal";
import { ContactsTable } from "./ContactsTable";

export const dynamic = "force-dynamic";

export default async function ContactsPage() {
  const contacts = await prisma.contact.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      company: true,
      email: true,
      phone: true,
      title: true,
    },
  });

  return (
    <div>
      <PageHeader
        title="Contacts"
        subtitle="People and companies you work with"
        action={<AddContactModal />}
      />
      <ContactsTable contacts={contacts} />
    </div>
  );
}
