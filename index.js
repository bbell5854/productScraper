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

async function checkAmazonProduct(url) {
  try {
    const $ = await fetchHTML(url);
    const availabilitySpan = $('#availability span').text();
    const availabilityText = availabilitySpan.replace(/[^0-9a-z]/gi, '').toLowerCase();

    if (availabilityText == 'currentlyunavailable') {
      return
    }

    sendNotification('PS5 In Stock', url)
  } catch (error) {
    console.log(error);
    // Uncomment this if you want errors pushed to your device with pushover.
    // sendNotification(`Error scraping products: ${error}`);
  }
}

exports.handler = function() {
  checkAmazonProduct('https://www.amazon.com/PlayStation-5-Console/dp/B08FC5L3RG');
};

exports.handler();