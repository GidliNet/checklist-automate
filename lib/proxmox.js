export const proxmox = async (PROXMOX_SECRET) => {
    const data = await get_proxmox_vm_status(PROXMOX_SECRET,"pve1")
    const built_data = await build_proxmox_data(data.data)
    console.log(built_data)


}

export const format_proxmox_data = async (built_data) => {

    let template = ``
    built_data.forEach((element, index) => {
        template = template + `<tr style="background-color:${element.status == "down" ? "red" : "white"}">
           <td style="padding-left:2px;padding-right:12px;text-align:left;">${element.max_disk}</td>
           <td style="padding-left:2px;padding-right:12px;text-align:left;">${element.disk_percentage}</td>
           <td style="padding-left:2px;padding-right:12px;text-align:left;">${element.memory}</td>
           <td style="padding-left:2px;padding-right:12px;text-align:left;">${element.memory_percentage}</td>
           <td style="padding-left:2px;padding-right:12px;text-align:left;">${element.cpu_usage}</td>
           <td style="padding-left:2px;padding-right:12px;text-align:left;">${element.status}</td>
           </tr>`
    });

    return `
           </br>
           <h4>Proxmox Status</h4>
           <table border=1>
           <thead>
           <tr>
           <td style="padding-left:2px;padding-right:12px;text-align:left;">ISP-Server</td>
           <td style="padding-left:2px;padding-right:12px;text-align:left;">Download</td>
           <td style="padding-left:2px;padding-right:12px;text-align:left;">Upload</td>
           <td style="padding-left:2px;padding-right:12px;text-align:left;">Remarks</td>
           </tr>
           </thead>
           <tbody>
         ${email_internet_status_template}
           </tbody>  
         </table>
         </br>
         `
}


export const get_proxmox_vm_status = async (config) => {
    var myHeaders = new Headers();
    myHeaders.append("Authorization", PROXMOX_SECRET);

    var requestOptions = {
        method: 'GET',
        headers: myHeaders,
        redirect: 'follow'
    };

    const result = await fetch(`https://${config.proxmox_ip}:8006/api2/json/cluster/resources?type=vm`, requestOptions)
    const data = await result.json()
    return data
}


const calculation_of_resource = async (mib) => {
    const calculated = Math.round((mib / 1024 / 1024) * 10) / 10;
    return calculated
}
const build_proxmox_data = async (data) => {

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
        built_data.push({
            "max_disk": max_disk,
            "disk_percentage": disk_percentage,
            "memory": memory_usage,
            "memory_percentage": memory_percentage,
            "cpu_usage": cpu_usage,
            "uptime": uptime,
            "status": status,
        })
    }
    return built_data
}