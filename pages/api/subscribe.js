const { Client } = require("@notionhq/client");

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

  if (!process.env.NOTION_TOKEN || !process.env.NOTION_DATABASE_ID) {
    return res
      .status(500)
      .json({ error: "Notion is not configured on the server" });
  }

  const notion = new Client({ auth: process.env.NOTION_TOKEN });
  const databaseId = process.env.NOTION_DATABASE_ID;

  const detail =
    company && company_url
      ? `${company} — ${company_url}`
      : company || company_url || "";

  try {
    const response = await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        title: { title: [{ text: { content: email } }] },
        Type: { type: "select", select: { name: type } },
        Company: {
          type: "rich_text",
          rich_text: [{ text: { content: detail } }],
        },
      },
    });
    return res.status(201).json({ error: "", data: response });
  } catch (error) {
    console.error("Notion error:", error.body || error);
    return res
      .status(500)
      .json({ error: error.body || "Failed to submit. Please try again." });
  }
}
