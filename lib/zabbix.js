import puppeteer from "puppeteer";
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
  await page.screenshot({ path: `./Screenshots/${filename}.jpg` });
  const koisk_button_exist = await page.$(".btn-kiosk");
  console.log(koisk_button_exist);
  if (koisk_button_exist) {
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle2" }),
      ,
      await page.locator(".btn-kiosk").click(),
    ]);
  } else {
    console.log("Koisk button do not exist.");
  }

  const statsSelector = await page.locator("body");
  const statsWait = await statsSelector.waitHandle();
  const STATS = await statsWait?.evaluate((el) => el.textContent);

  browser.close();
  return STATS;
};
