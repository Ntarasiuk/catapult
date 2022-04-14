const { Client } = require("@notionhq/client");
export default async function handler(req, res) {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  // Initializing a client
  const notion = new Client({
    auth: process.env.NOTION_TOKEN,
  });
  const pageInfo = await notion.pages.retrieve({
    page_id: "6b2b4269098d407a8cafab3f46842396",
  });

  if (!pageInfo) {
    console.log("error!!!");

    return res.status(500).json({ error: data.error.email[0] });
  }

  return res.status(201).json({ error: "", data: pageInfo });
}

