import { JWT } from "google-auth-library";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"];

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

  // Stored base64-encoded (single line, no special characters) so pasting it
  // into an env var UI can't lose or collapse the PEM's internal line breaks.
  const key = Buffer.from(encodedKey, "base64").toString("utf8");

  client = new JWT({
    email,
    key,
    scopes: SCOPES,
  });
  return client;
}

// Fetches a sheet tab as a grid of raw string cells (first row is the header).
export async function fetchSheetTab(
  spreadsheetId: string,
  tabName: string
): Promise<string[][]> {
  const auth = getAuthClient();
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(tabName)}`;
  const res = await auth.request<{ values?: string[][] }>({ url });
  return res.data.values ?? [];
}

// Converts a raw grid (header row + data rows) into header-keyed row objects.
export function rowsToObjects(values: string[][]): Record<string, string>[] {
  if (values.length === 0) return [];
  const [header, ...rows] = values;
  return rows.map((row) => {
    const obj: Record<string, string> = {};
    header.forEach((key, i) => {
      obj[key] = row[i] ?? "";
    });
    return obj;
  });
}
