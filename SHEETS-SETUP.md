# Connecting the Leads sheet

The "Sync now" button on the Leads page pulls new rows in from your **"TBK Contacts and Leads"** Google Sheet (both the "Leads" and "Contact" tabs) and creates a CRM lead for each one, skipping anything it's already imported. This needs a Google service account with read-only access to just that sheet — about 10 minutes, one-time setup.

## 1. Create a Google Cloud service account

1. Go to [console.cloud.google.com](https://console.cloud.google.com) and sign in with the same Google account that owns the sheet (`chelsea.kennamore@tbkenterpriseconsulting.com`).
2. Create a new project (or reuse an existing one) — any name is fine, e.g. "TBK CRM".
3. Enable the **Google Sheets API**: search for it in the top search bar → click **Enable**.
4. Go to **IAM & Admin → Service Accounts → Create Service Account**.
   - Name: anything, e.g. `tbk-crm-sheets-reader`.
   - No roles/permissions needed at the project level — skip that step.
5. Click into the new service account → **Keys** tab → **Add Key → Create new key → JSON**. This downloads a `.json` file — keep it private, don't commit it anywhere.

## 2. Share the sheet with the service account

1. Open the downloaded JSON file and find the `client_email` field — it looks like `tbk-crm-sheets-reader@your-project.iam.gserviceaccount.com`.
2. Open the **"TBK Contacts and Leads"** Google Sheet, click **Share**, and add that email address as a **Viewer** (read-only — it never needs edit access).

## 3. Set the environment variables

From the same JSON file, you need two fields plus the sheet's ID:

| Vercel env var | Where it comes from |
|---|---|
| `GOOGLE_SHEETS_SPREADSHEET_ID` | The long ID in the sheet's URL: `docs.google.com/spreadsheets/d/`**`1W_Akj80FhfHBSZwIS4M9Pbv5X_862tHDi_lywAoN55I`**`/edit...` |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | The `client_email` field from the JSON |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | The `private_key` field from the JSON — copy it **exactly as-is**, including the `\n` sequences and the `-----BEGIN/END PRIVATE KEY-----` lines |

Add all three in Vercel → your project → **Settings → Environment Variables** (checking Production/Preview/Development like the others), then redeploy.

For local development, add the same three to your `.env` file.

## How it works

- Both the **Leads** tab (resource/lead-magnet signups) and **Contact** tab (direct inquiries) are pulled in, tagged with different sources so Reports can tell them apart.
- Each row is matched against the sheet tab + timestamp + email, so re-clicking "Sync now" never creates duplicates — only genuinely new rows since the last sync are imported.
- Column matching is by **header name**, not position, so reordering columns in the sheet is safe. Renaming a header (e.g. `email` → `Email Address`) will break the mapping for that column, though — if you rename headers, let your developer/AI assistant know so the mapping in `app/actions/leads.ts` can be updated to match.
- This is a manual, on-demand sync (click the button). If you want it to run automatically on a schedule instead, that's a small follow-up (a Vercel Cron Job calling the same sync logic every N minutes) — ask if you want that added.
