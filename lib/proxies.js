export const onedotsix = async (url, page, username, password, filename) => {
    await page.goto(url, { waitUntil: "networkidle0" })
    await page.locator("#usernamefld").fill(username)
    await page.locator("#passwordfld").fill(password)

    await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle2" }),
        await page.locator("input[name='login']").click(),

    ])

    await page.screenshot({
        path: `./Screenshots/${filename}.jpg`
    })

    const data = await page.goto(`${url}getstats.php`, { waitUntil: "networkidle0" })
    const statsSelector = await page.locator("body")
    const statsWait = await statsSelector.waitHandle();
    const STATS = await statsWait?.evaluate(el => el.textContent)
    return STATS
}


export const zabbix = async (url, page, username, password, filename) => {
    await page.goto(url, { waitUntil: "networkidle0" })
    await page.locator("#name").fill(username)
    await page.locator("#password").fill(password)

    await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle2" }),
        await page.locator("#enter").click(),
    ])
    await page.screenshot({ path: `./Screenshots/${filename}.jpg` })
    const data = await page.goto(`${url}?action=dashboard.view&dashboardid=1&from=now-15m&to=now`, { waitUntil: "networkidle0" })

    const koisk_button_exist = await page.$(".btn-kiosk")
    console.log(koisk_button_exist)
    if (koisk_button_exist) {
        await Promise.all([page.waitForNavigation({ waitUntil: "networkidle2" }), , await page.locator(".btn-kiosk").click()])
    } else {
        console.log("Koisk button do not exist.")
    }

    const statsSelector = await page.locator("body")
    const statsWait = await statsSelector.waitHandle();
    const STATS = await statsWait?.evaluate(el => el.textContent)


    return STATS
}
