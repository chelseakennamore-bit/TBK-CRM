# Handoff: TBK Enterprise Consulting — Lightweight CRM

## Overview
A lightweight CRM for a solo consulting business, replacing a spreadsheet workflow. Covers the full loop: inbound leads → deals/pipeline → won engagement (project) → invoice, plus a contacts book and basic reporting. Currently a working HTML/React prototype with in-memory (non-persistent) state.

## About the Design Files
The file in this bundle (`TBK CRM.dc.html`) is a **design reference built in HTML** — a working prototype showing intended layout, content, and interaction behavior, not production code to copy directly. The task is to **recreate this UI in a real app stack** (recommended: Next.js + a hosted Postgres DB, e.g. via Supabase or Neon) with persistent storage, auth, and real integrations — using that stack's own component/styling conventions, not by embedding this HTML wholesale.

## Fidelity
**High-fidelity for layout and interaction, placeholder for visual polish.** The screen structure, fields, table columns, modal forms, and interaction flows (drag-and-drop pipeline, task/note logging, CSV import, invoice status, subtask checklists) should be recreated faithfully. Colors/typography come from a lightweight design-system CSS file (`_ds` folder, not included — reference `ds/styles.css` class names used: `.card`, `.tag`, `.btn`, `.input`, `.table`, `.field`, `.dialog`, `.nav`) — the developer should apply the target app's own design system/component library rather than importing that CSS.

## Screens / Views
Single-page app with a left-to-right top nav (`Dashboard`, `Leads`, `Deals`, `Projects`, `Contacts`, `Invoices`, `Reports`) and one main content pane that swaps by view. Two floating drawers (deal detail, contact detail) and one modal (add lead/deal/contact/invoice/project/CSV import) overlay on top.

### 1. Dashboard
- 4 stat cards in a row: Open pipeline value, Open deals count, Win rate, New leads count.
- Two-column layout below: "Recent leads" (last 4, name/company/status tag) and "Top open deals" (top 4 by value, click → opens deal drawer).

### 2. Leads
- Header row: "Synced from Google Sheet" tag, "Last synced X" label, right-aligned "Import CSV" + "Sync now" buttons.
- Table: Name, Company, Inquiry (message), Source, Received (relative date), Status tag (New/In pipeline), and a "Convert to deal" button shown only for New leads.
- "Sync now" pulls one fake incoming lead from a queue (stand-in for a real Sheets/webhook poll).
- "Import CSV" opens a modal with a textarea; parses `name, company, email, message, source` per line into new leads.

### 3. Deals (pipeline)
- Summary line: open deal count + total pipeline value.
- Horizontal kanban: one column per stage (Lead, Qualified, Proposal, Negotiation, Won, Lost), each showing count + stage value.
- Deal cards are draggable between columns (HTML5 drag-and-drop) and clickable to open the deal drawer.
- **Deal drawer**: value, close date, stage select, notes textarea, an **activity log** (timestamped, newest-first, auto-logged on stage changes + manual "add a note"), and a task checklist (add/toggle follow-up tasks).

### 4. Projects (post-win engagement management)
- Card grid, one card per project/engagement: name, client, status tag, progress bar.
- Progress is **auto-computed** from subtask completion (% done) when subtasks exist, else falls back to a manual value.
- Each card has an inline **subtask checklist** — checkbox, text, due date per subtask — plus an add-row (text input + date input + Add button).
- Status select (Not started / In progress / Blocked / Complete).
- "Add project" header button opens a modal (name, client, due date).

### 5. Contacts
- Table: Name, Company, Email (mailto link), Phone, Title. Rows are clickable (except the email link) → opens a **contact drawer** with an activity/notes log identical in pattern to the deal drawer.
- "Add contact" header button opens a modal.

### 6. Invoices
- 3 stat cards: Outstanding total, Overdue count, Paid this month.
- Table: Client, Linked deal (optional, from Won deals), Amount, Issued date, Due date, Status select (Draft/Sent/Paid/Overdue).
- "Add invoice" modal: client, optional linked-deal dropdown (Won deals only), amount, due date.

### 7. Reports
- Two-column: **Lead source performance** table (source, lead count, converted count, conversion rate) and **Monthly revenue** (won deals grouped by close month, rendered as horizontal bars scaled to the max month).

## Interactions & Behavior
- **Drag-and-drop**: deal cards between pipeline columns; drop triggers a stage change + auto activity-log entry.
- **Modals**: single reusable dialog shell, contents swapped by `modal` type (`newLead`, `newDeal`, `newContact`, `newInvoice`, `newProject`, `importCsv`). Backdrop click and Cancel both close; clicking the dialog itself doesn't (stopPropagation).
- **Drawers**: deal and contact drawers are the same dialog pattern, opened by row/card click, closed via backdrop or Close button.
- **Activity logs**: every stage change and manual note push a `{ id, ts, text }` entry to the front of an `activity` array; rendered with a relative "days ago" label.
- **CSV import**: naive comma-split per line (`name, company, email, message, source`), no header-row detection — real implementation should validate/parse more robustly (quoted commas, header row, duplicate detection against existing contacts/leads).
- **Convert lead → deal**: moves lead to `in_pipeline` status, creates a new deal in `Lead` stage, switches view to Deals.
- No responsive/mobile layout was built — assume desktop use only, matching the "just me" solo-user context.

## State Management (current prototype, all in-memory)
- `view`: active nav tab.
- `leads`, `deals`, `contacts`, `projects`, `invoices`: arrays, each item with a stable `id`.
- `deals[].activity`, `contacts[].activity`: arrays of `{ id, ts, text }`.
- `deals[].tasks`: `{ id, text, done }`.
- `projects[].subtasks`: `{ id, text, done, dueDate }`.
- `selectedDealId` / `selectedContactId`: drives which drawer is open.
- `modal`: which add-modal is open (or null); shared `form*` fields reused across modal types.
- `incomingPool` + `lastSynced`: stand-in for a real inbound-lead source (website form / Google Sheet row).

**For the real build**, replace all of this with server-persisted records (one table per entity: leads, deals, contacts, projects, invoices, plus join/activity tables) and real API calls instead of local `setState`.

## Data Model (suggested for the real backend)
- **Lead**: id, name, company, email, message, source, received_at, status (new | in_pipeline)
- **Contact**: id, name, company, email, phone, title
- **Activity** (polymorphic, belongs to a Deal or Contact): id, parent_type, parent_id, ts, text
- **Deal**: id, title, company, contact_id, value, stage, close_date, notes
- **Task** (belongs to Deal): id, deal_id, text, done
- **Project**: id, name, client, status, due_date, deal_id (optional link)
- **Subtask** (belongs to Project): id, project_id, text, done, due_date
- **Invoice**: id, client, deal_id (optional), amount, status, issued_at, due_date

## Real Integrations Needed
- **Google Sheets sync**: either poll the Sheets API on an interval, or (better, given the stated goal of adding workflow agents) have the website's form handler POST directly to your new backend AND append to the Sheet, so both stay in sync without polling.
- **Workflow agents**: since the user wants agents to act on new spreadsheet rows, the backend should expose a webhook/endpoint that fires on new-lead creation (rather than relying on sheet-row polling) so agents can hook in cleanly.
- **Auth**: even solo, add basic login (e.g. NextAuth with a single-user credential) before deploying somewhere public.

## Design Tokens
No hardcoded hex values in the prototype — everything reads from CSS custom properties in a separate design-system stylesheet (not included in this bundle): `--color-bg`, `--color-text`, `--color-accent`, `--color-neutral-200/300`, `--space-1` through `--space-8`, `--radius-md`, plus `.tag-accent`, `.tag-accent-2`, `.tag-neutral`, `.tag-outline` variants and `.btn-primary` / `.btn-secondary` button styles. Recreate equivalents in the target app's own design system rather than porting this CSS file directly.

## Assets
None — no images/icons used.

## Files
- `TBK CRM.dc.html` — the full working prototype (single file, inline styles, React-like component logic embedded in a `<script>` tag). Open directly in a browser to explore all screens and interactions.
