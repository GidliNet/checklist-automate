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
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: "load" });
  await page.locator("#name").fill(username);
  await page.locator("#password").fill(password);

  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle2" }),
    await page.locator("#enter").click(),
  ]);

  const data = await page.goto(
    `${url}?action=dashboard.view&dashboardid=1&from=now-15m&to=now`,
    { waitUntil: "networkidle2" },
  );

  const folder_path=await folder_creation(await date_formatter())
  await page.screenshot({ path: `./Screenshots/${folder_path}/${filename}.jpg` });
  const koisk_button_exist = await page.$(".btn-kiosk");
  if (koisk_button_exist) {
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle2" }),
      ,
      await page.locator(".btn-kiosk").click(),
    ]);
  } else {
  }

  const statsSelector = await page.locator("body");
  const statsWait = await statsSelector.waitHandle();
  const STATS = await statsWait?.evaluate((el) => el.textContent);

  browser.close();
  return STATS;
};
