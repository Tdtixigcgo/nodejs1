const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "leaveNoti",
  eventType: ["log:unsubscribe"],
  version: "1.0.3",
  credits: "Ranz - Fix by ChatGPT",
  description: "Thông báo khi người dùng rời nhóm, chỉ gửi 1 lần duy nhất",
  dependencies: {
    "fs-extra": "",
    "path": ""
  }
};

module.exports.onLoad = function () {
  const basePath = path.join(__dirname, "cache", "leaveGif", "randomgif");
  if (!fs.existsSync(basePath)) fs.mkdirSync(basePath, { recursive: true });

  global.leaveNotiSent = new Set();
};

module.exports.run = async function ({ api, event, Users, Threads }) {
  try {
    const { threadID, messageID } = event;
    const idUser = event.logMessageData.leftParticipantFbId;

    if (idUser == api.getCurrentUserID()) return;

    const eventKey = `${threadID}_${idUser}_${messageID}`;
    if (global.leaveNotiSent.has(eventKey)) return;
    global.leaveNotiSent.add(eventKey);

    const moment = require("moment-timezone");
    const time = moment.tz("Asia/Ho_Chi_Minh").format("DD/MM/YYYY || HH:mm:ss");

    const threadDataCache = global.data.threadData.get(parseInt(threadID));
    const data = threadDataCache || (await Threads.getData(threadID)).data || {};

    let nameAuthor = "";
    if (event.author) {
      const authorData = await Users.getData(event.author);
      nameAuthor = authorData?.name || "người lạ";
    }

    let name = global.data.userName.get(idUser);
    if (!name) {
      const userData = await Users.getData(idUser);
      name = userData?.name || "Người dùng Facebook";
    }

    const type = (event.author == idUser)
      ? "đã tự rời khỏi nhóm"
      : `đã bị ${nameAuthor} kick khỏi nhóm`;

    let replyMsg = data.customLeave || "{name} {type}";
    replyMsg = replyMsg
      .replace(/\{name}/g, name)
      .replace(/\{type}/g, type)
      .replace(/\{iduser}/g, idUser)
      .replace(/\{author}/g, nameAuthor)
      .replace(/\{time}/g, time);

    const mediaDir = path.join(__dirname, "cache", "leaveGif", "randomgif");
    const files = fs.readdirSync(mediaDir).filter(file =>
      file.endsWith(".gif") || file.endsWith(".mp4") || file.endsWith(".png") || file.endsWith(".jpg") || file.endsWith(".jpeg")
    );

    if (vdcos.length > 0) {
      return api.sendMessage({
        body: replyMsg,
        attachment: vdcos.splice(Math.floor(Math.random() * vdcos.length), 1)
      }, threadID, messageID);
    } else {
      return api.sendMessage({ body: replyMsg }, threadID, messageID);
    }

  } catch (err) {
    console.error("Lỗi ở leaveNoti:", err);
  }
};