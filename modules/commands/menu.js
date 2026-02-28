module.exports.config = {
    name: 'menu',
    version: '1.1.1',
    hasPermssion: 0,
    credits: 'DC-Nam mod by Vtuan & DongDev fix',
    description: 'Xem danh sách nhóm lệnh, thông tin lệnh',
    commandCategory: 'Tiện ích',
    usages: '[...name commands|all]',
    cooldowns: 5,
    usePrefix: false,
    images: [],
    envConfig: {
        autoUnsend: {
            status: true,
            timeOut: 60
        }
    }
};

const { autoUnsend = this.config.envConfig.autoUnsend } = global.config == undefined ? {} : global.config.menu == undefined ? {} : global.config.menu;
const { compareTwoStrings, findBestMatch } = require('string-similarity');
const { readFileSync, writeFileSync, existsSync } = require('fs-extra');

module.exports.run = async function ({ api, event, args }) {
    const moment = require("moment-timezone");
    const { sendMessage: send, unsendMessage: un } = api;
    const { threadID: tid, messageID: mid, senderID: sid } = event;
    const cmds = global.client.commands;

    // Use the first item from the global.gojodev array instead of the Imgur image
    const attachment = global.vdanime.splice(0, 1); // This retrieves and removes the first item from the array.

    const time = moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss || DD/MM/YYYY");

    if (args.length >= 1) {
        if (typeof cmds.get(args.join(' ')) == 'object') {
            const body = infoCmds(cmds.get(args.join(' ')).config);

            // Send the command info with the sticker
            return send({
                body: body,
                attachment: global.vdanime.splice(0, 1),
            }, tid, mid);
        } else {
            if (args[0] == 'all') {
                const data = cmds.values();
                var txt = '──────────────────\n',
                    count = 0;
                for (const cmd of data) txt += `${++count}. ${cmd.config.name} | ${cmd.config.description}\n`;
                txt += `\n──────────────────`;

                // Send the list of all commands with the sticker
                return send({
                    body: txt,
                    attachment: attachment,
                }, tid, (a, b) => autoUnsend.status ? setTimeout(v1 => un(v1), 1000 * autoUnsend.timeOut, b.messageID) : '');
            } else {
                const cmdsValue = cmds.values();
                const arrayCmds = [];
                for (const cmd of cmdsValue) arrayCmds.push(cmd.config.name);
                const similarly = findBestMatch(args.join(' '), arrayCmds);
                if (similarly.bestMatch.rating >= 0.3) return send(` "${args.join(' ')}" là lệnh gần giống là "${similarly.bestMatch.target}" ?`, tid, mid);
            }
        }
    } else {
        const data = commandsGroup();
        var txt = '──────────────\n', count = 0;
        for (const { commandCategory, commandsName } of data) txt += `${++count}. ${commandCategory} || có ${commandsName.length} lệnh\n`;
        txt += `\n──────────────\nReply số để xem chi tiết`;

        // Send the command categories with the sticker
        return send({
            body: txt,
            attachment: attachment,
        }, tid, (a, b) => {
            global.client.handleReply.push({ name: this.config.name, messageID: b.messageID, author: sid, 'case': 'infoGr', data });
            if (autoUnsend.status) setTimeout(v1 => un(v1), 1000 * autoUnsend.timeOut, b.messageID);
        }, mid);
    }
};


module.exports.handleReply = async function ({ handleReply: $, api, event }) {
    const { sendMessage: send, unsendMessage: un } = api;
    const { threadID: tid, messageID: mid, senderID: sid, args } = event;

    if (sid != $.author) {
        const msg = `⛔ Cút ra chỗ khác`;
        return send(msg, tid, mid);
    }

    switch ($.case) {
        case 'infoGr': {
            var data = $.data[(+args[0]) - 1];
            if (data == undefined) {
                const txt = `❎ "${args[0]}" không nằm trong số thứ tự menu`;
                const msg = txt;
                return send(msg, tid, mid);
            }

            un($.messageID);
            var txt = `=== [ ${data.commandCategory} ] ===\n──────────\n`,
                count = 0;
            for (const name of data.commandsName) {
                const cmdInfo = global.client.commands.get(name).config;
                txt += `${++count}. ${name} | ${cmdInfo.description}\n`;
            }
            txt += `──────────────\nReply số để xem chi tiết`;

            // Send the group command list with a sticker
            return send({
                body: txt,
                attachment: global.vdanime.splice(0, 1),
            }, tid, (a, b) => {
                global.client.handleReply.push({ name: this.config.name, messageID: b.messageID, author: sid, 'case': 'infoCmds', data: data.commandsName });
                if (autoUnsend.status) setTimeout(v1 => un(v1), 1000 * autoUnsend.timeOut, b.messageID);
            });
        }
        case 'infoCmds': {
            var data = global.client.commands.get($.data[(+args[0]) - 1]);
            if (typeof data != 'object') {
                const txt = `⚠️ "${args[0]}" không nằm trong số thứ tự menu`;
                const msg = txt;
                return send(msg, tid, mid);
            }

            const { config = {} } = data || {};
            un($.messageID);
            const msg = infoCmds(config);

            // Send the detailed command info with a sticker
            return send({
                body: msg,
                attachment: global.vdanime.splice(0, 1),
            }, tid, mid);
        }
        default:
    }
};

function commandsGroup() {
    const array = [],
        cmds = global.client.commands.values();
    for (const cmd of cmds) {
        const { name, commandCategory } = cmd.config;
        const find = array.find(i => i.commandCategory == commandCategory)
        !find ? array.push({ commandCategory, commandsName: [name] }) : find.commandsName.push(name);
    }
    array.sort(sortCompare('commandsName'));
    return array;
}

function infoCmds(a) {
    return `─────────────\nTên lệnh :${a.name}\nPhiên bản: ${a.version}\nQuyền hạn: ${premssionTxt(a.hasPermssion)}\nTác giả : ${a.credits}\nMô tả: ${a.description}\nThuộc nhóm: ${a.commandCategory}\nCách dùng: ${a.usages}\nThời gian chờ: ${a.cooldowns} giây\n`;
}

function premssionTxt(a) {
    return a == 0 ? 'Thành Viên' : a == 1 ? 'Quản Trị Viên Nhóm' : a == 2 ? 'ADMINBOT' : 'Người Điều Hành Bot';
}

function prefix(a) {
    const tidData = global.data.threadData.get(a) || {};
    return tidData.PREFIX || global.config.PREFIX;
}

function sortCompare(k) {
    return function (a, b) {
        return (a[k].length > b[k].length ? 1 : a[k].length < b[k].length ? -1 : 0) * -1;
    };
}
