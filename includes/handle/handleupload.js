module.exports = function ({ api }) {
    const { existsSync, writeFileSync, readFileSync } = require("fs-extra");
    const { join } = require("path");
    const axios = require("axios");
    const logger = require("../../utils/log.js");

    const globalPath = join(__dirname, '../datajson/global.bat');
    let globalData = { vdgai: [], vdanime: [], vdcosplay: [], vdtrai: [] };
    let toggle = 0;
    let status = true;
    let isProcessing = false;

    setInterval(async () => {
        if (!status) return;

        try {
            let currentList, urls;
            switch (toggle) {
                case 0:
                    urls = JSON.parse(readFileSync(join(__dirname, '../datajson/vdgai.json')));
                    currentList = globalData.vdgai;
                    break;
                case 1:
                    urls = JSON.parse(readFileSync(join(__dirname, '../datajson/vdanime.json')));
                    currentList = globalData.vdanime;
                    break;
                case 2:
                    urls = JSON.parse(readFileSync(join(__dirname, '../datajson/vdcosplay.json')));
                    currentList = globalData.vdcosplay;
                    break;
                case 3:
                    urls = JSON.parse(readFileSync(join(__dirname, '../datajson/vdtrai.json')));
                    currentList = globalData.vdtrai;
                    break;
            }

            if (!isProcessing && currentList.length < 20) {
                isProcessing = true;
                try {
                    const uploadPromises = [...Array(5)].map(async () => {
                        const randomUrl = urls[Math.floor(Math.random() * urls.length)];
                        try {
                            const form = {
                                upload_1024: await axios({
                                    url: randomUrl,
                                    responseType: 'stream'
                                }).then(response => response.data)
                            };
                            const response = await api.postFormData("https://upload.facebook.com/ajax/mercury/upload.php", form);
                            const body = JSON.parse(response.body.replace('for (;;);', ''));
                            const metadata = body.payload?.metadata?.[0] || {};
                            const [key, value] = Object.entries(metadata)[0] || [];
                            return [key, value];
                        } catch (error) {
                            logger("Upload error: " + error, "[ AUTO UPLOAD ]");
                            return null;
                        }
                    });

                    const results = await Promise.all(uploadPromises);
                    const validResults = results.filter(result => result !== null);
                    currentList.push(...validResults);
                    writeFileSync(globalPath, JSON.stringify(globalData, null, 2));
                } catch (error) {
                    logger("Process upload error: " + error, "[ AUTO UPLOAD ]");
                } finally {
                    isProcessing = false;
                }
            }

            toggle = (toggle + 1) % 4; // cập nhật để vòng lặp có 4 trạng thái
        } catch (error) {
            logger("Handle event error: " + error, "[ AUTO UPLOAD ]");
        }
    }, 5000);

    global.bat = globalData.vdgai;
    global.vdanime = globalData.vdanime;
    global.vdcos = globalData.vdcosplay;
    global.vdtrai = globalData.vdtrai;

    return async function () {};
};