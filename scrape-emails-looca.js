const puppeteer = require("puppeteer");
const { config } = require("dotenv");
const fs = require("fs");
const path = require("path");
const { bloggers } = require("./food-bloggers");
config();

const foodblogposts = [];
const userWebsiteUrlSelector = 'div[data-test-id="CloseupDetails"] a';
async function getEmails() {
  try {
    const browser = await puppeteer.launch({
      headless: false, // headful mode
      args: ["--disable-notifications"], // Disable notifications
      defaultViewport: null, // Set to null to use the full window size
    });
    const page = await browser.newPage();
    for (const blogger of bloggers) {
      try {
        console.log("Now Scraping index:", bloggers.indexOf(blogger));
        await page.goto(blogger, { waitUntil: "networkidle2" });
        await page.waitForSelector(userWebsiteUrlSelector);
        console.log("Found Website Selector ✅");
        // Extract the username
        const website = await page.$eval(
          userWebsiteUrlSelector,
          (el) => el.href
        );
        foodblogposts.push(website);
      } catch (err) {
        console.log("Error Scraping❌: ", err.message);
      }
    }
  } catch (error) {
    console.log("Error Scraping Main❌❌: ", err.message);
  } finally {
  }
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

getEmails();
