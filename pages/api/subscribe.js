const { Client } = require("@notionhq/client");
export default async function handler(req, res) {
  const { email, type = "Recruiter", company, company_url } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  // Initializing a client
  const notion = new Client({
    auth: process.env.NOTION_TOKEN,
  });

  const databaseId = process.env.NOTION_DATABASE_ID;

  try {
    const response = await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        title: {
          title: [
            {
              text: {
                content: email,
              },
            },
          ],
        },

        Type: {
          type: "select",
          select: {
            name: type,
          },
        },
        Company: {
          type: "rich_text",
          rich_text: [
            {
              text: {
                content: company,
                ...(company_url
                  ? {
                      link: {
                        url: "https://google.com",
                      },
                    }
                  : null),
              },
            },
          ],
        },
      },
    });
    console.log("Success! Entry added.");
    return res.status(201).json({ error: "", data: response });
  } catch (error) {
    console.error(error.body);
    return res.status(500).json({ error: error.body });
  }
}

