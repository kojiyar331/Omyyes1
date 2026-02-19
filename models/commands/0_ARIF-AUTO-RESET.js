const moment = require("moment-timezone");

/* ================= CONFIG ================= */

module.exports.config = {
    name: "autoreset",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "ARIF-BABU",
    description: "Automatic Bot Restart (System Mode)",
    commandCategory: "system",
    cooldowns: 5
};

/* ================= SYSTEM BOX ================= */

const systemBox = (title, body) =>
`╭───〔 ${title} 〕───╮

${body}

╰────────────────────╯`;

/* ================= HANDLE EVENT ================= */

module.exports.handleEvent = async function ({ api }) {

    const timeNow = moment.tz("Asia/Kolkata").format("HH:mm:ss");
    const seconds = moment.tz("Asia/Kolkata").format("ss");
    const adminIDs = global.config.ADMINBOT;

    // ⏰ Restart Hours (Every Hour)
    const restartHours = [
        "01","02","03","04","05","06",
        "07","08","09","10","11","12"
    ];

    for (const hour of restartHours) {
        const restartTime = `${hour}:00:${seconds}`;

        if (timeNow === restartTime && seconds < 6) {

            for (const admin of adminIDs) {
                setTimeout(() => {
                    api.sendMessage(
                        systemBox(
                            "⚡ AUTO RESTART SYSTEM",
                            `🕒 Time : ${timeNow}\n🤖 Status : Restarting Bot...\n🛠 Reason : Scheduled System Reset`
                        ),
                        admin
                    );
                }, 500);
            }

            setTimeout(() => process.exit(1), 1500);
        }
    }
};

/* ================= COMMAND RUN ================= */

module.exports.run = async ({ api, event }) => {
    const timeNow = moment.tz("Asia/Kolkata").format("HH:mm:ss");
    api.sendMessage(
        systemBox(
            "🕒 SYSTEM TIME",
            `Current Time : ${timeNow}`
        ),
        event.threadID,
        event.messageID
    );
};