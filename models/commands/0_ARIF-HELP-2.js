const fs = require("fs");
const request = require("request");

/* ================= CREATOR LOCK ================= */

const CREATOR_LOCK = (() => {
  const encoded = "QVJJRiBCQUJV";
  return Buffer.from(encoded, "base64").toString("utf8");
})();

/* ================= CONFIG ================= */

module.exports.config = {
  name: "help2",
  version: "4.4.0",
  hasPermssion: 0,
  credits: "ARIF BABU",
  description: "Stylish category wise command list",
  commandCategory: "SYSTEM",
  usages: "help2",
  cooldowns: 1
};

// 🔐 Credit Protection
if (module.exports.config.credits !== CREATOR_LOCK) {
  console.log("❌ Creator Lock Activated! Credits cannot be changed.");
  module.exports.run = () => {};
  return;
}

/* ================= LANGUAGE ================= */

const lang = {
  en: {
    title: "📚 ALL AVAILABLE COMMANDS",
    footer: "MADE BY TAHA BABU 🙂🥀"
  }
};

const getText = (key) => lang.en[key];

/* ================= MAIN RUN ================= */

module.exports.run = async ({ api, event }) => {
  const { commands } = global.client;
  const { threadID, messageID } = event;

  const prefix =
    global.data.threadData.get(threadID)?.PREFIX ||
    global.config.PREFIX;

  /* ===== CATEGORY MAP ===== */
  const categories = {};

  for (const [name, cmd] of commands) {
    const cate = cmd.config.commandCategory || "OTHER";
    if (!categories[cate]) categories[cate] = [];
    categories[cate].push(name);
  }

  /* ===== BUILD MESSAGE ===== */
  let msg = "╭──────── ★ ────────╮\n";
  msg += `${getText("title")}\n`;
  msg += "╰──────── ★ ────────╯\n\n";

  for (const cate of Object.keys(categories).sort()) {
    msg += `┏━ 📂 ${cate.toUpperCase()} ━┓\n`;
    categories[cate]
      .sort()
      .forEach((name) => {
        msg += `┃ ${prefix}${name}\n`;
      });
    msg += "┗━━━━━━━━━━━━━━━━┛\n\n";
  }

  msg += getText("footer");

  /* ===== IMAGE ===== */
  const images = [
    "https://i.ibb.co/8gf4dQWc/a44248a85dbc.gif",
    "https://i.ibb.co/8gf4dQWc/a44248a85dbc.gif",
    "https://i.ibb.co/8gf4dQWc/a44248a85dbc.gif",
    "https://i.ibb.co/8gf4dQWc/a44248a85dbc.gif"
  ];

  const img = images[Math.floor(Math.random() * images.length)];
  const filePath = __dirname + "/cache/help2.png";

  request(img)
    .pipe(fs.createWriteStream(filePath))
    .on("finish", () => {
      api.sendMessage(
        { body: msg, attachment: fs.createReadStream(filePath) },
        threadID,
        () => fs.unlinkSync(filePath),
        messageID
      );
    });
};