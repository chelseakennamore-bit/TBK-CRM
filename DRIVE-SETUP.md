# Connecting customer folders to Google Drive

When a deal is marked **Won**, the CRM already auto-creates a Project for the engagement. If this is configured, it also creates a matching folder in Google Drive — named after the client and deal, with empty `Contracts`, `Deliverables`, `Invoices`, and `Correspondence` subfolders ready to use — and links to it from the Project drawer ("View in Drive"). This is entirely optional: a deal can always close without it configured, nothing breaks either way.

This reuses the **same Google service account** already set up for the Leads sheet sync (see `SHEETS-SETUP.md`) — if you've already done that setup, you only need steps 2 and 3 below, about 5 minutes.

## 1. (Skip if you already did this for Sheets) Create a Google Cloud service account

Follow section 1 of `SHEETS-SETUP.md` to create the service account and download its JSON key. You do not need a second service account — one covers both Sheets and Drive.

## 2. Enable the Google Drive API

The Sheets setup only enabled the Sheets API — Drive is a separate API that needs its own enable step.

1. Go to [console.cloud.google.com](https://console.cloud.google.com), same project as before.
2. Search for **Google Drive API** in the top search bar → click **Enable**.

## 3. Create a parent folder and share it with the service account

1. In Google Drive, create a folder to hold all customer folders — e.g. **"Clients"**.
2. Right-click it → **Share** → add the service account's email (the `client_email` field from the JSON key, looks like `tbk-crm-sheets-reader@your-project.iam.gserviceaccount.com`) as an **Editor** (it needs to create folders inside, not just view).
3. Open the folder and copy its ID from the URL: `drive.google.com/drive/folders/`**`1AbCdEfGhIjKlMnOpQrStUvWxYz`**

## 4. Set the environment variable

| Vercel env var | Where it comes from |
|---|---|
| `GOOGLE_DRIVE_PARENT_FOLDER_ID` | The folder ID from step 3 |

`GOOGLE_SERVICE_ACCOUNT_EMAIL` and `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_B64` are the same values already set up for Sheets — no need to add them again.

Add it in Vercel → your project → **Settings → Environment Variables** (Production/Preview as needed), then redeploy. For local development, add it to your `.env` file too.

## How it works

- Triggered only by a deal's stage changing to **Won** — the same moment the CRM auto-creates the Project. There's no way to retroactively create a folder for an already-won deal from the UI; ask your developer/AI assistant if you need one backfilled.
- The folder is named `<Client> — <Deal title>`, so a client with multiple engagements over time gets a separate folder per engagement rather than one shared folder.
- If `GOOGLE_DRIVE_PARENT_FOLDER_ID` isn't set, or the Drive API call fails for any reason, the deal still closes and the Project still gets created normally — you'll just see no "View in Drive" link on that Project, and can add one manually in Drive if you want.
- Subfolders are created empty. Populating them with starter documents (contract templates, welcome letters, etc.) is a natural next step once this is working.
