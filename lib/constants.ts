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

export const COMPANY_SIZES = [
  "1-10",
  "11-50",
  "51-200",
  "201-1000",
  "1000+",
] as const;

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

export const PROJECT_HEALTH = ["Green", "Yellow", "Red"] as const;

export const MILESTONE_STATUSES = ["Not started", "In progress", "Complete"] as const;

export const RISK_SEVERITIES = ["Low", "Medium", "High"] as const;

export const RISK_STATUSES = ["Open", "Mitigated", "Closed"] as const;

// Which quote layout a deal generates: service (Deliverable/Type/Amount,
// single Total) or subscription (Item/Seats/Billing/Unit Price/Total,
// Subtotal + Total).
export const QUOTE_TYPES = [
  { value: "service", label: "Service" },
  { value: "subscription", label: "Subscription" },
] as const;
