/* ========= HARD CREATOR LOCK ========= */
const CREATOR_NAME = "ARIF BABU";

module.exports.config = {
  name: "uns",
  version: "1.0.5",
  hasPermssion: 0,
  credits: "ARIF BABU",
  description: "Message ko unsend kare (prefix + no prefix)",
  commandCategory: "system",
  usages: "reply + uns / 👍 / unsend / #uns",
  cooldowns: 0,
  usePrefix: true // ✅ PREFIX ENABLED
};

// 🔒 CREDIT PROTECTION
if (module.exports.config.credits !== CREATOR_NAME) {
  throw new Error("❌ Credits change kiye gaye! Command ARIF BABU dwara lock hai.");
}

module.exports.languages = {
  hi: {
    returnCant: "📌 Aap kisi aur ka bheja hua message unsend nahi kar sakte. 😉",
    missingReply: "📌 Jis message ko unsend karna hai, kripya us message par reply karein. 😉"
  }
};

/* ========= NO PREFIX SUPPORT ========= */
module.exports.handleEvent = async function ({ api, event, getText }) {
  try {
    if (!event.body || event.type !== "message_reply") return;

    const body = event.body.toLowerCase();

    if (
      body === "uns" ||
      body === "unsend" ||
      body === "👍" ||
      body === "🤦" ||
      body === "."
    ) {

      // ❌ Dusre ka message unsend nahi hoga
      if (event.messageReply.senderID !== api.getCurrentUserID()) {
        return api.sendMessage(
          getText("returnCant"),
          event.threadID,
          event.messageID
        );
      }

      return api.unsendMessage(event.messageReply.messageID);
    }

  } catch (e) {
    console.log("UNSEND ERROR:", e);
  }
};

/* ========= PREFIX COMMAND ========= */
module.exports.run = function ({ api, event, getText }) {

  if (event.type !== "message_reply") {
    return api.sendMessage(
      getText("missingReply"),
      event.threadID,
      event.messageID
    );
  }

  // ❌ Dusre ka message unsend nahi hoga
  if (event.messageReply.senderID !== api.getCurrentUserID()) {
    return api.sendMessage(
      getText("returnCant"),
      event.threadID,
      event.messageID
    );
  }

  return api.unsendMessage(event.messageReply.messageID);
};