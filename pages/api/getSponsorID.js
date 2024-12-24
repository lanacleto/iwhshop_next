import { google } from "googleapis";

const PRIVATE_KEY = process.env.PRIVATE_KEY?.replace(/\\n/g, '\n') || 'default-private-key'; // Handle new lines in private key
const CLIENT_EMAIL = process.env.CLIENT_EMAIL || 'default-client-email';
const SPREADSHEET_ID = process.env.SPREADSHEET_ID || 'default-spreadsheet-id';

async function authSheets() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      private_key: PRIVATE_KEY,
      client_email: CLIENT_EMAIL,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const authClient = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: authClient });

  return { sheets };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*'); // Permite qualquer origem
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const userIdHHF = req.query.id;
  const { sheets } = await authSheets();

  console.log('SPREADSHEET_ID:', SPREADSHEET_ID); // Log for debugging

  try {
    const getRows = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Affiliates",
    });

    if (!getRows.data.values) {
      return res.status(404).json({ error: "No data found in spreadsheet" });
    }

    for (let i = 1; i < getRows.data.values.length; i++) {
      if (getRows.data.values[i][5] === userIdHHF) {
        return res.status(200).json({ sponsorId: getRows.data.values[i][6] });
      }
    }

    return res.status(404).json({ error: "Sponsor ID not found" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch data" });
  }
}
