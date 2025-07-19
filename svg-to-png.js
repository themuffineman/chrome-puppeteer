const puppeteer = require("puppeteer");
const fonts = require("./fonts/fonts-3.json");
const fs = require("fs");

(async () => {
  let browser;
  try {
    browser = await puppeteer.launch();
    const page = await browser.newPage();
    for (const font of fonts) {
      try {
        await page.setContent(font.icon);
        await page.evaluate(() => {
          const svg = document.querySelector("svg");
          if (svg) {
            const wrapper = document.createElement("div");
            wrapper.style.display = "inline-block";
            wrapper.style.padding = "5px";
            svg.parentNode.insertBefore(wrapper, svg);
            wrapper.appendChild(svg);
          }
        });
        const svg = await page.$("div");
        const svgImage = await svg.screenshot();
        const outputDir = "font-images";
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir);
        }
        fs.writeFileSync(`${outputDir}/${font.name}.png`, svgImage);
        console.log("Font:", font.name, "✅ Succcess");
      } catch (error) {
        console.log("Error with: ", font.name, " font --- ", error.message);
        continue;
      }
    }
  } catch (error) {
    console.error(error.message);
  } finally {
    browser?.close();
  }
})();
