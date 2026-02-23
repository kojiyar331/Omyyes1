const axios = require("axios");

module.exports.config = {
  name: "hercai",
  version: "6.5.0",
  hasPermission: 0,
  credits: "Shaan Khan", 
  description: "Real-time AI with Multi-language support",
  commandCategory: "AI",
  usePrefix: false,
  usages: "[AI + Sawal] or [script <language>]",
  cooldowns: 1,
};

let userMemory = {};
let userSettings = {}; // Language preference store karne ke liye
let isActive = true;

const GROQ_API_KEY = "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"; 

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, senderID, body, messageReply } = event;
  if (!isActive || !body) return;

  const input = body.trim().toLowerCase();
  const triggerWords = ["ai", "bot", "hercai", "taha"];
  const isReplyToBot = messageReply && messageReply.senderID === api.getCurrentUserID();
  const startsWithTrigger = triggerWords.some(word => input.startsWith(word + " "));

  if (triggerWords.includes(input)) return;
  if (!startsWithTrigger && !isReplyToBot) return;

  let cleanInput = body;
  triggerWords.forEach(word => {
    if (input.startsWith(word + " ")) cleanInput = body.slice(word.length).trim();
  });

  api.setMessageReaction("⌛", messageID, () => {}, true);

  // Initializing Memory & Language
  if (!userMemory[senderID]) userMemory[senderID] = [];
  if (!userSettings[senderID]) userSettings[senderID] = "Roman Urdu";

  let searchResults = "";
  const timeQuery = ["aaj", "today", "waqt", "time", "date"].some(word => input.includes(word));
  
  if (timeQuery) {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Karachi' };
    searchResults = `\n[SYSTEM INFO: Date: ${now.toLocaleDateString('en-US', options)}. Time: ${now.toLocaleTimeString('en-US')}]`;
  }

  const systemPrompt = `
  Identity: You are Hercai AI by taha Khan.
  Current Context: ${searchResults}
  
  STRICT RULES:
  1. LANGUAGE/SCRIPT: You MUST reply only in ${userSettings[senderID]}. 
  2. If script is "Urdu Native", use Urdu alphabet (اردو). 
  3. If script is "Hindi", use Devanagari (हिंदी).
  4. LENGTH: Max 2-3 short sentences.
  5. STYLE: Friendly but direct. Use 1-2 emojis. ✨`;

  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          ...userMemory[senderID],
          { role: "user", content: cleanInput }
        ],
        temperature: 0.6,
        max_tokens: 300
      },
      { headers: { "Authorization": `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" } }
    );

    let botReply = response.data.choices[0].message.content;

    userMemory[senderID].push({ role: "user", content: cleanInput }, { role: "assistant", content: botReply });
    if (userMemory[senderID].length > 8) userMemory[senderID].splice(0, 2);

    api.setMessageReaction("✅", messageID, () => {}, true);
    return api.sendMessage(botReply, threadID, messageID);

  } catch (error) {
    api.setMessageReaction("❌", messageID, () => {}, true);
    return api.sendMessage("❌ Groq API Error! Check Key. ✨", threadID, messageID);
  }
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const cmd = args[0]?.toLowerCase();

  // Multi-Language Selection Logic
  if (cmd === "script" || cmd === "language") {
    const lang = args[1]?.toLowerCase();
    const modes = {
      "roman": "Roman Urdu",
      "urdu": "Urdu Native (اردو)",
      "english": "English",
      "hindi": "Hindi (हिंदी)"
    };

    if (modes[lang]) {
      userSettings[senderID] = modes[lang];
      return api.sendMessage(`✅ Language set to: ${modes[lang]} ✨`, threadID, messageID);
    } else {
      return api.sendMessage("❓ Usage: hercai script [roman/urdu/english/hindi]", threadID, messageID);
    }
  }

  if (cmd === "on") { isActive = true; return api.sendMessage("✅ Hercai Active!", threadID, messageID); }
  if (cmd === "off") { isActive = false; return api.sendMessage("⚠️ Paused.", threadID, messageID); }
  if (cmd === "clear") { userMemory[senderID] = []; return api.sendMessage("🧹 Memory Cleared!", threadID, messageID); }
};
