const fs = require("fs");
const path = require("path");

function saveObjectsToCSV(data, filePath) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    console.error("Invalid or empty data");
    return;
  }

  const headers = Object.keys(data[0]);

  const rows = data.map((obj) =>
    headers
      .map((header) => {
        const val = obj[header] ?? "";
        const escaped = ("" + val).replace(/"/g, '""');
        return `"${escaped}"`;
      })
      .join(",")
  );

  // Add header row
  rows.unshift(headers.join(","));

  const csvContent = rows.join("\n");

  // Ensure directory exists
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(filePath, csvContent, "utf8");
  console.log(`CSV file saved to ${filePath}`);
}
/**
 * Waits for a specific DOM element to appear on the page and extracts its content.
 * The content can be one of the following: text, src (image source), alt text, or href (link URL).
 *
 * @async
 * @function waitAndExtractContent
 * @param {import('puppeteer').Page} page - The Puppeteer page instance to interact with.
 * @param {string} selector - The CSS selector of the element to wait for and extract content from.
 * @param {string} [content="text"] - The type of content to extract.
 *    - "text": Extracts the text content of the element.
 *    - "src": Extracts the `src` attribute of an image element.
 *    - "alt": Extracts the `alt` attribute of an image element.
 *    - "href": Extracts the `href` attribute of a link element.
 * @returns {Promise<string|null>} The extracted content as a string, or `null` if the extraction fails.
 * @throws Will throw an error if the selector is not found or the content cannot be extracted.
 */
async function waitAndExtractContent(page, selector, content = "text") {
  try {
    if (content === "src") {
      // Wait for the image element to load and extract its 'src' attribute
      await page.waitForSelector(selector);
      const src = await page.$eval(selector, (el) => el.getAttribute("src"));
      console.log("img src:", src);
      return src;
    }
    if (content === "alt") {
      // Wait for the image element to load and extract its 'alt' attribute
      await page.waitForSelector(selector);
      const alt = await page.$eval(selector, (el) => el.getAttribute("alt"));
      console.log("img alt:", alt);

      return alt;
    }
    if (content === "href") {
      // Wait for the link element to load and extract its 'href' attribute
      await page.waitForSelector(selector);
      const href = await page.$eval(selector, (el) => el.getAttribute("href"));
      console.log("href:", href);
      return href;
    }
    await page.waitForSelector(selector);
    const textContent = await page.$eval(selector, (el) =>
      el.textContent.trim()
    );
    console.log("text:", textContent);
    return textContent;
  } catch (error) {
    console.error("Failed to extract content for: ", selector);
  }
}
/**
 * Waits for a specific DOM element to appear on the page and extracts its content.
 * The content can be one of the following: text, src (image source), alt text, or href (link URL).
 *
 * @async
 * @function waitAndExtractContent
 * @param {import('puppeteer').Page} page - The Puppeteer page instance to interact with.
 * @returns {Promise<string|null>} The extracted content as a string, or `null` if the extraction fails.
 * @throws Will throw an error if the selector is not found or the content cannot be extracted.
 */
async function gotoPageSourceAndGetSaves(page, pinUrl) {
  try {
    const html = await page.content();

    // Match: "aggregated_stats":{"saves":4205
    const match = html.match(
      /"aggregated_stats"\s*:\s*\{\s*"saves"\s*:\s*(\d+)/
    );

    if (match) {
      const saves = parseInt(match[1], 10);
      console.log(`Saves: ${saves}`);
      return saves;
    } else {
      console.log("Saves not found.");
      return null;
    }
  } catch (error) {
    console.error("Error getting saves:", error);
    return null;
  }
}

module.exports = {
  saveObjectsToCSV,
  waitAndExtractContent,
  gotoPageSourceAndGetSaves,
};
