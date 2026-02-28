module.exports.config = {
  name: "anime",
  version: "1.0",
  hasPermssion: 0,
  credits: "Bat",
  description: "",
  commandCategory: "no prefix",
  usages: "[anime]",
  cooldowns: 3,
  usePrefix: false // << Dòng này kích hoạt noPrefix
};

module.exports.handleEvent = async function ({ api, event }) {
  if (event.body?.toLowerCase() === "anime") {
    return api.sendMessage({
      body: "",
      attachment: vdanime.splice(0, 1)
    }, event.threadID, event.messageID);
  }
};

module.exports.run = async function () {
  return;
};