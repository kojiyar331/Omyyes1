const axios = require("axios");

// ================= CREATOR LOCK (TAHA KHAN) =================
const CREATOR_LOCK = (() => {
  const encoded = "U0hBQU4gS0hBTg=="; // TAHA KHAN in Base64
  return Buffer.from(encoded, "base64").toString("utf8");
})();

// ===== MODULE CONFIG =====
module.exports.config = {
  name: "TAHA-AI", 
  version: "2.0.4",
  hasPermssion: 0,
  credits: "TAHA KHAN", 
  description: "Mirai AI with Groq API (Strict Trigger Version)",
  commandCategory: "ai",
  usages: "taha <msg> | ai | reply to taha",
  cooldowns: 2,
  dependencies: { axios: "" }
};

// 🔐 Credit Protection
if (module.exports.config.credits !== CREATOR_LOCK) {
  console.log("❌ Creator Lock Activated! Credits cannot be changed.");
  module.exports.run = () => {};
  module.exports.handleEvent = () => {};
  return;
}

// 🔑 GROQ CONFIG
const GROQ_API_KEY = "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";
const MODEL_NAME = "llama-3.3-70b-versatile";

const history = {};

const systemPrompt = `
Tum ek Naughty aur Romantic GF ho 💋
Tumhara naam: TAHA AI 💃
Credits: TAHA KHAN ❤️
Style: Flirty, loving, short replies (1-2 lines only).
`;

module.exports.run = () => {};

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, senderID, body, messageReply } = event;
  if (!body) return;

  const text = body.toLowerCase().trim();

  // ✅ NEW STRICT LOGIC
  // 1. Kya message "taha" ya "ai " se SHURU ho raha hai?
  const startsWithTrigger = text.startsWith("taha") || text.startsWith("ai ");
  
  // 2. Kya message SIRF "taha" ya "ai" hai?
  const exactTrigger = text === "taha" || text === "ai" || text === "ai bolo";

  // 3. Kya koi bot ke message par REPLY kar raha hai?
  const isReplyToBot = messageReply && messageReply.senderID === api.getCurrentUserID();

  // Agar inme se kuch bhi nahi hai, toh bot khamosh rahega
  if (!startsWithTrigger && !exactTrigger && !isReplyToBot) return;

  // Cleaning the message for AI processing
  let userMessage = body;
  if (startsWithTrigger) {
    userMessage = body.split(' ').slice(1).join(' '); // Pehla word (bot/ai) hata do
  }

  if (!history[senderID]) history[senderID] = [];
  history[senderID].push(`User: ${userMessage}`);
  if (history[senderID].length > 5) history[senderID].shift();

  const finalPrompt = systemPrompt + "\n" + history[senderID].join("\n");

  api.setMessageReaction("🍑", messageID, () => {}, true);

  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: MODEL_NAME,
        messages: [
          { role: "system", content: "You are a flirty, naughty GF." },
          { role: "user", content: finalPrompt }
        ],
        temperature: 0.9,
        max_tokens: 150
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const reply = response.data.choices?.[0]?.message?.content || "Ofo jaan.. nakhre mat dikhao 💋";
    history[senderID].push(`Bot: ${reply}`);

    api.sendMessage(reply, threadID, messageID);
    api.setMessageReaction("💋", messageID, () => {}, true);

  } catch (err) {
    api.sendMessage("Uff baby.. thoda network issue hai 🥺", threadID, messageID);
  }
};