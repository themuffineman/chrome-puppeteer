const puppeteer = require("puppeteer");
const { listOfPinUrls } = require("./pin-url");
const { config } = require("dotenv");
const fs = require("fs");
const path = require("path");
config();
const email = process.env.EMAIL;
const password = process.env.PASSWORD;
async function scrape() {
  const browser = await puppeteer.launch({
    headless: false, // headful mode
    args: ["--disable-notifications"], // Disable notifications
    defaultViewport: null, // Set to null to use the full window size
  });
  const page = await browser.newPage();
  await loginToPinterest(page, email, password);
  const validProfiles = [];
  for (const pinUrl of listOfPinUrls) {
    try {
      console.log(
        "Now Scraping:",
        pinUrl,
        "index:",
        listOfPinUrls.indexOf(pinUrl)
      );
      await page.goto(pinUrl, { waitUntil: "networkidle2" });
      // Wait for and click the creator's profile link
      const profileLinkSelector = 'a[data-test-id="creator-avatar-link"]';
      await page.waitForSelector(profileLinkSelector);
      console.log("Creator Link Found");
      await page.click(profileLinkSelector);

      // Wait for profile page to load
      const usernameSelector = 'span[data-test-id="profile-username"]'; // Replace with actual selector
      await page.waitForSelector(usernameSelector);

      // Extract the username
      const username = await page.$eval(usernameSelector, (el) =>
        el.textContent.trim()
      );
      console.log("Username:", username);

      // Click on the messaging pop-up button
      const messagePopupButtonSelector = 'div[aria-label="Messages"]';
      await page.waitForSelector(messagePopupButtonSelector);
      await page.click(messagePopupButtonSelector);
      console.log("Clicked on messges popup");
      const newMessageBtnSelector =
        'div[data-test-id="compose-new-message-button"]';
      await page.waitForSelector(newMessageBtnSelector);
      await page.click(newMessageBtnSelector);
      console.log("Clicked create new message btn");

      // Wait for the popup and search field to appear
      const messageSearchInputSelector = "input#contactSearch";
      await page.waitForSelector(messageSearchInputSelector);
      await page.type(messageSearchInputSelector, username, { delay: 450 });

      // Wait for matching user search result to appear
      const userResultSelector = "div.S9z.eEj.n9p.Tbt.L4E.e8F.BG7"; // Replace with dynamic matching logic if needed
      await page.waitForFunction(
        (selector, username) => {
          const items = Array.from(document.querySelectorAll(selector));
          return items.some((item) => item.textContent.includes(username));
        },
        {},
        userResultSelector,
        username
      );

      // Click on the matching user
      await page.evaluate(
        (selector, username) => {
          const items = Array.from(document.querySelectorAll(selector));
          const match = items.find((item) =>
            item.textContent.includes(username)
          );
          if (match) match.click();
        },
        userResultSelector,
        username
      );

      // Click the 'Next' button to proceed to chat
      const nextButtonSelector =
        "div.xuB.FID.undefined.NTm.KhY.vrQ.dfM.S9z.hNT.BG7.hDj._O1.KS5.mQ8.Tbt.L4E";
      await page.waitForSelector(nextButtonSelector);
      await page.click(nextButtonSelector);

      // Wait for either chat interface or error toast
      const chatInterfaceSelector = "textarea#messageDraft";
      try {
        await page.waitForSelector(chatInterfaceSelector, { timeout: 5000 });
        console.log("Chat interface loaded.");

        // Save the profile URL since chat is enabled
        const profileUrl = page.url();
        console.log("User profile URL:", profileUrl);
        validProfiles.push(profileUrl);
        await appendWordToFile(profileUrl);
      } catch (e) {
        console.log("Messaging unavailable (toast likely shown).");
      }
    } catch (error) {
      console.error(error.messasge);
    }
  }
  await browser?.close();
  return validProfiles;
}
async function loginToPinterest(page, email, password) {
  // Go to Pinterest login page
  await page.goto("https://www.pinterest.com/login/", {
    waitUntil: "networkidle2",
  });

  // Wait for the login form fields
  await page.waitForSelector("input#email");
  await page.waitForSelector("input#password");

  // Type in credentials
  await page.type("input#email", email, { delay: 100 });
  await page.type("input#password", password, { delay: 100 });

  // Click the Log In button
  const loginButtonSelector = 'button[type="submit"]';
  await page.click(loginButtonSelector);

  // Wait for the homepage or navigation to complete
  try {
    await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 });
    console.log("Login successful");
  } catch (err) {
    console.log("Login may have failed or took too long");
  }
}
async function sendProfileUrl(url) {
  try {
    let res = await fetch(
      "https://cloud.activepieces.com/api/v1/webhooks/Hz6q79qL7GUXr8BS6qDO0",
      {
        method: "POST",
        body: JSON.stringify({
          url,
        }),
      }
    );
    if (!res.ok) {
      throw new Error("Failed to upload");
    }
  } catch (error) {
    console.error(error.message);
  }
}
scrape().then((urls) => console.log(urls));
async function appendWordToFile(word, filePath = "./profiles.txt") {
  try {
    const absolutePath = path.resolve(filePath);
    fs.appendFileSync(absolutePath, `${word}\n`, "utf8");
    console.log(`Word "${word}" appended to file: ${absolutePath}`);
  } catch (error) {
    console.error("Error appending word to file:", error.message);
  }
}
