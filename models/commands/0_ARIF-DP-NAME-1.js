const axios = require("axios");
const fs = require("fs-extra");
const { createCanvas, loadImage } = require("canvas");
const path = require("path");

module.exports.config = {
  name: "dpname",
  version: "6.0.0",
  hasPermssion: 0,
  credits: "ARIF BABU",
  description: "Clean Stylish Gradient Name",
  commandCategory: "image",
  usages: "reply image + Name",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  try {
    const { threadID, messageID, messageReply } = event;

    if (!messageReply || !messageReply.attachments || messageReply.attachments.length === 0)
      return api.sendMessage("❌ Image ko reply karo.", threadID, messageID);

    const attachment = messageReply.attachments[0];
    if (attachment.type !== "photo")
      return api.sendMessage("❌ Sirf photo pe kaam karega.", threadID, messageID);

    const input = args.join(" ").trim();
    if (!input)
      return api.sendMessage("❌ Naam likho.", threadID, messageID);

    const imgData = (await axios.get(attachment.url, { responseType: "arraybuffer" })).data;
    const img = await loadImage(imgData);

    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext("2d");

    // Draw original image
    ctx.drawImage(img, 0, 0, img.width, img.height);

    // Text Function (Clean Style)
    function stylishText(text, y) {
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const fontSize = Math.floor(img.width / 5);
      ctx.font = `bold ${fontSize}px Arial Black`;

      // Strong Shadow (3D feel)
      ctx.shadowColor = "rgba(0,0,0,0.6)";
      ctx.shadowBlur = 15;
      ctx.shadowOffsetX = 6;
      ctx.shadowOffsetY = 6;

      // Smooth Gradient (DP type)
      const gradient = ctx.createLinearGradient(0, 0, img.width, 0);
      gradient.addColorStop(0, "#ff0000");
      gradient.addColorStop(0.3, "#ff00cc");
      gradient.addColorStop(0.6, "#00c6ff");
      gradient.addColorStop(1, "#00ff99");

      ctx.fillStyle = gradient;
      ctx.fillText(text, img.width / 2, y);

      // Reset shadow
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Sharp White Border
      ctx.lineWidth = 6;
      ctx.strokeStyle = "#ffffff";
      ctx.strokeText(text, img.width / 2, y);
    }

    // Position (Center Lower)
    stylishText(input, img.height * 0.7);

    const filePath = path.join(__dirname, `dpname_${Date.now()}.jpg`);
    fs.writeFileSync(filePath, canvas.toBuffer("image/jpeg"));

    api.sendMessage({
      attachment: fs.createReadStream(filePath)
    }, threadID, () => fs.unlinkSync(filePath), messageID);

  } catch (e) {
    console.error(e);
    api.sendMessage("❌ Error aaya, check hosting.", event.threadID, event.messageID);
  }
};