// frontend/pages/api/send-message.ts

import type { NextApiRequest, NextApiResponse } from "next";

const PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN!;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") return res.status(405).end();

  const { recipientId, message } = req.body;

  const fbRes = await fetch(
    `https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text: message },
      }),
    }
  );

  const data = await fbRes.json();

  if (!fbRes.ok) {
    return res.status(500).json({ error: data.error });
  }

  res.status(200).json({ status: "送信成功！" });
}
