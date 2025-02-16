const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");

const MAX_RETRY_CHECK_ENDPOINT = 3;
const MAX_DURATION = 15 * 1000;

exports.handler = async (event) => {
  const url = event.queryStringParameters?.url;

  if (!url) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "URL is required" }),
    };
  }

  try {
    const html = await fetchDocumentWithLazyLoad(url);
    const encodedHtml = Buffer.from(html).toString("base64");

    return {
      statusCode: 200,
      body: JSON.stringify({ url: url, encode: "base64", html: encodedHtml }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to fetch the document.",
        detail: error.message,
      }),
    };
  }
};

async function fetchDocumentWithLazyLoad(url) {
  let browser = null;

  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded" });

    const viewportHeight = await page.evaluate(() => window.innerHeight);
    let previousScrollTop = -1;
    const startTime = Date.now();
    let retryCheckEndpointCount = 0;

    while (Date.now() - startTime < MAX_DURATION) {
      console.log("Previous Scroll:", previousScrollTop);

      const { scrollTop } = await page.evaluate(() => ({
        scrollTop: window.scrollY,
        scrollHeight: document.documentElement.scrollHeight,
      }));

      if (scrollTop === previousScrollTop) {
        if (retryCheckEndpointCount < MAX_RETRY_CHECK_ENDPOINT) {
          retryCheckEndpointCount++;
          await waitForTimeout(500);
          continue;
        }
        break;
      } else {
        retryCheckEndpointCount = 0;
      }

      await page.mouse.wheel({ deltaY: viewportHeight });

      await waitForTimeout(random(500, 1000));

      previousScrollTop = scrollTop;
    }

    return await page.content();
  } catch (error) {
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function waitForTimeout(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
