const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
	name: "joinNoti",
	eventType: ["log:subscribe"],
	version: "1.0.3",
	credits: "Mirai Team (Edit by bạn)",
	description: "Thông báo bot hoặc người vào nhóm",
	dependencies: {
		"fs-extra": ""
	}
};

module.exports.run = async function ({ api, event, Users }) {
	const { threadID } = event;

	// Nếu bot được thêm vào nhóm
	if (event.logMessageData.addedParticipants.some(i => i.userFbId == api.getCurrentUserID())) {
		api.changeNickname(`[ ${global.config.PREFIX} ] • ${(!global.config.BOTNAME) ? "Kết nối thành công :<" : global.config.BOTNAME}`, threadID, api.getCurrentUserID());
		return api.sendMessage(`Hellooooooooooooooooooooooooooooooooooooooo <3`, threadID);
	}

	// Người khác vào nhóm
	try {
		let { threadName, participantIDs } = await api.getThreadInfo(threadID);
		const threadData = global.data.threadData.get(parseInt(threadID)) || {};

		const pathFolder = path.join(__dirname, "cache", "joinGif");
		const pathGif = path.join(pathFolder, `${threadID}.gif`);

		const mentions = [], nameArray = [], memLength = [];
		let i = 0;

		for (const user of event.logMessageData.addedParticipants) {
			const userName = user.fullName || "Người dùng";
			const userID = user.userFbId;

			if (!userID) {
				console.warn("userFbId không tồn tại trong sự kiện:", user);
				continue;
			}

			nameArray.push(userName);
			mentions.push({ tag: userName, id: userID });
			memLength.push(participantIDs.length - i++);

			if (!global.data.allUserID.includes(userID)) {
				await Users.createData(userID, { name: userName, data: {} });
				global.data.allUserID.push(userID);
				console.log(global.getText("handleCreateDatabase", "newUser", userID), "[ DATABASE ]");
			}
		}

		memLength.sort((a, b) => a - b);

		let msg = (typeof threadData.customJoin == "undefined")
			? "👋Welcome {name}.\nChào mừng đã đến với {threadName}.\n{type} là thành viên thứ {soThanhVien} của nhóm 🥳"
			: threadData.customJoin;

		msg = msg
			.replace(/\{name}/g, nameArray.join(', '))
			.replace(/\{type}/g, (memLength.length > 1) ? 'các bạn' : 'bạn')
			.replace(/\{soThanhVien}/g, memLength.join(', '))
			.replace(/\{threadName}/g, threadName);

		if (!fs.existsSync(pathFolder)) fs.mkdirSync(pathFolder, { recursive: true });

		let formPush;

		if (fs.existsSync(pathGif)) {
			try {
				formPush = {
					body: msg,
					attachment: fs.createReadStream(pathGif),
					mentions
				};
			} catch (gifErr) {
				console.error("Không thể đọc file GIF:", gifErr);
				formPush = { body: msg, mentions };
			}
		} else if (vdanime.length > 0) {
			formPush = {
				body: msg,
				attachment: vdanime.splice(0, 1),
				mentions
			};
		} else {
			formPush = { body: msg, mentions };
		}

		// Gửi tin nhắn và thu hồi sau 10 giây
		return api.sendMessage(formPush, threadID, (err, info) => {
			if (err) return console.error("Lỗi gửi tin nhắn:", err);
			setTimeout(() => {
				api.unsendMessage(info.messageID);
			}, 10000); // 10 giây
		});

	} catch (err) {
		console.error("Lỗi trong joinNoti.js:", err);
	}
};