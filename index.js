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

async function checkBumperPlates() {
  const htmlUrl = 'https://www.repfitness.com/bars-plates/olympic-plates/rep-color-bumper-plates';
  const $ = await fetchHTML(htmlUrl);

  const desiredWeights = {
    '10': true,
    '15': false,
    '25': false,
    '35': false,
    '45': false,
    '55': false,
  };

  let notify = false;

  const stockString = $('.product-info').children().first().children('span').text();
  if (stockString === 'Out of stock') {
    return;
  }

  const ordersDisabled = $('.add-to-box h1').text();
  if (ordersDisabled === 'Orders Temporarily Disabled') {
    return;
  }

  const rows = $('#super-product-table tbody tr');
  rows.each((_, elem) => {
    const productText = $(elem).children().first().text();
    const productAvailable = !$(elem).children().last().children('.out-of-stock').length;
    const weight = productText.match(/\d+/g);

    if (desiredWeights[weight[0]] && productAvailable) {
      notify = true;
    }
  });

  if (notify) {
    sendNotification('Bumper Plates In Stock', htmlUrl);
  }
}

async function checkChangePlates() {
  const htmlUrl = 'https://www.repfitness.com/bars-plates/olympic-plates/rep-lb-change-plates';
  const $ = await fetchHTML(htmlUrl);

  const desiredWeights = {
    '1': true,
    '2': false,
    '5': false,
    '10': true
  };

  let notify = false;

  const stockString = $('.product-info').children().first().children('span').text();
  if (stockString === 'Out of stock') {
    return;
  }

  const ordersDisabled = $('.add-to-box h1').text();
  if (ordersDisabled === 'Orders Temporarily Disabled') {
    return;
  }

  const rows = $('#super-product-table tbody tr');
  rows.each((_, elem) => {
    const productText = $(elem).children().first().text();
    const productAvailable = !$(elem).children().last().children('.out-of-stock').length;
    const weight = productText.match(/\d+/g);

    if (desiredWeights[weight[0]] && productAvailable) {
      notify = true;
    }
  });

  if (notify) {
    sendNotification('Change Plates In Stock', htmlUrl);
  }
}

async function checkTechniqueBar() {
  const htmlUrl = 'https://www.roguefitness.com/rogue-t-15-lb-technique-bar';
  const $ = await fetchHTML(htmlUrl);

  const stockString = $('.add-to-cart button').text().replace(/[^a-z0-9]/gi, '');
  if (stockString === 'NotifyMe') {
    return;
  }

  sendNotification('Technique Bar In Stock', htmlUrl);
}

async function checkIMDumbbells() {
  const htmlUrl = 'https://www.ironmaster.com/products/quick-lock-dumbbell-system-45-lb-set/';
  const $ = await fetchHTML(htmlUrl);

  const stockString = $('.product-stock .stock').text();

  if (stockString === 'OUT OF STOCK') {
    return;
  }

  sendNotification('Dumbbells In Stock', htmlUrl);
}

exports.handler = function() {
  checkBumperPlates();
  checkChangePlates();
  checkTechniqueBar();
  checkIMDumbbells();
};
