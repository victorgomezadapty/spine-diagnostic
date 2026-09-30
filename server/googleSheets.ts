interface GoogleSheetLeadData {
  type: string;
  name: string;
  email: string;
  phone: string | null;
  country: string | null;
  spineAge: number | null;
  realAge: number | null;
  riskLevel: string | null;
  totalScore: number | null;
  occupation: string | null;
  timestamp: string;
}

export async function sendToGoogleSheet(data: GoogleSheetLeadData): Promise<{ success: boolean; error?: string }> {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn("GOOGLE_SHEETS_WEBHOOK_URL not configured, skipping Google Sheets sync");
    return { success: false, error: "Webhook URL not configured" };
  }

  try {
    console.log(`[Google Sheets] Sending ${data.type} for ${data.email} to webhook...`);

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(data),
      redirect: "follow",
      signal: AbortSignal.timeout(30000),
    });

    const responseText = await response.text().catch(() => "");
    console.log(`[Google Sheets] Response status: ${response.status}, body: ${responseText.substring(0, 200)}`);

    if (response.status >= 200 && response.status < 400) {
      return { success: true };
    }

    throw new Error(`HTTP ${response.status}: ${responseText}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[Google Sheets] Error:", message);
    return { success: false, error: message };
  }
}
