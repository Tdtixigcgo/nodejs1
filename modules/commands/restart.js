module.exports.config = {
	name: "rs",
	version: "1.0.0",
	hasPermssion: 2,
	credits: "manhIT",
	description: "Khởi động lại Bot",
	commandCategory: "Admin",
	usages: "",
	cooldowns: 5
};

module.exports.run = async ({ api, event, args }) => {
	const { threadID, messageID } = event;
	return api.sendMessage({
		body: `❤️‍🩹`,
		attachment: vdanime.splice(0, 1) }, 
		threadID, () => process.exit(1))
}