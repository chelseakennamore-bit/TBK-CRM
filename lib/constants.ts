export const STAGES = [
  "Lead",
  "Qualified",
  "Proposal",
  "Negotiation",
  "Won",
  "Lost",
] as const;

// Default win probability shown when a deal enters each stage. Editable
// per-deal in the drawer -- this is just a sensible starting point.
export const STAGE_PROBABILITY: Record<string, number> = {
  Lead: 10,
  Qualified: 25,
  Proposal: 50,
  Negotiation: 75,
  Won: 100,
  Lost: 0,
};

export const REVENUE_STREAMS = [
  "Consulting project",
  "Consulting retainer",
  "Digital product",
  "Training or workshop",
  "Partner or referral",
  "Other",
] as const;

export const PROJECT_STATUSES = [
  "Not started",
  "In progress",
  "Blocked",
  "Complete",
] as const;

export const INVOICE_STATUSES = ["Draft", "Sent", "Paid", "Overdue"] as const;
