const fs = require("fs");
const request = require("request");

// ================= CREATOR LOCK =================
const CREATOR_LOCK = (() => {
  const encoded = "QVJJRiBCQUJV";
  return Buffer.from(encoded, "base64").toString("utf8");
})();

module.exports.config = {
  name: "help",
  version: "3.8.0",
  hasPermssion: 0,
  credits: "ARIF BABU",
  description: "Help menu (Prefix only)",
  commandCategory: "BOT-COMMAND-LIST",
  usages: "help / help <page> / help <cmd>",
  cooldowns: 1,
};

// 🔐 Credit Protection
if (module.exports.config.credits !== CREATOR_LOCK) {
  console.log("❌ Creator Lock Activated! Credits cannot be changed.");
  module.exports.run = () => {};
  return;
}

module.exports.languages = {
  en: {
    moduleInfo:
`╭─────────────────────────────╮
│        🤖 𝐁𝐎𝐓 𝗛𝗘𝗟𝗣        │
╰─────────────────────────────╯

• Name: %1
• Description: %2
• Usage: %3
• Category: %4
• Cooldown: %5 sec
• Permission: %6
• Developer: %7`,

    user: "User",
    adminGroup: "Admin Group",
    adminBot: "Bot Admin"
  }
};

// ================= MAIN HELP =================
module.exports.run = async function ({ api, event, args, getText }) {
  const { commands } = global.client;
  const { threadID, messageID } = event;

  const prefix =
    global.data.threadData.get(parseInt(threadID))?.PREFIX ||
    global.config.PREFIX;

  // ================= COMMAND INFO =================
  if (args[0] && commands.has(args[0])) {
    const data = commands.get(args[0]);

    return api.sendMessage(
      getText(
        "moduleInfo",
        data.config.name,
        data.config.description,
        `${prefix}${data.config.name} ${(data.config.usages || "")}`,
        data.config.commandCategory,
        data.config.cooldowns,
        (data.config.hasPermssion == 0
          ? getText("user")
          : data.config.hasPermssion == 1
          ? getText("adminGroup")
          : getText("adminBot")),
        data.config.credits
      ),
      threadID,
      messageID
    );
  }

  // ================= PAGE MODE =================
  const page = parseInt(args[0]) || 1;
  const perPage = 15;

  let arr = [...commands.keys()].sort();
  let maxPage = Math.ceil(arr.length / perPage);

  if (page < 1 || page > maxPage)
    return api.sendMessage(
      `❌ Invalid page! Select 1 - ${maxPage}`,
      threadID,
      messageID
    );

  let slice = arr.slice((page - 1) * perPage, page * perPage);

  let msg =
`╭─────────────────────────────╮
│ 📂 𝗛𝗘𝗟𝗣 𝗣𝗔𝗚𝗘 ${page}/${maxPage}   │
╰─────────────────────────────╯

`;

  slice.forEach(cmd => (msg += `╰┈➤ 📦 ${prefix}${cmd}\n`));

  msg += `\n┗━━━━━━━━━━━━━━━━┛
BOT: ${global.config.BOTNAME}
PREFIX: ${prefix}
TOTAL: ${arr.length}`;

  const images = [
    "https://i.imgur.com/i1BgQhz.png",
    "https://i.imgur.com/iTskEvb.png",
    "https://i.imgur.com/AJkpAle.png",
    "https://i.imgur.com/i7Ngm0f.png",
    "https://i.imgur.com/gyxhVCh.png",
    "https://i.imgur.com/nLh8oLe.png",
  ];

  const img = images[Math.floor(Math.random() * images.length)];
  const savePath = __dirname + "/cache/help_page.jpg";

  request(img)
    .pipe(fs.createWriteStream(savePath))
    .on("close", () => {
      api.sendMessage(
        { body: msg, attachment: fs.createReadStream(savePath) },
        threadID,
        () => fs.unlinkSync(savePath),
        messageID
      );
    });
};