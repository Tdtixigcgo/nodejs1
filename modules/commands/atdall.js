const axios = require("axios");
const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const ffprobeStatic = require("ffprobe-static");

ffmpeg.setFfprobePath(ffprobeStatic.path);

module.exports.config = {
    name: "dl",
    version: "1.1.1",
    hasPermission: 0,
    credits: "vincent + updated by Bat",
    description: "Tải video hoặc âm thanh từ nhiều nền tảng (Facebook, TikTok, YouTube, v.v.)",
    commandCategory: "atd",
    usePrefix: false,
    usages: "dl <link>",
    cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID } = event;

    if (args.length === 0) {
        return api.sendMessage("❌ Vui lòng nhập đường link video hoặc âm thanh!", threadID, messageID);
    }

    const videoURL = args[0];
    if (!/^https?:\/\//i.test(videoURL)) {
        return api.sendMessage("❌ Đường link không hợp lệ!", threadID, messageID);
    }

    const apiKey = "979ce6";
    const apiURL = `https://hungdev.id.vn/medias/down-aio?apikey=${apiKey}&url=${encodeURIComponent(videoURL)}`;

    api.sendMessage("🔄 Đang xử lý, vui lòng chờ...", threadID, messageID);

    try {
        const res = await axios.get(apiURL);
        const data = res.data;

        if (!data || !data.success || !data.data) {
            return api.sendMessage("❌ Không thể tải dữ liệu. Hãy kiểm tra lại link!", threadID, messageID);
        }

        const { title, author, medias, images } = data.data;
        const hasNoMedia = !medias || medias.length === 0;
        const hasNoImages = !images || images.length === 0;

        if (hasNoMedia && hasNoImages) {
            return api.sendMessage("❌ Không tìm thấy dữ liệu tải!", threadID, messageID);
        }

        const cacheDir = path.join(__dirname, "cache");
        if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

        if (!hasNoMedia) {
            const bestMedia = medias.find(m => m.type === "video") || medias.find(m => m.type === "audio");
            if (bestMedia) {
                const fileExtension = bestMedia.extension || "mp4";
                const filePath = path.join(cacheDir, `dl_${Date.now()}.${fileExtension}`);
                const writer = fs.createWriteStream(filePath);
                const response = await axios.get(bestMedia.url, { responseType: "stream" });

                response.data.pipe(writer);

                writer.on("finish", async () => {
                    try {
                        const accurateDuration = await getVideoDuration(filePath);
                        const formattedDuration = formatDuration(accurateDuration);

                        api.sendMessage({
                            body: `⩺ Tiêu Đề: ${title}\n⩺ Tác Giả: ${author}\n⩺ Thời Lượng: ${formattedDuration}`,
                            attachment: fs.createReadStream(filePath)
                        }, threadID, () => {
                            fs.unlink(filePath, err => {
                                if (err) console.error("❌ Lỗi khi xóa file:", err);
                            });
                        }, messageID);
                    } catch (error) {
                        console.error("Lỗi khi lấy thời lượng video:", error);
                        api.sendMessage("❌ Lỗi khi đọc thời lượng video!", threadID, messageID);
                    }
                });

                writer.on("error", err => {
                    console.error("❌ Lỗi khi tải file:", err);
                    return api.sendMessage("❌ Lỗi khi tải file. Thử lại sau!", threadID, messageID);
                });
            }
        }

        if (!hasNoImages) {
            let imagePaths = [];
            for (const [index, imgUrl] of images.entries()) {
                const imagePath = path.join(cacheDir, `image_${index}.jpg`);
                const writer = fs.createWriteStream(imagePath);

                try {
                    const response = await axios.get(imgUrl, { responseType: "stream" });
                    response.data.pipe(writer);

                    await new Promise((resolve, reject) => {
                        writer.on("finish", resolve);
                        writer.on("error", reject);
                    });

                    imagePaths.push(imagePath);
                } catch (error) {
                    console.error(`Lỗi khi tải ảnh ${index}:`, error);
                }
            }

            if (imagePaths.length > 0) {
                api.sendMessage({
                    body: "📷 Ảnh TikTok:",
                    attachment: imagePaths.map(img => fs.createReadStream(img))
                }, threadID, () => {
                    imagePaths.forEach(img => fs.unlinkSync(img));
                });
            }
        }
    } catch (err) {
        console.error(err);
        return api.sendMessage("❌ Đã xảy ra lỗi khi xử lý yêu cầu!", threadID, messageID);
    }
};

// Hàm định dạng thời lượng từ giây → hh:mm:ss hoặc mm:ss
function formatDuration(duration) {
    const seconds = Math.floor(duration % 60);
    const minutes = Math.floor((duration / 60) % 60);
    const hours = Math.floor(duration / 3600);

    return hours > 0
        ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        : `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Hàm lấy thời lượng chính xác bằng ffmpeg
function getVideoDuration(filePath) {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
            if (err) return reject(err);
            resolve(metadata.format.duration);
        });
    });
}