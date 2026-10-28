
import * as dotenv from "dotenv";
import { zabbix } from "./lib/zabbix.js";
import nodemailer from "nodemailer";
import { build_router_data, build_sitetosite_data, date_formatter } from "./lib/tool.js";
import { build_speedtest_data } from "./lib/speedtest.js"
import fs from "node:fs"
import os from 'node:os';
import { onedotsix } from "./lib/proxies.js";
dotenv.config();

const USERNAME = process.env.USER;
const PASSWORD = process.env.PASS;
const ROUTER_DETAILS_PATH = process.env.ROUTER_DETAILS_PATH;
const COMPONENTS = process.env.COMPONENTS_PATH
const SPEEDTEST_API_KEY = process.env.SPEEDTEST_API_KEY

const main = async () => {
  console.log(SPEEDTEST_API_KEY)
  const full_date_format = await date_formatter()
  console.log(`Initiating checklist for date ${new Date()}`)
  const component = await fs.readFileSync(COMPONENTS, "utf-8")
  const op_sys = await os.platform() !== "win32" ? true : false
  const puppeteer_params = {
    headless: op_sys,
    defaultViewport: {
      width: 1920,
      height: 1080,
    },
    acceptInsecureCerts: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--js-flags="--max-old-space-size=512"'
    ],
  };

  await zabbix(
    "http://192.168.36.118/zabbix/index.php",
    process.env.ZABBIX_USER,
    process.env.ZABBIX_PASSWORD,
    "ZabbixSnap", puppeteer_params
  );



  const router = await build_router_data(ROUTER_DETAILS_PATH);


  const sitetosite = await build_sitetosite_data(
    process.env.SITETOSITE_DETAILS_PATH,
  );

  const internet_speed_status = await build_speedtest_data(SPEEDTEST_API_KEY);



  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      minVersion: "TLSv1.2",
      maxVersion: "TLSv1.2",
      ciphers: "DEFAULT:@SECLEVEL=1",
      rejectUnauthorized: false,
    },
  });
  try {
    await transporter.verify();
    console.log("\r\nConnected to Mail Server");
  } catch (err) {
    console.error("Verification failed:", err);
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_TO,
      subject: `${process.env.SUBJECT_HEADER_STATEMENT} ${full_date_format}`,
      html: `
    <body style="font-family:monospace">
    </br>
    <h4>${process.env.SITE} Zabbix Screenshot</h4>
    </br>
    <img src="cid:ZabbixScreenshot" alt="${process.env.SITE} Zabbix Screenshot" width="640" height="360"/>
</br>
            ${router}
            ${sitetosite}
            ${internet_speed_status}


            <p>This automated checklist was generated on ${new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" })}.</p>
    </body>
                `,
      attachments: [
        {
          filename: "Zabbix",
          path: `./Screenshots/${full_date_format}/ZabbixSnap.jpg`,
          cid: "ZabbixScreenshot",
        }
      ],
    });
    console.log("\n\rChecklist done and sent to email list.")
  } catch (e) {
    console.log(e);
  }
};

main();
