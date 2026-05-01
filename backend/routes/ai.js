const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");

// POST /api/ai/gemini
router.post("/gemini", protect, async (req, res) => {
  const { messages, apiKey } = req.body;

  if (!apiKey || typeof apiKey !== "string" || !apiKey.startsWith("AIza")) {
    return res.status(400).json({ error: "A valid Gemini API key is required (must start with AIza)." });
  }

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages array is required." });
  }

  // Build a clean alternating user/model conversation for Gemini.
  // Filter out any AI-generated "welcome" messages and ensure roles alternate correctly.
  const WELCOME_SNIPPETS = ["ChatVerse AI ✨", "I'm ChatVerse AI", "powered by Google Gemini"];

  const clean = messages
    .filter(m => m.content && m.content.trim())
    // Remove static welcome/greeting messages so they don't pollute the chat history
    .filter(m => !WELCOME_SNIPPETS.some(s => m.content.includes(s)))
    .map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      text: m.content.trim(),
    }));

  // Gemini requires the conversation to strictly alternate: user → model → user → ...
  // Merge consecutive same-role messages and ensure it starts with "user"
  const merged = [];
  for (const msg of clean) {
    if (merged.length > 0 && merged[merged.length - 1].role === msg.role) {
      merged[merged.length - 1].text += "\n" + msg.text;
    } else {
      merged.push({ ...msg });
    }
  }

  // Drop leading model messages — must start with user
  while (merged.length > 0 && merged[0].role === "model") merged.shift();

  if (merged.length === 0) {
    return res.status(400).json({ error: "No valid user messages found." });
  }

  // Build Gemini contents: start with system persona exchange, then the real chat
  const contents = [
    {
      role: "user",
      parts: [{ text: "You are ChatVerse AI, a friendly and helpful assistant built into the ChatVerse chat app. Be concise and conversational. Keep replies short unless the user asks for detail. IMPORTANT: If the user asks you to generate, draw, or create an image, you MUST respond by returning ONLY a markdown image using the Pollinations AI URL format, and DO NOT wrap it in backticks, quotes, or code blocks. Just output the raw markdown image syntax. Example: ![A futuristic city](https://image.pollinations.ai/prompt/A%20futuristic%20city%20with%20flying%20cars%20at%20sunset)" }],
    },
    {
      role: "model",
      parts: [{ text: "Got it! I'm ChatVerse AI, ready to help." }],
    },
    ...merged.map(m => ({
      role: m.role,
      parts: [{ text: m.text }],
    })),
  ];

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  try {
    const fetchFn = typeof fetch !== "undefined" ? fetch : await importNodeFetch();

    const geminiRes = await fetchFn(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: {
          maxOutputTokens: 1024,
          temperature: 0.8,
        },
      }),
    });

    const data = await geminiRes.json();

    if (!geminiRes.ok || data.error) {
      const errMsg = data.error?.message || `Gemini API error (${geminiRes.status})`;
      const code = data.error?.code || geminiRes.status;
      const isBadKey = code === 401 || code === 403 || (code === 400 && errMsg.toLowerCase().includes("api key"));
      return res.status(isBadKey ? 401 : code || 502).json({ error: errMsg });
    }

    // Extract reply text — skip internal "thought" parts from thinking models
    const parts = data.candidates?.[0]?.content?.parts || [];
    const text = parts
      .filter(p => p.text && !p.thought)
      .map(p => p.text)
      .join("") || parts.filter(p => p.text).map(p => p.text).pop();

    if (!text) {
      return res.status(502).json({ error: "Gemini returned an empty response. It might have been blocked by safety filters." });
    }

    return res.json({ reply: text });

  } catch (err) {
    console.error("Gemini proxy error:", err.message);
    return res.status(502).json({ error: "Could not reach Gemini API. Check server connectivity." });
  }
});

// Node < 18 fallback
async function importNodeFetch() {
  try {
    const { default: f } = await import("node-fetch");
    return f;
  } catch {
    throw new Error("fetch is not available. Use Node 18+ or install node-fetch.");
  }
}

module.exports = router;