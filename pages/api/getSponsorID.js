// pages/api/getSponsorID.js
import { google } from "googleapis";

const PRIVATE_KEY = process.env.PRIVATE_KEY.replace(/\\n/g, '\n'); // Handle new lines in private key
const CLIENT_EMAIL = process.env.CLIENT_EMAIL;
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

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
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const userIdHHF = req.query.id;
  const { sheets } = await authSheets();

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
