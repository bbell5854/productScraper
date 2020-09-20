const axios = require('axios');
const cheerio = require('cheerio');

async function fetchHTML(url) {
  const { data } = await axios.get(url)
  return cheerio.load(data)
}

function sendNotification(message, url) {
  const pushoverUrl = 'https://api.pushover.net/1/messages.json';
  const payload = {
    user: process.env.PUSHOVER_USER,
    token: process.env.PUSHOVER_TOKEN,
    message: message,
    url: url
  };
  axios.post(pushoverUrl, payload);
}

function checkEvga3080() {
  const htmlUrls = [
    'https://www.evga.com/products/product.aspx?pn=10G-P5-3885-KR',
    'https://www.evga.com/products/product.aspx?pn=10G-P5-3883-KR',
  ];

  htmlUrls.forEach(async url => {
    try {
      const $ = await fetchHTML(url);
      
      const outOfStockDiv = $('#LFrame_pnlOutOfStock');
  
      if (outOfStockDiv.length > 0) {
        return
      }
  
      sendNotification('3080 In Stock', url)
    } catch (error) {
      console.log(error);
      // Uncomment this if you want errors pushed to your device with pushover.
      // sendNotification(`Error scraping products: ${error}`);
    }
  });
}

exports.handler = function() {
  checkEvga3080();
};
