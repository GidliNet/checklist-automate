import fs from "node:fs"

export const proxmox = async (PROXMOX_CONFIG_PATH) => {

    const proxmox_config = await fs.readFileSync(PROXMOX_CONFIG_PATH, "utf-8")
    const configuration = JSON.parse(proxmox_config)
    console.log(configuration)
    let formatted_proxmox = ""

    for (const element of configuration) {
        const data = await get_proxmox_vm_status(element.proxmox_api, element.ip_address)
        const built_data = await build_proxmox_data(data.data, element.PVE_NAME)
        formatted_proxmox = formatted_proxmox + await format_proxmox_data(built_data)
    }


    return formatted_proxmox


}

export const format_proxmox_data = async (built_data) => {
    console.log(built_data)
    let template = ``

    built_data.data.forEach((element, index) => {
        console.log(element)

        template = template + `<tr >
           <td style="padding-left:2px;padding-right:12px;text-align:left;">${element.name}</td>
        <td style="padding-left:2px;padding-right:12px;text-align:left;">${element.disk} Mib / ${element.max_disk} Mib , ${element.disk_percentage.toFixed(2)} %</td>
           <td style="padding-left:2px;padding-right:12px;text-align:left;">${element.memory} Mib / ${element.max_memory} Mib , ${element.memory_percentage.toFixed(2)} %</td>
           <td style="padding-left:2px;padding-right:12px;text-align:left;">${element.cpu_usage.toFixed(2)} %</td>
           <td style="padding-left:2px;padding-right:12px;text-align:left;color:${element.status == "running" ? "green" : "white"}">${element.status}</td>
           </tr>`
    });

    return `
           </br>
           <h4>${built_data.PVE_NAME} Status</h4>
           <table border=1>
           <thead>
           <tr>
           <td style="padding-left:2px;padding-right:12px;text-align:left;">Name</td>
           <td style="padding-left:2px;padding-right:12px;text-align:left;">Max Disk</td>
           <td style="padding-left:2px;padding-right:12px;text-align:left;">Memory</td>
           <td style="padding-left:2px;padding-right:12px;text-align:left;">CPU Usage</td>
           <td style="padding-left:2px;padding-right:12px;text-align:left;">Status</td>
           </tr>
           </thead>
           <tbody>
         ${template}
           </tbody>  
         </table>
         </br>
         `
}


export const get_proxmox_vm_status = async (proxmox_api, ip_address) => {
    var myHeaders = new Headers();
    myHeaders.append("Authorization", proxmox_api);

    var requestOptions = {
        method: 'GET',
        headers: myHeaders,
        redirect: 'follow'
    };

    const result = await fetch(`https://${ip_address}:8006/api2/json/cluster/resources?type=vm`, requestOptions)
    const data = await result.json()
    console.log(data)
    return data
}


const calculation_of_resource = async (mib) => {
    const calculated = Math.round((mib / 1024 / 1024) * 10) / 10;
    return calculated
}
const build_proxmox_data = async (data, PVE_NAME) => {

    const built_data = []


    for (const element of data) {
        const max_memory = await calculation_of_resource(element.maxmem)
        const max_disk = await calculation_of_resource(element.maxdisk)
        const memory_usage = await calculation_of_resource(element.mem)
        const disk_usage = await calculation_of_resource(element.disk)
        const cpu_usage = await element.cpu * 100
        const status = await element.status
        const memory_percentage = (memory_usage / max_memory) * 100;
        const disk_percentage = (disk_usage / max_disk) * 100;
        const uptime = element.uptime / 86400

        console.log(disk_usage)
        built_data.push({
            "name": element.name,
            "max_disk": max_disk,
            "disk": disk_usage,
            "disk_percentage": disk_percentage,
            "memory": memory_usage,
            "max_memory": max_memory,
            "memory_percentage": memory_percentage,
            "cpu_usage": cpu_usage,
            "uptime": uptime,
            "status": status,
        })
    }
    return {
        "PVE_NAME": PVE_NAME,
        "data": built_data
    }
}