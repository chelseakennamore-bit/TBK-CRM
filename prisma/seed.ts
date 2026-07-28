import bcrypt from "bcryptjs";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function daysAgo(n: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}
function daysFromNow(n: number) {
  return daysAgo(-n);
}

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@tbkconsulting.com";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "changeme123";
  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: { email: adminEmail, passwordHash },
  });

  const leadCount = await prisma.lead.count();
  if (leadCount > 0) {
    console.log("Database already seeded, skipping sample data.");
    return;
  }

  await prisma.contact.create({
    data: {
      name: "Marcus Reyes",
      company: "Reyes & Co Logistics",
      email: "marcus@reyesco.com",
      phone: "(555) 201-3344",
      title: "Operations Director",
    },
  });
  await prisma.contact.create({
    data: {
      name: "Priya Nair",
      company: "Northbridge Retail Group",
      email: "priya.nair@northbridgeretail.com",
      phone: "(555) 208-9911",
      title: "VP Finance",
    },
  });
  await prisma.contact.create({
    data: {
      name: "Devon Cole",
      company: "Cole Family Dental",
      email: "devon@colefamilydental.com",
      phone: "(555) 330-7712",
      title: "Owner",
    },
  });
  await prisma.contact.create({
    data: {
      name: "Ethan Brookes",
      company: "Brookes Manufacturing",
      email: "ethan.brookes@brookesmfg.com",
      phone: "(555) 577-2201",
      title: "COO",
    },
  });
  await prisma.contact.create({
    data: {
      name: "Lena Vasquez",
      company: "Vasquez Legal Partners",
      email: "lena@vasquezlegal.com",
      phone: "(555) 618-4420",
      title: "Managing Partner",
    },
  });
  await prisma.contact.create({
    data: {
      name: "Amara Okafor",
      company: "Okafor Wellness Studio",
      email: "amara@okaforwellness.com",
      phone: "(555) 442-0098",
      title: "Founder",
    },
  });

  await prisma.lead.createMany({
    data: [
      {
        name: "Marcus Reyes",
        company: "Reyes & Co Logistics",
        email: "marcus@reyesco.com",
        message: "Need help streamlining dispatch ops and reporting.",
        source: "Website contact form",
        receivedAt: daysAgo(3),
        status: "new",
      },
      {
        name: "Sana Ito",
        company: "Ito & Partners Architecture",
        email: "sana@itopartners.com",
        message: "Interested in a process audit for our project pipeline.",
        source: "Website contact form",
        receivedAt: daysAgo(2),
        status: "new",
      },
      {
        name: "Amara Okafor",
        company: "Okafor Wellness Studio",
        email: "amara@okaforwellness.com",
        message: "Exploring ops support as we open a second location.",
        source: "Website contact form",
        receivedAt: daysAgo(1),
        status: "new",
      },
      {
        name: "Priya Nair",
        company: "Northbridge Retail Group",
        email: "priya.nair@northbridgeretail.com",
        message: "Looking for a revenue operations audit before Q3.",
        source: "Website contact form",
        receivedAt: daysAgo(6),
        status: "in_pipeline",
      },
      {
        name: "Devon Cole",
        company: "Cole Family Dental",
        email: "devon@colefamilydental.com",
        message: "Want to fix our scheduling and billing workflow.",
        source: "Website contact form",
        receivedAt: daysAgo(7),
        status: "in_pipeline",
      },
    ],
  });

  const d1 = await prisma.deal.create({
    data: {
      title: "Revenue Ops Audit",
      company: "Northbridge Retail Group",
      contactName: "Priya Nair",
      value: 18000,
      stage: "Proposal",
      closeDate: daysFromNow(18),
      notes: "",
      tasks: {
        create: [
          { text: "Send proposal deck", done: true, order: 0 },
          { text: "Schedule follow-up call", done: false, order: 1 },
        ],
      },
      activities: {
        create: [
          { text: "Sent proposal deck to Priya", ts: daysAgo(4) },
          { text: "Stage changed to Proposal", ts: daysAgo(8) },
        ],
      },
    },
  });
  const d2 = await prisma.deal.create({
    data: {
      title: "Scheduling & Billing Workflow",
      company: "Cole Family Dental",
      contactName: "Devon Cole",
      value: 9500,
      stage: "Negotiation",
      closeDate: daysFromNow(8),
      notes: "",
      tasks: { create: [{ text: "Confirm final scope", done: false, order: 0 }] },
      activities: { create: [{ text: "Call with Devon — agreed on rough scope", ts: daysAgo(6) }] },
    },
  });
  await prisma.deal.create({
    data: {
      title: "Ops Efficiency Engagement",
      company: "Brookes Manufacturing",
      contactName: "Ethan Brookes",
      value: 32000,
      stage: "Qualified",
      closeDate: daysFromNow(35),
      notes: "",
    },
  });
  await prisma.deal.create({
    data: {
      title: "Intake Process Redesign",
      company: "Vasquez Legal Partners",
      contactName: "Lena Vasquez",
      value: 14000,
      stage: "Lead",
      closeDate: daysFromNow(54),
      notes: "",
    },
  });
  const d5 = await prisma.deal.create({
    data: {
      title: "Ops Retainer Renewal",
      company: "Reyes & Co Logistics",
      contactName: "Marcus Reyes",
      value: 24000,
      stage: "Won",
      closeDate: daysAgo(28),
      notes: "Signed, kicking off retainer.",
    },
  });
  await prisma.deal.create({
    data: {
      title: "Front Office Cleanup",
      company: "Bright Path Dental Group",
      contactName: "Not on file",
      value: 6000,
      stage: "Lost",
      closeDate: daysAgo(48),
      notes: "Went with an in-house hire instead.",
    },
  });

  await prisma.project.create({
    data: {
      name: "Ops Retainer — Reyes & Co",
      client: "Reyes & Co Logistics",
      status: "In progress",
      progress: 55,
      dueDate: daysFromNow(156),
      dealId: d5.id,
      subtasks: {
        create: [
          { text: "Weekly ops review call", done: true, dueDate: daysAgo(18), order: 0 },
          { text: "Deliver Q3 dispatch report", done: false, dueDate: daysFromNow(4), order: 1 },
          { text: "Audit driver scheduling tool", done: false, dueDate: daysFromNow(23), order: 2 },
        ],
      },
    },
  });
  await prisma.project.create({
    data: {
      name: "Phase 1 Rollout",
      client: "Northbridge Retail Group",
      status: "Complete",
      progress: 100,
      dueDate: daysAgo(74),
      subtasks: {
        create: [
          { text: "Train staff on new POS flow", done: true, dueDate: daysAgo(88), order: 0 },
          { text: "Handoff documentation", done: true, dueDate: daysAgo(79), order: 1 },
        ],
      },
    },
  });

  await prisma.invoice.create({
    data: {
      client: "Reyes & Co Logistics",
      dealId: d5.id,
      amount: 24000,
      status: "Paid",
      issuedAt: daysAgo(27),
      dueDate: daysAgo(13),
    },
  });
  await prisma.invoice.create({
    data: {
      client: "Northbridge Retail Group",
      dealId: d1.id,
      amount: 9000,
      status: "Sent",
      issuedAt: daysAgo(8),
      dueDate: daysFromNow(13),
    },
  });
  await prisma.invoice.create({
    data: {
      client: "Cole Family Dental",
      dealId: d2.id,
      amount: 4750,
      status: "Overdue",
      issuedAt: daysAgo(43),
      dueDate: daysAgo(28),
    },
  });

  await prisma.queuedLead.create({
    data: {
      name: "Grace Whitfield",
      company: "Whitfield & Sons Roofing",
      email: "grace@whitfieldroofing.com",
      message: "Need a lead intake and dispatch process overhaul.",
      source: "Website contact form",
    },
  });
  await prisma.setting.create({
    data: { key: "lastSyncedAt", value: daysAgo(0).toISOString() },
  });

  console.log("Seed complete. Admin login:", adminEmail, "/", adminPassword);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
