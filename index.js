import puppeteer from "puppeteer";
import * as dotenv from "dotenv"
import { onedotsix, zabbix } from "./lib/proxies.js"
import fs from "fs"
import nodemailer from "nodemailer";
import { Client } from "ssh2";
import { format } from "date-fns"
import { obtain_router_data, build_router_data } from "./lib/tool.js"
import { get_router_speed_test } from "./lib/routers.js";



dotenv.config()


const USERNAME = process.env.USER
const PASSWORD = process.env.PASS
const ROUTER_DETAILS_PATH = process.env.ROUTER_DETAILS_PATH

const main = async () => {
    const current_date = new Date()
    const full_date_format = format(current_date, 'MM/dd/yyyy')
    let router_data = []

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: {
            width: 1920, height: 1080
        }, acceptInsecureCerts: true,
        args: ['--start-maximized']
    })
    const page = await browser.newPage()
    await zabbix("http://192.168.36.118/zabbix/index.php", page, process.env.ZABBIX_USER, process.env.ZABBIX_PASSWORD, "ZabbixSnap")
    browser.close()


    const router = await build_router_data(router_data,ROUTER_DETAILS_PATH)
    const sitetosites=await get_router_speed_test("172.17.4.191",process.env.TEST_ROUTER_USERNAME,process.env.TEST_ROUTER_PASSWORD,"172.17.100.253",process.env.TEST_ROUTER_USERNAME,process.env.TEST_ROUTER_PASSWORD)
    console.log(sitetosites)


    const transporter = nodemailer.createTransport({
        host:process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        }, tls: {
            minVersion: 'TLSv1.2',
            maxVersion: 'TLSv1.2',
            ciphers: 'DEFAULT:@SECLEVEL=1',
            rejectUnauthorized: false
        }
    });
    try {
        await transporter.verify();
        console.log("Server is ready to take our messages");
    } catch (err) {
        console.error("Verification failed:", err);
    }

    try {

        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: process.env.EMAIL_TO,
            subject: "KMM Network Checklist",
            html: `
    <h1>Network Checklist ${full_date_format} </h1>
    <h4>Site Zabbix Screenshot</h4>
    <img src="cid:ZabbixScreenshot" alt="Site Zabbix Screenshot" width="640" height="360"/>

    ${router}

    Sites
    Site 1- Latency, Download, Upload
    Site 2- Latency, Download, Upload
                `,
            attachments: [{
                filename: "Zabbix",
                path: "./Screenshots/ZabbixSnap.jpg",
                cid: "ZabbixScreenshot"
            }, {
                filename: "Proxy 1.6.jpg",
                path: "./Screenshots/Proxy 1.6.jpg",
                cid: "ZabbixScreenshot"
            },]
        })
    }
    catch (e) {
        console.log(e)
    }







}


main()