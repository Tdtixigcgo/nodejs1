module.exports.config = {
  name: "setprefix",
  version: "1.0.2",
  hasPermssion: 1,
  credits: "Mirai Team",
  description: "Đặt lại prefix của nhóm",
  commandCategory: "no prefix",
  usages: "[prefix/reset]",
  cooldowns: 0,
  dependencies: [],
};

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, body } = event;
  const { PREFIX } = global.config;

const date = new Date();
  const vietnamTime = new Date(date.getTime() + 7 * 3600000); 
  const currentTime = vietnamTime.toLocaleTimeString('vi-VN') + " || " + vietnamTime.toLocaleDateString('vi-VN');

  
  const threadSetting = global.data.threadData.get(threadID) || {};
  const prefix = threadSetting.PREFIX || PREFIX;

  const triggerWords = ["prefix", "prefix bot là gì", "quên prefix r", "dùng sao"];
  if (triggerWords.includes(body.toLowerCase())) {
      
      const totalCommands = global.client.commands.size || 0;
      const totalUsers = global.data.allUserID?.length || 0;
      const totalThreads = global.data.allThreadID?.length || 0;

      const msg = `\n✏️ Prefix nhóm: ${prefix}\n📎 Prefix hệ thống: ${PREFIX}\n` +
                  `📝 Tổng lệnh: ${totalCommands}\n👥 Người dùng bot: ${totalUsers}\n` +
                  `🏘️ Tổng nhóm: ${totalThreads}\n` +
                  `────────────────────\n⏰ Thời gian: ${currentTime}`;
      api.sendMessage({body:msg,attachment: vdanime.splice(0, 1)
                            },  threadID, (err, info) => 
          setTimeout(() => api.unsendMessage(info.messageID), 10000));
  }
};

module.exports.handleReaction = async function ({ api, event, Threads, handleReaction }) {
  if (event.userID != handleReaction.author) return;

  try {
      const { threadID, messageID } = event;
      const threadData = (await Threads.getData(threadID)).data || {};
      threadData.PREFIX = handleReaction.PREFIX;

      await Threads.setData(threadID, { data: threadData });
      global.data.threadData.set(threadID, threadData);

      api.unsendMessage(handleReaction.messageID);
      api.changeNickname(` ${handleReaction.PREFIX} ┊ ${global.config.BOTNAME}`, threadID, event.senderID);
      api.sendMessage(`☑️ Prefix nhóm đã đổi thành: ${handleReaction.PREFIX}`, threadID, messageID);
  } catch (error) {
      console.error("Lỗi khi xử lý phản hồi prefix:", error);
  }
};

module.exports.run = async ({ api, event, args, Threads }) => {
  if (!args[0]) return api.sendMessage(`⚠️ Vui lòng nhập prefix mới.`, event.threadID, event.messageID);

  const prefix = args[0].trim();
  if (!prefix) return api.sendMessage(`⚠️ Vui lòng nhập prefix hợp lệ.`, event.threadID, event.messageID);

  if (prefix.toLowerCase() === "reset") {
      const threadData = (await Threads.getData(event.threadID)).data || {};
      threadData.PREFIX = global.config.PREFIX;

      await Threads.setData(event.threadID, { data: threadData });
      global.data.threadData.set(event.threadID, threadData);

      const uid = api.getCurrentUserID();
      api.changeNickname(` ${global.config.PREFIX} | ${global.config.BOTNAME}`, event.threadID, uid);
      api.sendMessage(`☑️ Prefix đã được reset về mặc định: ${global.config.PREFIX}`, event.threadID, event.messageID);
  } else {
      api.sendMessage(`📝 Bạn yêu cầu set prefix mới: ${prefix}\n👉 Reaction tin nhắn này để xác nhận`, event.threadID, (err, info) => {
          global.client.handleReaction.push({
              name: this.config.name,
              messageID: info.messageID,
              author: event.senderID,
              PREFIX: prefix
          });
          setTimeout(() => api.unsendMessage(info.messageID), 10000);
      });
  }
};
