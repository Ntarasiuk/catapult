export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    email,
    type = "Website",
    company = "",
    company_url = "",
  } = req.body || {};

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const token = process.env.TELEGRAM_BOT_KEY;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    return res
      .status(500)
      .json({ error: "Telegram is not configured on the server" });
  }

  const escape = (s) =>
    String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const lines = [
    "<b>📨 New Catapult brief</b>",
    `<b>Email:</b> ${escape(email)}`,
    `<b>Type:</b> ${escape(type)}`,
  ];
  if (company) lines.push(`<b>Company:</b> ${escape(company)}`);
  if (company_url) lines.push(`<b>Details:</b>\n${escape(company_url)}`);

  try {
    const tgRes = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: lines.join("\n"),
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      }
    );
    const data = await tgRes.json();
    if (!tgRes.ok || !data.ok) {
      console.error("Telegram error:", data);
      return res
        .status(502)
        .json({ error: data.description || "Failed to deliver message" });
    }
    return res.status(201).json({ error: "", ok: true });
  } catch (error) {
    console.error("Telegram request failed:", error);
    return res
      .status(500)
      .json({ error: "Failed to submit. Please try again." });
  }
}
