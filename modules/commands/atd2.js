const axios = require('axios');
const qs = require('qs');
const fs = require("fs");
const path = require("path");

async function getData(url) {
  try {
    const getToken = (await axios.get("https://fdownloader.net")).data;
    const k_exp = getToken.split('k_exp="')[1]?.split('"')[0];
    const k_token = getToken.split('k_token="')[1]?.split('"')[0];

    if (!k_exp || !k_token) throw new Error('Failed to retrieve tokens.');

    const data = qs.stringify({
      'k_exp': k_exp,
      'k_token': k_token,
      'q': url
    });

    const config = {
      method: 'post',
      url: 'https://v3.fdownloader.net/api/ajaxSearch?lang=en',
      headers: {
        "Accept": "*/*",
        "Origin": "https://fdownloader.net",
        "Referer": "https://fdownloader.net/",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "en-US,en;q=0.9",
        "Content-Type": "application/x-www-form-urlencoded",
        "Sec-Ch-Ua": '"Not/A)Brand";v="99", "Microsoft Edge";v="115", "Chromium";v="115"',
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": '"Windows"',
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36 Edg/115.0.1901.183",
        "X-Requested-With": "XMLHttpRequest",
      },
      data: data
    };

    const res = await axios(config);
    const dataContent = res.data.data;

    if (!dataContent) {
      console.error(`Không tìm thấy dữ liệu video từ link: ${url}`);
      return null;  // Trả về null thay vì thông báo lỗi
    }

    const thumb = dataContent.split('<img src="')[1]?.split('">')[0]?.replace(/;/g, "&");
    const audio = dataContent.split('id="audioUrl" value="')[1]?.split('"')[0]?.replace(/;/g, "&");
    const time = dataContent.split('clearfix')[1]?.split('<p>')[1]?.split("</p>")[0];
    const HD = dataContent.split('" rel="nofollow"')[0]?.split('<td>No</td>')[1]?.split('"')[1]?.replace(/;/g, "&");
    const SD = dataContent.split('>360p (SD)</td>')[1]?.split('<a href="')[1]?.split('"')[0]?.replace(/;/g, "&");
    const author = dataContent.split('<p class="author">')[1]?.split('</p>')[0]?.trim(); // Tên tác giả
    const views = dataContent.split('<p class="views">')[1]?.split('</p>')[0]?.trim(); // Lượt xem
    const shares = dataContent.split('<p class="shares">')[1]?.split('</p>')[0]?.trim(); // Lượt chia sẻ

    return {
      duration: time || "Không rõ",
      thumb: thumb,
      author: author || "Không rõ tác giả",
      views: views || "Không rõ",
      shares: shares || "Không rõ",
      url: HD || SD || null
    };
  } catch (e) {
    // Ghi lỗi vào console thay vì trả về thông báo lỗi
    console.error('Lỗi khi lấy dữ liệu từ API: ', e);
    return null;
  }
}

this.config = {
  name: 'atdfb',
  version: '1.1.1',
  hasPermssion: 3,
  credits: 'hphong', // Đừng thay credit của hphong
  description: 'Tự động tải xuống khi phát hiện liên kết Facebook',
  commandCategory: 'atd',
  usages: '[]',
  cooldowns: 2
};

function urlify(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  const matches = text.match(urlRegex);
  return matches || []; 
}

this.handleEvent = async function({ api, event }) {    
    if (event.senderID == api.getCurrentUserID()) return;

    let streamURL = (url, ext = 'jpg') => axios.get(url, { responseType: 'stream' })
        .then(res => (res.data.path = `tmp.${ext}`, res.data))
        .catch(e => null);

    const send = (msg, callback) => api.sendMessage(msg, event.threadID, callback, event.messageID);
    const head = app => ` `;
    const urls = urlify(event.body);

    for (const str of urls) {
        if (/facebook\.com\//.test(str)) {
          const res = await getData(str);
          if (res && res.url) {
            let attachment = await streamURL(res.url, 'mp4');
            send({
              body: ` `,
              attachment
            });
          } else {
            // Chuyển thông báo lỗi sang console thay vì tin nhắn
            console.error(`Không thể tải video từ link: ${str}`);
          }
        }
    }
};

this.run = async () => {};
