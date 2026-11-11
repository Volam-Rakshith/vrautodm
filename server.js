require("dotenv").config();
const express = require("express");

const app = express();
app.use(express.json({ verify: (req, res, buf) => { req.rawBody = buf; } }));
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN;
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const IG_USER_ID = process.env.IG_USER_ID;
const GRAPH_VERSION = process.env.GRAPH_API_VERSION || "vXX.X";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

const seenComments = new Set();

app.get("/health", (_req, res) => res.json({ ok: true, service: "VR AUTO DM" }));

// Meta webhook verification handshake
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode === "subscribe" && token && token === VERIFY_TOKEN) return res.status(200).send(challenge);
  return res.sendStatus(403);
});

// Subscribe your Meta app to Instagram comment webhooks.
app.post("/webhook", async (req, res) => {
  // Acknowledge quickly; process events after the response.
  res.sendStatus(200);
  try {
    const body = req.body || {};
    if (body.object !== "instagram") return;
    for (const entry of (body.entry || [])) {
      for (const change of (entry.changes || [])) {
        if (change.field !== "comments") continue;
        const value = change.value || {};
        const commentId = value.id || value.comment_id;
        const commentText = value.text || "";
        const username = value.from?.username || value.username || "there";
        if (!commentId || seenComments.has(commentId)) continue;
        seenComments.add(commentId);

        const enabled = process.env.AUTO_REPLY_ENABLED !== "false";
        const keyword = (process.env.TRIGGER_KEYWORD || "").trim().toLowerCase();
        if (!enabled) continue;
        if (keyword && !commentText.toLowerCase().includes(keyword)) continue;

        const template = process.env.DM_TEMPLATE ||
          "Hey {{username}}! Thanks for commenting. Follow our page for updates, then check our profile for more. — VR Developments";
        const message = template.replaceAll("{{username}}", username.replace(/^@/, ""));
        await sendPrivateReply(commentId, message);
      }
    }
  } catch (err) {
    console.error("Webhook processing error:", err.message);
  }
});

async function sendPrivateReply(commentId, text) {
  if (!ACCESS_TOKEN || !IG_USER_ID || GRAPH_VERSION.includes("XX")) {
    console.error("Missing Meta API configuration. Set META_ACCESS_TOKEN, IG_USER_ID and a valid GRAPH_API_VERSION.");
    return;
  }
  const url = `${GRAPH_BASE}/${IG_USER_ID}/messages`;
  const params = new URLSearchParams({
    access_token: ACCESS_TOKEN,
    "recipient": JSON.stringify({ comment_id: commentId }),
    "message": JSON.stringify({ text })
  });
  const response = await fetch(url, { method: "POST", body: params });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || JSON.stringify(data));
  console.log("Private reply sent for comment:", commentId, data);
}

app.listen(PORT, () => console.log(`VR AUTO DM server listening on port ${PORT}`));
