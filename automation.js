const puppeteer = require("puppeteer");
const { pinUrls } = require("./pin-url");
const { alreadyMesseged } = require("./already-messeged");
const { config } = require("dotenv");
const fs = require("fs");
const path = require("path");
const {
  waitAndExtractContent,
  gotoPageSourceAndGetSaves,
  saveObjectToJSON,
} = require("./utils.js");
const { fonts } = require("./test.js");
config();
const email = process.env.EMAIL;
const password = process.env.PASSWORD;
async function profilesAllowingMessages() {
  const browser = await puppeteer.launch({
    headless: false, // headful mode
    args: ["--disable-notifications"], // Disable notifications
    defaultViewport: null, // Set to null to use the full window size
  });
  const page = await browser.newPage();
  await loginToPinterest(page, email, password);
  const validProfiles = [];
  for (const pinUrl of pinUrls) {
    try {
      console.log("Now Scraping:", pinUrl, "index:", pinUrls.indexOf(pinUrl));
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
        if (alreadyMesseged.includes(profileUrl)) {
          console.log("Already messeged user");
          continue;
        }
        if (validProfiles.includes(profileUrl)) {
          console.log("Already scraped user");
          continue;
        }
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
async function appendWordToFile(word, filePath = "./profiles.txt") {
  try {
    const absolutePath = path.resolve(filePath);
    fs.appendFileSync(absolutePath, `${word}\n`, "utf8");
    console.log(`Word "${word}" appended to file`);
  } catch (error) {
    console.error("Error appending word to file:", error.message);
  }
}
async function pseo() {
  const profileLinkSelector = 'a[data-test-id="creator-avatar-link"]';
  const profileNameSelector = 'div[data-test-id="creator-profile-name"]';
  const pinTitleSelector = 'div[data-test-id="rich-pin-information"] h1';
  const pinImageSelector =
    'div[data-test-id="closeup-image-main"] img.hCL.kVc.L4E.MIw';
  const pinDescriptionSelector =
    'div[data-test-id="truncated-description"] span';
  const numberOfLikesSelector =
    'div[data-test-id="aggregated-reactions-container"] div.X8m.zDA.IZT.eSP.dyH.llN.Kv8';
  const scrapedData = [];
  const browser = await puppeteer.launch({
    headless: false, // headful mode
    args: ["--disable-notifications"], // Disable notifications
    defaultViewport: null, // Set to null to use the full window size
  });
  const page = await browser.newPage();
  await loginToPinterest(page, email, password);
  let scrapeIndex = 0;
  for (const pinUrl of pinUrls) {
    try {
      scrapeIndex++;
      console.log("----------------------------------");
      console.log("Now Scraping:", pinUrl, "index:", pinUrls.indexOf(pinUrl));
      await page.goto(pinUrl, { waitUntil: "networkidle2" });
      await page.waitForSelector(profileLinkSelector);
      console.log("Creator Found");
      const creatorProfileLink = await waitAndExtractContent(
        page,
        profileLinkSelector,
        "href"
      );
      if (alreadyMesseged.includes(creatorProfileLink)) {
        console.log("Already scraped user");
        continue;
      }
      const creatorName = waitAndExtractContent(
        page,
        profileNameSelector,
        "text"
      );
      const pinTitle = await waitAndExtractContent(
        page,
        pinTitleSelector,
        "text"
      );
      const pinDescription = await waitAndExtractContent(
        page,
        pinDescriptionSelector,
        "text"
      );
      const pinImage = await waitAndExtractContent(
        page,
        pinImageSelector,
        "src"
      );
      const likes = await waitAndExtractContent(
        page,
        numberOfLikesSelector,
        "text"
      );
      const saves = await gotoPageSourceAndGetSaves(page);
      if (
        pinTitle &&
        pinUrl &&
        pinDescription &&
        creatorProfileLink &&
        pinImage &&
        likes &&
        saves
      ) {
        scrapedData.push({
          title: pinTitle,
          pin_url: pinUrl,
          description: pinDescription,
          profile_name: creatorProfileLink,
          profile_url: `https://uk.pinterest.com${creatorProfileLink}`,
          image: pinImage,
          likes,
          saves,
        });
        console.log("----------------------------------");
        await appendWordToFile(creatorProfileLink);
      } else {
        console.log("Not all details present");
        continue;
      }
    } catch (error) {
      console.error(error.messasge);
    } finally {
      if (scrapedData.length > 104) {
        break;
      }
    }
  }
  await browser?.close();
  return scrapedData;
}
async function createFonts() {
  try {
    const fontSelectContainer = "#font-select";
    const fontOption = "#font-select > option";
    const nameInputSelector = "#input-text";
    const sizeInputSelector = "#input-size";
    const svgTextareaSelector = "#output-svg";

    const browser = await puppeteer.launch({
      headless: false,
      args: ["--disable-notifications"],
      defaultViewport: null,
    });

    const page = await browser.newPage();
    await page.goto("https://danmarshall.github.io/google-font-to-svg-path/", {
      waitUntil: "networkidle2",
    });
    await new Promise((res, _) => {
      setTimeout(() => {
        res();
      }, 10000);
    });
    const results = {};

    for (const fontName of fonts) {
      console.log(`Processing: ${fontName}`);

      // Select the font by matching its option value or text (case insensitive)
      await page.evaluate(
        (fontName, fontOption, fontSelectContainer) => {
          const options = Array.from(document.querySelectorAll(fontOption));
          const match = options.find(
            (opt) =>
              opt.textContent.trim().toLowerCase() === fontName.toLowerCase()
          );
          if (match) {
            document.querySelector(fontSelectContainer).value = match.value;
            match.selected = true;
            document
              .querySelector(fontSelectContainer)
              .dispatchEvent(new Event("change"));
          }
        },
        fontName,
        fontOption,
        fontSelectContainer
      );

      // Type the font name into the text input
      await page.$eval(nameInputSelector, (el) => (el.value = ""));
      await page.type(nameInputSelector, fontName, { delay: 50 });

      // Set font size
      await page.$eval(sizeInputSelector, (el) => (el.value = ""));
      await page.type(sizeInputSelector, "25", { delay: 50 });

      // Wait for the SVG to update
      await new Promise((res, _) => {
        setTimeout(() => {
          res();
        }, 500);
      });

      const svg = await page.$eval(svgTextareaSelector, (el) => el.value);
      results[fontName] = svg;
    }

    await browser.close();

    // Save or return your results
    // console.log("Generated SVGs:", results);
    // Optionally save to file using fs if needed:
    fs.writeFileSync("font-svgs.json", JSON.stringify(results, null, 2));
  } catch (error) {
    console.error("Error:", error);
  }
}

// profilesAllowingMessages().then((urls) => console.log(urls));
// pseo()
//   .then((data) => {
//     saveObjectToJSON(data, "./pseo-data.json");
//   })
//   .catch((err) => {
//     console.error("Failed to convert to CSV", err);
//   });
createFonts();
