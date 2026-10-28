const speedtest_internet = async (SPEEDTEST_API_KEY) => {
    try {
        console.log(SPEEDTEST_API_KEY)
        var myHeaders = new Headers();
        myHeaders.append("X-API-Key", SPEEDTEST_API_KEY);

        var requestOptions = {
            method: 'POST',
            headers: myHeaders,
            redirect: 'follow'
        };

        const response = await fetch(`http://${process.env.SPEEDTEST_API_IP}:8000/run?wait=true`, requestOptions)

        const data = await response.json()
        console.log(data)
        return data

    } catch (error) {
        return []
    }
}

export const build_speedtest_data = async (SPEEDTEST_API_KEY) => {
    const data = await speedtest_internet(SPEEDTEST_API_KEY);
    const results = data.results

    let email_internet_status_template = ``
    results.forEach((element, index) => {
        email_internet_status_template = email_internet_status_template + `<tr style="background-color:${element.status == "down" ? "red" : "white"}">
        <td style="padding-left:2px;padding-right:12px;text-align:left;">${element.label}</td>
        <td style="padding-left:2px;padding-right:12px;text-align:left;">${element.download}</td>
        <td style="padding-left:2px;padding-right:12px;text-align:left;">${element.upload}</td>
        <td style="padding-left:2px;padding-right:12px;text-align:left;">${element.remarks}</td>
        </tr>`
    });

    return `
        </br>
        <h4>Internet Status</h4>
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