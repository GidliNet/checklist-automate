import { get_router_identity, get_router_resource, get_router_system_health, get_router_speed_test } from "./routers.js"
import { format } from "date-fns";

import fs from "fs"
export const parseNetworkStats = async (input) => {
    const match = (regex) => input.match(regex);

    const ping = match(
        /ping-min-avg-max:\s*(\S+)\s*\/\s*(\S+)\s*\/\s*(\S+)/
    );

    const jitter = match(
        /jitter-min-avg-max:\s*(\S+)\s*\/\s*(\S+)\s*\/\s*(\S+)/
    );

    const loss = match(
        /loss:\s*(\d+)%\s*\((\d+)\/(\d+)\)/
    );

    const cpu = (value) => value ? Number(value.replace('%', '')) : null;

    const get = (regex) => match(regex)?.[1] ?? null;

    return {
        status: get(/Status\s*:\s*(\S+)/),

        time_remaining: get(/time-remaining:\s*(\S+)/),

        ping: {
            min: ping?.[1] ?? null,
            avg: ping?.[2] ?? null,
            max: ping?.[3] ?? null
        },

        jitter: {
            min: jitter?.[1] ?? null,
            avg: jitter?.[2] ?? null,
            max: jitter?.[3] ?? null
        },

        loss: {
            percentage: loss ? Number(loss[1]) : null,
            packets_lost: loss ? Number(loss[2]) : null,
            packets_total: loss ? Number(loss[3]) : null
        },

        tcp_download: {
            speed: get(/tcp-download:\s*(\S+)/),
            local_cpu_load: cpu(
                get(/tcp-download:.*local-cpu-load:(\S+)/)
            )
        },

        tcp_upload: {
            speed: get(/tcp-upload:\s*(\S+)/),
            local_cpu_load: cpu(
                get(/tcp-upload:.*local-cpu-load:(\S+)/)
            ),
            remote_cpu_load: cpu(
                get(/tcp-upload:.*remote-cpu-load:(\S+)/)
            )
        },

        udp_download: {
            speed: get(/udp-download:\s*(\S+)/),
            local_cpu_load: cpu(
                get(/udp-download:.*local-cpu-load:(\S+)/)
            ),
            remote_cpu_load: cpu(
                get(/udp-download:.*remote-cpu-load:(\S+)/)
            )
        },

        udp_upload: {
            speed: get(/udp-upload:\s*(\S+)/),
            local_cpu_load: cpu(
                get(/udp-upload:.*local-cpu-load:(\S+)/)
            ),
            remote_cpu_load: cpu(
                get(/udp-upload:.*remote-cpu-load:(\S+)/)
            )
        }
    };
}


export const obtain_site_to_site = async (ip, username, password, router_data_list) => {


    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    try {
        const response = await fetch(`http://${ip}/rest/system/resource`, {
            method: "GET",
            headers: {
                Authorization: `Basic ${Buffer.from(
                    `${username}:${password}`
                ).toString("base64")}`,
                Accept: "application/json",
            },
            signal: controller.signal,
        });

        if (!response.ok) {
            router_data_list.push({
                "ip": ip,
                "name": "N/A",
                "cpu_load": "N/A",
                "memory": "N/A",
                "storage": "N/A",
                "uptime": "N/A",
                "temperature": "N/A",
                "status": "down"
            })
            return router_data_list;
        }
    } catch (error) {
        router_data_list.push({
            "ip": ip,
            "name": "N/A",
            "cpu_load": "N/A",
            "memory": "N/A",
            "storage": "N/A",
            "uptime": "N/A",
            "temperature": "N/A",
            "status": "down"
        })
        return router_data_list;
    } finally {
        clearTimeout(timeout);
    }
    const router_resources = await get_router_resource(ip, username, password)
    const router_system_health = await get_router_system_health(ip, username, password)
    const router_identity = await get_router_identity(ip, username, password)

    router_data_list.push({
        "ip": ip,
        "name": router_identity,
        "cpu_load": `${router_resources["cpu-load"]} %`,
        "memory": `${Math.round((router_resources["free-memory"] / 1024 / 1024) * 10) / 10} MiB / ${Math.round((router_resources["total-memory"] / 1024 / 1024) * 10) / 10} MiB`,
        "storage": `${Math.round((router_resources["free-hdd-space"] / 1024 / 1024) * 10) / 10} MiB / ${Math.round((router_resources["total-hdd-space"] / 1024 / 1024) * 10) / 10} MiB`,
        "uptime": parseMikrotikUptime(router_resources["uptime"]),
        "temperature": `${router_system_health.find((element) => element.name == "temperature" || element.name == "cpu-temperature").value} ℃ `,
        "status": "up"
    })

    return router_data_list

}

export const obtain_router_data = async (ip, username, password, router_data_list,name) => {


    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    try {
        const response = await fetch(`http://${ip}/rest/system/resource`, {
            method: "GET",
            headers: {
                Authorization: `Basic ${Buffer.from(
                    `${username}:${password}`
                ).toString("base64")}`,
                Accept: "application/json",
            },
            signal: controller.signal,
        });

        if (!response.ok) {
            router_data_list.push({
                "name": name,
                "cpu_load": "N/A",
                "memory": "N/A",
                "storage": "N/A",
                "uptime": "N/A",
                "temperature": "N/A",
                "status": "Failed to fetch"
            })
            return router_data_list;
        }
    } catch (error) {
        router_data_list.push({

            "name": name,
            "cpu_load": "N/A",
            "memory": "N/A",
            "storage": "N/A",
            "uptime": "N/A",
            "temperature": "N/A",
            "status": `Error occured: ${error}`
        })
        return router_data_list;
    } finally {
        clearTimeout(timeout);
    }


    const router_resources = await get_router_resource(ip, username, password)
    const router_system_health = await get_router_system_health(ip, username, password)
    const router_identity = await get_router_identity(ip, username, password)
    const used_memory =
  router_resources["total-memory"] - router_resources["free-memory"];

const memory_percentage =
  (used_memory / router_resources["total-memory"]) * 100;

    router_data_list.push({

        "name": name,
        "cpu_load": `${router_resources["cpu-load"]} %`,
        "memory": `${Math.round((used_memory / 1024 / 1024) * 10) / 10} MiB / ${Math.round((router_resources["total-memory"] / 1024 / 1024) * 10) / 10} MiB , ${memory_percentage.toFixed(2)}`,
        "storage": `${Math.round((router_resources["free-hdd-space"] / 1024 / 1024) * 10) / 10} MiB / ${Math.round((router_resources["total-hdd-space"] / 1024 / 1024) * 10) / 10} MiB`,
        "bad_block": router_resources["bad-blocks"] === undefined ? "N/A" : `${router_resources["bad-blocks"]} %`,
        "uptime": router_resources["uptime"],
        "temperature": `${router_system_health.find((element) => element.name == "temperature" || element.name == "cpu-temperature").value} ℃ `,
        "status": "up"
    })
    return router_data_list
}


export const build_router_data = async (ROUTER_DETAILS_PATH) => {
    let router_data = []
    const router_details = await fs.readFileSync(ROUTER_DETAILS_PATH, "utf8")
    const parsed_router_detail = JSON.parse(router_details)
    for (const element of parsed_router_detail) {
        const return_plain_cred = await atob(element.btoa)
        const parsing_plain_cred = return_plain_cred.split(":")
        router_data = await obtain_router_data(element.ip, parsing_plain_cred[0], parsing_plain_cred[1], router_data,element.name)
    }


    let email_router_template = ""
    router_data.forEach((element, index) => {
        email_router_template = email_router_template + `<tr style="background-color:${element.status !== "up" ? "red" : "white"}">
    <td style="padding-left:12px;padding-right:12px;text-align:left;">${element.name}</td>
    <td style="padding-left:12px;padding-right:12px;text-align:left;">${element.cpu_load}</td>
    <td style="padding-left:12px;padding-right:12px;text-align:left;">${element.memory}</td>
    <td style="padding-left:12px;padding-right:12px;text-align:left;">${element.storage}</td>
    <td style="padding-left:12px;padding-right:12px;text-align:left;">${element.bad_block}</td>
    <td style="padding-left:12px;padding-right:12px;text-align:left;">${element.uptime}</td>
    <td style="padding-left:12px;padding-right:12px;text-align:left;">${element.temperature}</td>
    <td style="padding-left:12px;padding-right:12px;text-align:left;">${element.status}</td>
    </tr>`
    });

    return `
    </br>
    <h4>Routers</h4>
    <table border=1 >
    <thead>
    <tr>
    <td padding-left:12px;padding-right:12px;text-align:left;>Router Name</td>
    <td padding-left:12px;padding-right:12px;text-align:left;>CPU</td>
    <td padding-left:12px;padding-right:12px;text-align:left;>Ram</td>
    <td padding-left:12px;padding-right:12px;text-align:left;>Storage</td>
    <td padding-left:12px;padding-right:12px;text-align:left;>Bad Block</td>
    <td padding-left:12px;padding-right:12px;text-align:left;>Uptime</td>
    <td padding-left:12px;padding-right:12px;text-align:left;>Temperature</td>
    <td padding-left:12px;padding-right:12px;text-align:left;>Status</td>
    </tr>
    </thead>
    <tbody>
  ${email_router_template}
    </tbody>  
  </table>
  </br>`
}


export const build_sitetosite_data = async (SITETOSITE_DETAILS_PATH,) => {
    const sitetosite = []
    const sitetosite_data = await fs.readFileSync(SITETOSITE_DETAILS_PATH, "utf-8")
    const sitetosite_parsed = JSON.parse(sitetosite_data)
    for (const element of sitetosite_parsed) {


        const return_plain_cred_from = await atob(element.from_btoa);
        const return_plain_cred_speedtest_credential = await atob(element.speedtest_credential_btoa)

        const parsed_plain_cred_from = return_plain_cred_from.split(":")
        const parsed_plain_cred_speedtest = return_plain_cred_speedtest_credential.split(":")


        const check_from_ip = await ip_checker(element.from, parsed_plain_cred_from[0], parsed_plain_cred_from[1])
        console.log(check_from_ip)

        if (!check_from_ip) {
            console.log("Unable to connect to server")
            sitetosite.push({
                "from_identity": {
                    "ip": "N/A",
                    "name": "N/A"
                }, "to_identity": {
                    "ip": "N/A",
                    "name": "N/A"
                },
                "average": "N/A",
                "loss": "N/A",
                "tcp_download": "N/A",
                "tcp_upload": "N/A",
                "remarks": "Unable to connect to host."
            });
        } else {
            console.log("Able to connect to server")
            try {
                const sitetosites = await get_router_speed_test(element.from, parsed_plain_cred_from[0], parsed_plain_cred_from[1], element.to, parsed_plain_cred_speedtest[0], parsed_plain_cred_speedtest[1]);
               console.log(sitetosites)
                if (sitetosites.tcp_download.speed === null && sitetosites.tcp_upload.speed === null) {
                    sitetosite.push({
                        "from_identity": {
                            "ip": element.from,
                            "name": element.from_name
                        }, "to_identity": {
                            "ip": element.to,
                            "name": element.to_name
                        },
                        "average": sitetosites.ping.avg,
                        "loss": sitetosites.loss.percentage,
                        "tcp_download": "N/A",
                        "tcp_upload": "N/A",
                        "remarks": "Please check if speedtest server is enabled."
                    })
                } else if (sitetosites.loss.percentage == 100) {
                    sitetosite.push({
                        "from_identity": {
                            "ip": element.from,
                            "name": element.from_name
                        }, "to_identity": {
                            "ip": element.to,
                            "name": element.to_name
                        },
                        "average": "N/A",
                        "loss": sitetosites.loss.percentage,
                        "tcp_download": "N/A",
                        "tcp_upload": "N/A",
                        "remarks": "Cannot connect to speedtest server."
                    })
                } else {
                    sitetosite.push({
                        "from_identity": {
                            "ip": element.from,
                            "name": element.from_name
                        }, "to_identity": {
                            "ip": element.to,
                            "name": element.to_name
                        },
                        "average": sitetosites.ping.avg,
                        "loss": sitetosites.loss.percentage,
                        "tcp_download": sitetosites.tcp_download.speed,
                        "tcp_upload": sitetosites.tcp_upload.speed,
                        "remarks": "Done"
                    })
                }
            } catch (err) {
                console.log(err)
                sitetosite.push({
                    "from_identity": {
                        "ip": "N/A",
                        "name": "N/A"
                    }, "to_identity": {
                        "ip": "N/A",
                        "name": "N/A"
                    },
                    "average": "N/A",
                    "loss": "N/A",
                    "tcp_download": "N/A",
                    "tcp_upload": "N/A",
                    "remarks": `Error occured: ${err}`
                });
            }
        }

    }
    let email_sitetosite_template = ""
    sitetosite.forEach((element, index) => {
        email_sitetosite_template = email_sitetosite_template + `<tr style="background-color:${element.status == "down" ? "red" : "white"}">
    <td style="padding-left:12px;padding-right:12px;text-align:left;">${element.from_identity.name} - ${element.to_identity.name}</td>
    <td style="padding-left:12px;padding-right:12px;text-align:left;">${element.average == "N/A" ? "N/A" : `${element.average}`}</td>
    <td style="padding-left:12px;padding-right:12px;text-align:left;">${element.loss == "N/A" ? "N/A" : `${element.loss} %`}</td>
    <td style="padding-left:12px;padding-right:12px;text-align:left;">${element.tcp_download}</td>
    <td style="padding-left:12px;padding-right:12px;text-align:left;">${element.tcp_upload}</td>
    <td style="padding-left:12px;padding-right:12px;text-align:left;">${element.remarks}</td>
    </tr>`
    });


    return `
    </br>
    <h4>Site to Site Speedtest</h4>
    <table border=1>
    <thead>
    <tr>
    <td style="padding-left:12px;padding-right:12px;text-align:left;">Site to Site</td>
    <td style="padding-left:12px;padding-right:12px;text-align:left;">Average</td>
    <td style="padding-left:12px;padding-right:12px;text-align:left;">Loss</td>
    <td style="padding-left:12px;padding-right:12px;text-align:left;">Download</td>
    <td style="padding-left:12px;padding-right:12px;text-align:left;">Upload</td>
    <td style="padding-left:12px;padding-right:12px;text-align:left;">Remarks</td>
    </tr>
    </thead>
    <tbody>
  ${email_sitetosite_template}
    </tbody>  
  </table>
  </br>
  `






}


const ip_checker = async (ip, username, password) => {



    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    try {
        const response = await fetch(`http://${ip}/rest/system/resource`, {
            method: "GET",
            headers: {
                Authorization: `Basic ${Buffer.from(
                    `${username}:${password}`
                ).toString("base64")}`,
                Accept: "application/json",
            },
            signal: controller.signal,
        });
        const txt=await response.ok
        console.log(txt)
        if (!response.ok) {
            return false;
        } else {
            return true
        }
    } catch (error) {
        return false;
    }
}

export const folder_creation =async (date)=>{
    const folder_name = await date_formatter()
 try{
   
    await fs.mkdirSync(`./Screenshots/${folder_name}`)
    return `./Screenshots/${folder_name}`
 }catch(err){
    
    console.log(err)
    return folder_name
 }
}

export const date_formatter=async () =>{
      const current_date = new Date();
      const full_date_format = format(current_date, "MM-dd-yyyy");
      return full_date_format
}