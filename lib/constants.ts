export const STAGES = [
  "Lead",
  "Qualified",
  "Proposal",
  "Negotiation",
  "Won",
  "Lost",
] as const;

export const PROJECT_STATUSES = [
  "Not started",
  "In progress",
  "Blocked",
  "Complete",
] as const;

export const INVOICE_STATUSES = ["Draft", "Sent", "Paid", "Overdue"] as const;
