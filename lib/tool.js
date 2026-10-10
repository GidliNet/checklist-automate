import { get_router_identity, get_router_resource, get_router_system_health } from "./routers.js"
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
            console.log(`Router ${ip}: REST API returned HTTP ${response.status}`);
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
        console.log(`Router ${ip}: REST API unavailable or timed out`);
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

export const obtain_router_data = async (ip, username, password, router_data_list) => {


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
            console.log(`Router ${ip}: REST API returned HTTP ${response.status}`);
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
        console.log(`Router ${ip}: REST API unavailable or timed out`);
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
    console.log(router_resources)
    router_data_list.push({
        "ip": ip,
        "name": router_identity,
        "cpu_load": `${router_resources["cpu-load"]} %`,
        "memory": `${Math.round((router_resources["free-memory"] / 1024 / 1024) * 10) / 10} MiB / ${Math.round((router_resources["total-memory"] / 1024 / 1024) * 10) / 10} MiB`,
        "storage": `${Math.round((router_resources["free-hdd-space"] / 1024 / 1024) * 10) / 10} MiB / ${Math.round((router_resources["total-hdd-space"] / 1024 / 1024) * 10) / 10} MiB`,
        "bad_block": router_resources["bad-blocks"] === undefined ? "N/A" : `${router_resources["bad-blocks"]} %`,
        "uptime": router_resources["uptime"],
        "temperature": `${router_system_health.find((element) => element.name == "temperature" || element.name == "cpu-temperature").value} ℃ `,
        "status": "up"
    })
    return router_data_list
}


export const build_router_data = async (router_data, ROUTER_DETAILS_PATH) => {
    const router_details = await fs.readFileSync(ROUTER_DETAILS_PATH, "utf8")
    const parsed_router_detail = JSON.parse(router_details)
    for (const element of parsed_router_detail) {
        const return_plain_cred = await atob(element.btoa)
        const parsing_plain_cred = return_plain_cred.split(":")
        router_data = await obtain_router_data(element.ip, parsing_plain_cred[0], parsing_plain_cred[1], router_data)
    }


    let email_router_template = ""
    router_data.forEach((element, index) => {
        email_router_template = email_router_template + `<tr style="background-color:${element.status == "down" ? "red" : "white"}">
    <td>${index}</td>
    <td>${element.ip}</td>
    <td>${element.name}</td>
    <td>${element.cpu_load}</td>
    <td>${element.memory}</td>
    <td>${element.storage}</td>
    <td>${element.bad_block}</td>
    <td>${element.uptime}</td>
    <td>${element.temperature}</td>
    <td>${element.status}</td>
    </tr>`
    });

    return `
    </br>
    <h4>Routers</h4>
    <table border=1>
    <thead>
    <tr>
    <th>ID</th>
    <th>IP Address</th>
    <th>Router Name</th>
    <th>CPU</th>
    <th>Ram</th>
    <th>Storage</th>
    <th>Bad Block</th>
    <th>Uptime</th>
    <th>Temperature</th>
    <th>Status</th>
    </tr>
    </thead>
    <tbody>
  ${email_router_template}
    </tbody>  
  </table>`
}