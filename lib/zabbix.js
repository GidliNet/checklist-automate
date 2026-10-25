import puppeteer from "puppeteer";
import {folder_creation,date_formatter} from "./tool.js"
export const zabbix = async (
  url,
  username,
  password,
  filename,
  puppeteer_params,
) => {
  const browser = await puppeteer.launch(puppeteer_params);
  console.log("Creating new instance of browser.")
  const page = await browser.newPage();
  console.log(`Go to ${url}`)
  await page.goto(url, { waitUntil: "load" });
  console.log("Entering credentials.")
  await page.locator("#name").fill(username);
  await page.locator("#password").fill(password);
  console.log("Logging in to zabbix")
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle2" }),
    await page.locator("#enter").click(),
  ]);
  console.log("Redirecting to zabbix dashboard.")
  const data = await page.goto(
    `${url}?action=dashboard.view&dashboardid=1&from=now-15m&to=now`,
    { waitUntil: "networkidle2" },
  );

  const folder_path=await folder_creation()
    console.log("Taking a screenshot and saving")

  await page.screenshot({ path: `${folder_path}/${filename}.jpg` });
  const koisk_button_exist = await page.$(".btn-kiosk");
        console.log("Checking for koisk button")
  if (koisk_button_exist) {

      console.log("Koisk button exist and to trigger to remove side bars")

    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle2" }),
      ,
      await page.locator(".btn-kiosk").click(),
    ]);
  } else {
          console.log("No koisk button found. Getting the data.")
  }

  const statsSelector = await page.locator("body");
  const statsWait = await statsSelector.waitHandle();
  const STATS = await statsWait?.evaluate((el) => el.textContent);
      console.log("Closing the button")
  browser.close();
  return STATS;
};
