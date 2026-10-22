import { parseNetworkStats } from "./tool.js";

export const get_router_resource = async (ip, username, password) => {
    let headersList = {
        "Accept": "*/*",
        "User-Agent": "Thunder Client (https://www.thunderclient.com)",
        "Authorization": `Basic ${btoa(`${username}:${password}`)}`
    }

    let response = await fetch(`http://${ip}/rest/system/resource`, {
        method: "GET",
        headers: headersList
    });

    let data = await response.json();
    return data

}
export const get_router_system_health = async (ip, username, password) => {
    let headersList = {
        "Accept": "*/*",
        "User-Agent": "Thunder Client (https://www.thunderclient.com)",
        "Authorization": `Basic ${btoa(`${username}:${password}`)}`
    }

    let response = await fetch(`http://${ip}/rest/system/health`, {
        method: "GET",
        headers: headersList
    });

    let data = await response.json();
    return data

}


export const get_router_speed_test = async (ip, username, password, target_ip, target_username, target_password) => {

    let headersList = {
        "Accept": "*/*",
        "User-Agent": "Thunder Client (https://www.thunderclient.com)",
        "Content-Type": "application/json",
        "Authorization": `Basic ${btoa(`${username}:${password}`)}`
    }

   console.log(target_password.contains("$")?target_password.replaceAll("$","\\$"):target_password)
    let bodyContent = JSON.stringify({
        "script": `/tool/speed-test address=${target_ip}  user=${target_username} password="${target_password.contains("$")?target_password.replaceAll("$","\\$"):target_password}"`, "as-string": ""
    }
    );

    let response = await fetch(`http://${ip}/rest/execute`, {
        method: "POST",
        body: bodyContent,
        headers: headersList
    });

    let data = await response.text();
    console.log(data)

    let remove_slash_r = data.replaceAll("\\r", "")
    let remove_slash_n = remove_slash_r.replaceAll("\\n", "")
    let convert_to_json = JSON.parse(remove_slash_n)
    let get_json_data = convert_to_json.ret
    let convert_result_to_array = get_json_data.split("status")
    let get_final_data = convert_result_to_array[convert_result_to_array.length - 1]
    let network_parsed = parseNetworkStats("Status" + get_final_data)
    return network_parsed
}


export const get_router_identity = async (ip, username, password) => {
    let headersList = {
        "Accept": "*/*",
        "User-Agent": "Thunder Client (https://www.thunderclient.com)",
        "Content-Type": "application/json",
        "Authorization": `Basic ${btoa(`${username}:${password}`)}`
    }

    let response = await fetch(`http://${ip}/rest/system/identity/print`, {
        method: "POST",
        headers: headersList
    });

    let data = await response.json();
    return data[0].name

}