const puppeteer = require("puppeteer");
const { config } = require("dotenv");
const fs = require("fs");
const path = require("path");
const { bloggers } = require("./food-bloggers");
config();

const foodblogposts = [];
const userWebsiteUrlSelector = 'div[data-test-id="CloseupDetails"] a';
async function getEmails() {
  let browser;
  try {
    browser = await puppeteer.launch({
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
        // Extract the website
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
    await browser?.close();
  }
}

getEmails();
