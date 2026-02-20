const fs = require("fs");
const axios = require("axios");
const path = require("path");

// ===== MODULE CONFIG =====
module.exports.config = {
  name: "videoall",
  version: "1.0.2",
  hasPermssion: 0,
  credits: "ARIF BABU",
  description: "GirlVideo & TikTok random video sender",
  commandCategory: "Random-VIDEO",
  usages: "girlvideo / tiktok",
  cooldowns: 3,
};

// ===== HARD CREATOR LOCK =====
const CREATOR_LOCK = (() => {
  const encoded = "QVJJRiBCQUJV"; // ARIF BABU
  return Buffer.from(encoded, "base64").toString("utf8");
})();

if (module.exports.config.credits !== CREATOR_LOCK) {
  console.log("❌ Creator Lock Activated!");
  module.exports.run = () => {};
  module.exports.handleEvent = () => {};
  return;
}

// ===== HANDLE EVENT =====
module.exports.handleEvent = async function ({ api, event }) {
  const { body, threadID, messageID } = event;
  if (!body) return;

  const text = body.trim();
  const lower = text.toLowerCase();

  // ===== PREFIX CHECK =====
  const prefixes = ["!", "?", "/", "#", "."]; // apna prefix yaha add kar sakte ho

  for (let p of prefixes) {
    if (lower.startsWith(p)) {
      return api.sendMessage(
        "⚠️ Ye prefix wala command hai.\nBina prefix likho: girlvideo ya tiktok",
        threadID,
        messageID
      );
    }
  }

  const categories = {
    girlvideo: {
      links: [
        "https://i.imgur.com/ZCmkPTO.mp4",
        "https://i.imgur.com/JA8jUCD.mp4",
        "https://i.imgur.com/W3N3f9Y.mp4",
        "https://i.imgur.com/sAIueiC.mp4"
      ],
      reaction: "✅"
    },
    tiktok: {
      links: [
        "https://i.imgur.com/ZCmkPTO.mp4",
        "https://i.imgur.com/JA8jUCD.mp4",
        "https://i.imgur.com/W3N3f9Y.mp4",
        "https://i.imgur.com/sAIueiC.mp4"
      ],
      reaction: "🥳"
    }
  };

  if (!categories[lower]) return;

  const randomLink =
    categories[lower].links[
      Math.floor(Math.random() * categories[lower].links.length)
    ];

  // ===== CACHE FOLDER =====
  const cacheDir = path.join(__dirname, "cache");
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }

  const filePath = path.join(cacheDir, `${Date.now()}.mp4`);

  try {
    const response = await axios.get(randomLink, {
      responseType: "arraybuffer",
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    fs.writeFileSync(filePath, response.data);

    await api.sendMessage(
      {
        body: "",
        attachment: fs.createReadStream(filePath)
      },
      threadID,
      () => {
        fs.unlinkSync(filePath);
      },
      messageID
    );

    api.setMessageReaction(
      categories[lower].reaction,
      messageID,
      () => {},
      true
    );

  } catch (err) {
    console.log(err.message);
    api.sendMessage(
      "❌ Video send failed. Link problem ho sakta hai.",
      threadID,
      messageID
    );
  }
};

module.exports.run = async () => {};