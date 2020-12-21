const axios = require("axios");
const cheerio = require("cheerio");

const UA_FIREFOX =
  "Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:47.0) Gecko/20100101 Firefox/47.0";
const UA_POSTMAN = "PostmanRuntime/7.26.8";

const TARGET_API_KEY = "ff457966e64d5e877fdbad070f276d18ecec4a01";

async function fetchHTML(url, fireFoxUserAgent) {
  let userAgent = UA_POSTMAN;

  if (fireFoxUserAgent) {
    userAgent = UA_FIREFOX;
  }

  var config = {
    method: "get",
    url,
    headers: {
      "User-Agent": userAgent,
      Accept: "*/*",
      "Accept-Encoding": "gzip, deflate, br",
      "Cache-Control": "no-cache",
    },
  };
  const { data } = await axios(config);
  return cheerio.load(data);
}

function sendNotification(message, url) {
  const pushoverUrl = "https://api.pushover.net/1/messages.json";
  const payload = {
    user: process.env.PUSHOVER_USER,
    token: process.env.PUSHOVER_TOKEN,
    message: message,
    url: url,
  };
  axios.post(pushoverUrl, payload);
}

async function checkTargetProduct(product_id, zipcode, url) {
  try {
    const options = {
      method: "GET",
      headers: { "User-Agent": "user_agent_info" },
      url: `https://api.target.com/fulfillment_aggregator/v1/fiats/${product_id}?key=${TARGET_API_KEY}&nearby=${zipcode}&limit=20&requested_quantity=1&radius=50`,
    };

    const response = await axios.get(options.url, options);
    const responseString = JSON.stringify(response.data);

    if (
      responseString.includes("IN_STOCK") ||
      responseString.includes("LIMITED_STOCK")
    ) {
      sendNotification("Product In Stock - TARGET", url);
      return true;
    }

    return false;
  } catch (error) {
    console.error(error);
    // Uncomment this if you want errors pushed to your device with pushover.
    sendNotification(`Error scraping products - Target: ${error}`);
  }
}

async function checkAmazonProduct(url) {
  try {
    const $ = await fetchHTML(url, true);
    const availabilitySpan = $("#availability span").text();
    const availabilityText = availabilitySpan
      .replace(/[^0-9a-z]/gi, "")
      .toLowerCase();

    if (availabilityText == "currentlyunavailable") {
      return;
    }

    sendNotification("Product In Stock - AMAZON", url);
  } catch (error) {
    console.log(error);
    // Uncomment this if you want errors pushed to your device with pushover.
    // sendNotification(`Error scraping products: ${error}`);
  }
}

async function checkNewEggProduct(url) {
  try {
    const $ = await fetchHTML(url, true);
    const availabilitySpan = $("#ProductBuy .btn-message").text();
    const availabilityText = availabilitySpan
      .replace(/[^0-9a-z]/gi, "")
      .toLowerCase();

    if (availabilityText == "soldout") {
      return;
    }

    sendNotification("Product In Stock - NEWEGG", url);
  } catch (error) {
    console.log(error);
    // Uncomment this if you want errors pushed to your device with pushover.
    // sendNotification(`Error scraping products: ${error}`);
  }
}

async function checkBHProduct(url) {
  try {
    const resp = await axios.get(url);

    sendNotification("Product In Stock - BH Photo", url);
  } catch (error) {
    if (error && error.response && error.response.status > 299) {
      return;
    }
    console.log(error);
    // Uncomment this if you want errors pushed to your device with pushover.
    // sendNotification(`Error scraping products: ${error}`);
  }
}

async function checkBestBuyProduct(url) {
  try {
    const $ = await fetchHTML(url, false);
    const availabilitySpan = $(".add-to-cart-button").text();
    const availabilityText = availabilitySpan
      .replace(/[^0-9a-z]/gi, "")
      .toLowerCase();

    if (availabilityText == "soldout") {
      return;
    }

    sendNotification("Product In Stock - BEST BUY", url);
  } catch (error) {
    console.log(error);
    // Uncomment this if you want errors pushed to your device with pushover.
    // sendNotification(`Error scraping products: ${error}`);
  }
}

async function checkAdoramaProduct(url) {
  try {
    const $ = await fetchHTML(url, false);
    const availabilitySpan = $(".buy-section .add-to-cart").text();
    const availabilityText = availabilitySpan
      .replace(/[^0-9a-z]/gi, "")
      .toLowerCase();

    if (availabilityText == "temporarilynotavailable") {
      return;
    }

    sendNotification("Product In Stock - ADORAMA", url);
  } catch (error) {
    console.log(error);
    // Uncomment this if you want errors pushed to your device with pushover.
    // sendNotification(`Error scraping products: ${error}`);
  }
}

exports.handler = function () {
  checkAmazonProduct(
    "https://www.amazon.com/EVGA-10G-P5-3885-KR-GeForce-Cooling-Backplate/dp/B08HR55YB5"
  );
  checkAmazonProduct(
    "https://www.amazon.com/EVGA-10G-P5-3883-KR-GeForce-Cooling-Backplate/dp/B08HR4RJ3Q"
  );
  checkNewEggProduct(
    "https://www.newegg.com/evga-geforce-rtx-3080-10g-p5-3885-kr/p/N82E16814487520"
  );
  checkNewEggProduct(
    "https://www.newegg.com/evga-geforce-rtx-3080-10g-p5-3883-kr/p/N82E16814487521"
  );
  checkBestBuyProduct(
    "https://www.bestbuy.com/site/evga-geforce-rtx-3080-xc3-ultra-gaming-10gb-gddr6-pci-express-4-0-graphics-card/6436195.p?skuId=6436195"
  );
  checkBestBuyProduct(
    "https://www.bestbuy.com/site/evga-geforce-rtx-3080-xc3-gaming-10gb-gddr6-pci-express-4-0-graphics-card/6436194.p?skuId=6436194"
  );
  checkAdoramaProduct(
    "https://www.adorama.com/ev10g53885kr.html?origterm=10g-p5-3885-kr"
  );
};

exports.handler();
