const moment = require("moment-timezone");
const os = require("os");

module.exports = {
  config: {
    name: "",
    version: "1.0",
    author: "Bat", // thay cl má mày 🫵
    description: "",
    usage: "sailenh",
    commandCategory: "Tiện ích",
    cooldowns: 3
  },

  run: async function ({ api, event }) {
    const gio = moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss || DD/MM/YYYY");

    const uptime = process.uptime();
    const uptimeHours = Math.floor(uptime / 3600);
    const uptimeMinutes = Math.floor((uptime % 3600) / 60);
    const uptimeSeconds = Math.floor(uptime % 60);
    const uptimeString = `${uptimeHours} giờ ${uptimeMinutes} phút ${uptimeSeconds} giây`;

    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const totalMemoryFormatted = (totalMemory / (1024 * 1024 * 1024)).toFixed(2);
    const freeMemoryFormatted = (freeMemory / (1024 * 1024 * 1024)).toFixed(2);
    const usedMemoryFormatted = (usedMemory / (1024 * 1024 * 1024)).toFixed(2);

    const msg = 
      `Giờ: ${gio}\nUptime: ${uptimeString}\n` +
      `Bộ nhớ tổng: ${totalMemoryFormatted} GB\n` +
      `Bộ nhớ còn lại: ${freeMemoryFormatted} GB\n` +
      `Bộ nhớ đã sử dụng: ${usedMemoryFormatted} GB`;

    api.sendMessage({
      body: msg,
      attachment: global.bat.splice(0, 1)
    }, event.threadID, (err, info) => {
      if (!err) {
        setTimeout(() => {
          api.unsendMessage(info.messageID);
        }, 50000); // 50 giây = 50000 ms
      }
    });
  }
};
