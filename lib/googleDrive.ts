import { JWT } from "google-auth-library";

// Same service account already used for the Sheets sync (see
// lib/googleSheets.ts), just with Drive scope added -- share the parent
// customer-folders Drive folder with its client_email to grant access,
// same pattern as sharing the leads spreadsheet.
const SCOPES = ["https://www.googleapis.com/auth/drive"];

let client: JWT | null = null;

function getAuthClient(): JWT {
  if (client) return client;

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const encodedKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_B64;
  if (!email || !encodedKey) {
    throw new Error(
      "GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_B64 are not configured."
    );
  }

  const key = Buffer.from(encodedKey, "base64").toString("utf8");

  client = new JWT({
    email,
    key,
    scopes: SCOPES,
  });
  return client;
}

const SUBFOLDERS = ["Contracts", "Deliverables", "Invoices", "Correspondence"];

async function createFolder(auth: JWT, name: string, parentId: string): Promise<string> {
  const res = await auth.request<{ id: string }>({
    url: "https://www.googleapis.com/drive/v3/files",
    method: "POST",
    data: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    },
  });
  return res.data.id;
}

// Creates a customer folder (with standard empty subfolders) under the
// configured parent Drive folder, for a deal that just closed. Best-effort:
// returns null and logs rather than throwing if Drive isn't configured yet
// or the API call fails, since this is a nice-to-have side effect of a deal
// closing -- it must never block the Won transition or Project creation.
export async function createCustomerFolder(name: string): Promise<string | null> {
  const parentId = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID;
  if (!parentId) return null;

  try {
    const auth = getAuthClient();
    const folderId = await createFolder(auth, name, parentId);
    await Promise.all(SUBFOLDERS.map((sub) => createFolder(auth, sub, folderId)));
    return `https://drive.google.com/drive/folders/${folderId}`;
  } catch (err) {
    console.error("[googleDrive] Failed to create customer folder:", err);
    return null;
  }
}
