import puppeteer from "puppeteer";
export const onedotsix = async (
  url,
  username,
  password,
  filename,
  puppeteer_params,
) => {
  const browser = await puppeteer.launch(puppeteer_params);
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.locator("#usernamefld").fill(username);
  await page.locator("#passwordfld").fill(password);

  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle2" }),
    await page.locator("input[name='login']").click(),
  ]);

  await page.screenshot({
    path: `./Screenshots/${filename}.jpg`,
  });

  const data = await page.goto(`${url}getstats.php`, {
    waitUntil: "networkidle0",
  });
  const statsSelector = await page.locator("body");
  const statsWait = await statsSelector.waitHandle();
  const STATS = await statsWait?.evaluate((el) => el.textContent);
  browser.close();
  return STATS;
};
