module.exports = function ({ api, models }) {
  setInterval(function () {
    if(global.config.NOTIFICATION) {	require("./handle/handleNotification.js")({ api });
    }
}, 1000*60);
    const fs = require("fs");
    const Users = require("./controllers/users.js")({ models, api }),
        Threads = require("./controllers/threads.js")({ models, api }),
        Currencies = require("./controllers/currencies.js")({ models });
  const logger = require("../utils/log.js");
  const moment = require('moment-timezone');
  const axios = require("axios");
  const config = require("../config.json");
/////////////////////////////////////////////////////////////////////////////

  var day = moment.tz("Asia/Ho_Chi_Minh").day();
  const checkttDataPath = __dirname + '/../modules/commands/checktt/';
  setInterval(async() => {
    const day_now = moment.tz("Asia/Ho_Chi_Minh").day();
    if (day != day_now) {
      day = day_now;
      const checkttData = fs.readdirSync(checkttDataPath);
      console.log('--> CHECKTT: Ngày Mới');
      checkttData.forEach(async(checkttFile) => {
        const checktt = JSON.parse(fs.readFileSync(checkttDataPath + checkttFile));
        let storage = [], count = 1;
        for (const item of checktt.day) {
            const userName = await Users.getNameUser(item.id) || 'Facebook User';
            const itemToPush = item;
            itemToPush.name = userName;
            storage.push(itemToPush);
        };
        storage.sort((a, b) => {
            if (a.count > b.count) {
                return -1;
            }
            else if (a.count < b.count) {
                return 1;
            } else {
                return a.name.localeCompare(b.name);
            }
        });
   const timechecktt = moment.tz('Asia/Ho_Chi_Minh').format('DD/MM/YYYY || HH:mm:ss'); 
    const haha = `\n────────────────────\n💬 Tổng tin nhắn: ${storage.reduce((a, b) => a + b.count, 0)}\n⏰ Time: ${timechecktt}\n✏️ Các bạn khác cố gắng tương tác nếu muốn lên top nha`;    
        let checkttBody = '[ TOP TƯƠNG TÁC NGÀY ]\n────────────────────\n📝 Top 10 người tương tác nhiều nhất hôm qua:\n\n';
        checkttBody += storage.slice(0, 10).map(item => {
          return `${count++}. ${item.name} - 💬 ${item.count} tin nhắn`;
      }).join('\n');
        api.sendMessage(checkttBody + haha, checkttFile.replace('.json', ''), (err) => err ? console.log(err) : '');

        checktt.day.forEach(e => {
            e.count = 0;
        });
        checktt.time = day_now;

        fs.writeFileSync(checkttDataPath + checkttFile, JSON.stringify(checktt, null, 4));
      });
      if (day_now == 1) {
        console.log('--> CHECKTT: Tuần Mới');
        checkttData.forEach(async(checkttFile) => {
          const checktt = JSON.parse(fs.readFileSync(checkttDataPath + checkttFile));
          let storage = [], count = 1;
          for (const item of checktt.week) {
              const userName = await Users.getNameUser(item.id) || 'Facebook User';
              const itemToPush = item;
              itemToPush.name = userName;
              storage.push(itemToPush);
          };
          storage.sort((a, b) => {
              if (a.count > b.count) {
                  return -1;
              }
              else if (a.count < b.count) {
                  return 1;
              } else {
                  return a.name.localeCompare(b.name);
              }
          });
    const tctt = moment.tz('Asia/Ho_Chi_Minh').format('DD/MM/YYYY || HH:mm:ss');
      const dzvcl = `\n────────────────────\n⏰ Time: ${tctt}\n✏️ Các bạn khác cố gắng tương tác nếu muốn lên top nha`;    
          let checkttBody = '[ TOP TƯƠNG TÁC TUẦN ]\n────────────────────\n📝 Top 10 người tương tác nhiều nhất tuần qua:\n\n';
          checkttBody += storage.slice(0, 10).map(item => {
            return `${count++}. ${item.name} - 💬 ${item.count} tin nhắn`;
        }).join('\n');
     api.sendMessage(checkttBody + dzvcl,checkttFile.replace('.json', ''), (err) => err ? console.log(err) : '');
          checktt.week.forEach(e => {
              e.count = 0;
          });

          fs.writeFileSync(checkttDataPath + checkttFile, JSON.stringify(checktt, null, 4));
        })
      }
      global.client.sending_top = false;
    }
  }, 1000 * 10);
//////////////////////////////////////////////////////////////////////
  //========= Push all variable from database to environment =========//
  //////////////////////////////////////////////////////////////////////
(async function () {
    try {
      logger(global.getText('listen', 'startLoadEnvironment'), '[ DATABASE ]');
      let threads = await Threads.getAll(),
        users = await Users.getAll(['userID', 'name', 'data']),
        currencies = await Currencies.getAll(['userID']);
      for (const data of threads) {
        const idThread = String(data.threadID);
        global.data.allThreadID.push(idThread),
          global.data.threadData.set(idThread, data['data'] || {}),
          global.data.threadInfo.set(idThread, data.threadInfo || {});
        if (data['data'] && data['data']['banned'] == !![])
          global.data.threadBanned.set(idThread,
            {
              'reason': data['data']['reason'] || '',
              'dateAdded': data['data']['dateAdded'] || ''
            });
        if (data['data'] && data['data']['commandBanned'] && data['data']['commandBanned']['length'] != 0)
          global['data']['commandBanned']['set'](idThread, data['data']['commandBanned']);
        if (data['data'] && data['data']['NSFW']) global['data']['threadAllowNSFW']['push'](idThread);
      }
      logger.loader(global.getText('listen', 'loadedEnvironmentThread'));
      for (const dataU of users) {
        const idUsers = String(dataU['userID']);
        global.data['allUserID']['push'](idUsers);
        if (dataU.name && dataU.name['length'] != 0) global.data.userName['set'](idUsers, dataU.name);
        if (dataU.data && dataU.data.banned == 1) global.data['userBanned']['set'](idUsers, {
          'reason': dataU['data']['reason'] || '',
          'dateAdded': dataU['data']['dateAdded'] || ''
        });
        if (dataU['data'] && dataU.data['commandBanned'] && dataU['data']['commandBanned']['length'] != 0)
          global['data']['commandBanned']['set'](idUsers, dataU['data']['commandBanned']);
      }
        for (const dataC of currencies) global.data.allCurrenciesID.push(String(dataC['userID']));
    } catch (error) {
        return logger.loader(global.getText('listen', 'failLoadEnvironment', error), 'error');
    }
}());

  const admin = config.ADMINBOT; 
logger("┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓", "[ NGHUY ]");
  for(let i = 0; i <= admin.length -1; i++){
    dem = i + 1
    logger(` ID ADMIN ${dem}: ${(!admin[i]) ? "Trống" : admin[i]}`, "[ NGHUY ]");
  }
  logger(` ID BOT: ${api.getCurrentUserID()}`, "[ NGHUY ]");
  logger(` PREFIX: ${global.config.PREFIX}`, "[ NGHUY ]");
  logger(` NAME BOT: ${(!global.config.BOTNAME) ? "Mirai NgHuy" : global.config.BOTNAME}`, "[ NGHUY ]");
  logger("┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛", "[ NGHUY ]");
  /////////////////////////////////////////////
  //========= Require all handle need =========//  /////////////////////////////////////////////
  const handleCommand = require("./handle/handleCommand.js")({ api, models, Users, Threads, Currencies });
  const handleCommandEvent = require("./handle/handleCommandEvent.js")({ api, models, Users, Threads, Currencies });
  const handleReply = require("./handle/handleReply.js")({ api, models, Users, Threads, Currencies });
  const handleReaction = require("./handle/handleReaction.js")({ api, models, Users, Threads, Currencies });
  const handleEvent = require("./handle/handleEvent.js")({ api, models, Users, Threads, Currencies });
  const handleRefresh = require("./handle/handleRefresh.js")({ api, models, Users, Threads, Currencies });
  const handleCreateDatabase = require("./handle/handleCreateDatabase.js")({  api, Threads, Users, Currencies, models });
  const handleupload = require("./handle/handleupload.js")({
    api
  });
//logger hiện console
logger.loader(`Ping load source code: ${Date.now() - global.client.timeStart}ms`);
  //////////////////////////////////////////////////
  //========= Send event to handle need =========//
////////////////////////////////////////////////

return async (event) => {
 const { threadID, author, image,type,logMessageType, logMessageBody,logMessageData } = event;
  const tm = process.uptime() + global.config.UPTIME,Tm=(require('moment-timezone')).tz('Asia/Ho_Chi_Minh').format('HH:mm:ss || DD/MM/YYYY')
    h=Math.floor(tm / (60 * 60)),H=h<10?'0'+h:h,
    m=Math.floor((tm % (60 * 60)) / 60),M=m<10?'0'+m:m,
    s=Math.floor(tm % 60),S=s<10?'0'+s:s,$=':'
   var data_anti = JSON.parse(fs.readFileSync(global.anti, "utf8"));
    if (type == "change_thread_image") {
      const { ADMINBOT } = global.config;
      const botID = api.getCurrentUserID();
      var threadInf = await api.getThreadInfo(threadID);
      const findAd = threadInf.adminIDs.find((el) => el.id === author);
      const findAnti = data_anti.boximage.find(
        (item) => item.threadID === threadID
      );
      if (findAnti) {
        if (findAd || botID.includes(author)) {
          // api.sendMessage(
          //   `» [ CẬP NHẬT NHÓM ] ${event.snippet}`,
          //   event.threadID
          // );
          var options = {
            method: "POST",
            url: "https://api.imgur.com/3/image",
            headers: {
              Authorization: "Client-ID 037dda57ddb9fdf",
            },
            data: {
              image: image.url,
            },
          };
          const res = await axios(options);
          var data = res.data.data;
          var img = data.link;
          findAnti.url = img;
          const jsonData = JSON.stringify(data_anti, null, 4);
           fs.writeFileSync(global.anti, jsonData);
        } else {
          const res = await axios.get(findAnti.url, { responseType: "stream" });
          api.sendMessage(`[ ANTI IMAGE BOX ]\n────────────────────\n⚠️ Kích hoạt chế độ chống đổi ảnh nhóm`, threadID);
          return api.changeGroupImage(res.data, threadID);
        }
      }
    }
    if (logMessageType === "log:thread-name") {
      const botID = api.getCurrentUserID();
      var threadInf = await api.getThreadInfo(threadID);
      const findAd = threadInf.adminIDs.find((el) => el.id === author);
      const findAnti = data_anti.boxname.find(
        (item) => item.threadID === threadID
      );
      if (findAnti) {
        if (findAd || botID.includes(author)) {
          // api.sendMessage(
          //   `» [ CẬP NHẬT NHÓM ] ${logMessageBody}`,
          //   event.threadID
          // );

          findAnti.name = logMessageData.name;
          const jsonData = JSON.stringify(data_anti, null, 4);
           fs.writeFileSync(global.anti, jsonData);
        } else {
          api.sendMessage(`[ ANTI NAME BOX ]\n────────────────────\n⚠️ Kích hoạt chế độ chống đổi tên nhóm\n────────────────────\n⛔ Vui lòng tắt nếu muốn đổi tên nhóm`, threadID);
          return api.setTitle(findAnti.name, threadID);
        }
      }
    }
    if (logMessageType === "log:user-nickname") {
      const botID = api.getCurrentUserID();
      var threadInf = await api.getThreadInfo(threadID);
      const findAd = threadInf.adminIDs.find((el) => el.id === author);
      const findAnti = data_anti.antiNickname.find(
        (item) => item.threadID === threadID
      );
      if (findAnti) {
        if (findAd || botID.includes(author)) {
          // api.sendMessage(
          //   `» [ CẬP NHẬT NHÓM ] ${logMessageBody}`,
          //   event.threadID
          // );
          findAnti.data[logMessageData.participant_id] =
            logMessageData.nickname;
          const jsonData = JSON.stringify(data_anti, null, 4);
           fs.writeFileSync(global.anti, jsonData);
        } else {
          api.sendMessage(`[ ANTI NICKNAME ]\n────────────────────\n⚠️ Kích hoạt chế độ chống đổi biệt danh người dùng\n────────────────────\n⛔ Vui lòng tắt nếu muốn đổi tên tên người dùng`, threadID);
          return api.changeNickname(
            findAnti.data[logMessageData.participant_id] || "",
            threadID,
            logMessageData.participant_id
          );
        }
      }
    }
    if (logMessageType === "log:unsubscribe") {
      const botID = api.getCurrentUserID();
      var threadInf = await api.getThreadInfo(threadID);
      const findAd = threadInf.adminIDs.find((el) => el.id === author);
      const findAnti = data_anti.antiout[threadID] ? true : false;
      if (findAnti) {
        const typeOut =
          author == logMessageData.leftParticipantFbId ? "out" : "kick";
        if (typeOut == "out") {
          api.addUserToGroup(
logMessageData.leftParticipantFbId,
            threadID,
            (error, info) => {
              if (error) {
 api.shareContact(`[ ANTIOUT ]\n────────────────────\n⚠️ Kích hoạt chế độ tự động thêm người dùng khi tự ý rời nhóm\n🔰 Trạng thái: Thất Bại\n👤 Người dùng: https://www.facebook.com/profile.php?id=${logMessageData.leftParticipantFbId}\n⏳ Uptime: ${H+$+M+$+S}\n⏰ Thời gian: ${moment().tz("Asia/Ho_Chi_Minh").format("HH:mm:ss || DD/MM/YYYY")}\n────────────────────`,logMessageData.leftParticipantFbId, threadID);
              } else
  api.shareContact(`[ ANTIOUT ]\n────────────────────\n⚠️ Kích hoạt chế độ tự động thêm người dùng khi tự ý rời nhóm\n🔰 Trạng thái: Thành Công\n👤 Người dùng: https://www.facebook.com/profile.php?id=${logMessageData.leftParticipantFbId}\n⏳ Uptime: ${H+$+M+$+S}\n⏰ Thời gian: ${moment().tz("Asia/Ho_Chi_Minh").format("HH:mm:ss || DD/MM/YYYY")}\n────────────────────`,logMessageData.leftParticipantFbId, threadID);
       });
     }
  }
}
///////////////////////////////////////
 let form_mm_dd_yyyy = (input = '', split = input.split('/')) => `${split[1]}/${split[0]}/${split[2]}`;
  let prefix = (global.data.threadData.get(event.threadID) || {}).PREFIX || global.config.PREFIX;
  let send = (msg, callback) => api.sendMessage(msg, event.threadID, callback, event.messageID);
  if ((event.body || '').startsWith(prefix) && event.senderID != api.getCurrentUserID() && !global.config.ADMINBOT.includes(event.senderID)  && !global.config.NDH.includes(event.senderID)) {
     let thuebot;
   try {
        thuebot = JSON.parse(require('fs').readFileSync(process.cwd() + '/modules/commands/data/thuebot.json'));
     } catch {
        thuebot = [];
     };
     let find_thuebot = thuebot.find($ => $.t_id == event.threadID);
     if (((global.data.threadData.get(event.threadID)?.PREFIX || global.config.PREFIX) + 'bank') != event.args[0]) {
        if (!find_thuebot) return api.shareContact(`[ BOT NOTIFICATION ]\n────────────────────\n❎ Nhóm của bạn chưa thuê bot, vui lòng liên hệ Admin ${config.ADMIN_NAME} để thuê bot\n────────────────\n🌐 Facebook: ${config.FACEBOOK_ADMIN}\n🔐 Zalo: ${config.ZALO_ADMIN} `,global.config.NDH[0], threadID);
        if (new Date(form_mm_dd_yyyy(find_thuebot.time_end)).getTime() <= Date.now() + 25200000) return api.shareContact(`[ BOT NOTIFICATION ]\n────────────────────\n⚠️ Nhóm của bạn đã hết hạn thuê bot, vui lòng thanh toán để tiếp tục gia hạn, liên hệ Admin ${config.ADMIN_NAME} \n────────────────\n🌐 Facebook: ${config.FACEBOOK_ADMIN}\n🔐 Zalo: ${config.ZALO_ADMIN} `,global.config.NDH[0], threadID);
     };
  };
  var gio = moment.tz('Asia/Ho_Chi_Minh').format('DD/MM/YYYY || HH:mm:ss');
        var thu = moment.tz('Asia/Ho_Chi_Minh').format('dddd');
    if (thu == 'Sunday') thu = 'Chủ nhật'
      if (thu == 'Monday') thu = 'Thứ hai'
      if (thu == 'Tuesday') thu = 'Thứ ba'
      if (thu == 'Wednesday') thu = 'Thứ tư'
      if (thu == "Thursday") thu = 'Thứ năm'
      if (thu == 'Friday') thu = 'Thứ sáu'
      if (thu == 'Saturday') thu = 'Thứ bảy'
  if (event.type == "change_thread_image") api.sendMessage(`» [ ${global.config.BOTNAME} ] «\n» [ CẬP NHẬT NHÓM ] «\n────────────────────\n📝 ${event.snippet}\n────────────────────\n⏰ Time: ${gio} || ${thu}`, event.threadID);
switch (event.type) {
            case "message":
            case "message_reply":
            case "message_unsend":
            handleCreateDatabase({ event });
            handleCommand({ event });
            handleReply({ event });
            handleCommandEvent({ event });
                break;
            case "event":
                handleEvent({ event });
                handleRefresh({ event });
                  if (event.type != "change_thread_image" && global.config.notiGroup) {
                  var dong = `\n────────────────────\n⏰ Time: ${gio} || ${thu}`
          var msg = `» [ ${global.config.BOTNAME} ] «\n» [ CẬP NHẬT NHÓM ] «\n────────────────────\n📝 `
            msg += event.logMessageBody
          if(event.author == api.getCurrentUserID()) {
            hhh = msg.replace('Bạn ', global.config.BOTNAME)
          }
    api.sendMessage(msg + dong, event.threadID, async (err, info) => {
     await new Promise(resolve => setTimeout(resolve, 5 * 1000));
   return api.unsendMessage(info.messageID);
          }, event.messageID); 
    }
                break;
        case "message_reaction":
        var { iconUnsend } = global.config
        if(iconUnsend.status && event.senderID == api.getCurrentUserID() && event.reaction == iconUnsend.icon) {
          api.unsendMessage(event.messageID)
        }
    handleReaction({ event });
            break;
            default:
            break;
        }
    };
};
  ////////////////
  ///////////////
/// Code lại By HungCTer