import fetch from 'node-fetch';
import express from 'express';
import https from 'https';

const app = express();

app.get('/', async (req, res) => {
    if (!req.query.id) {
        res.sendFile(`${process.cwd()}/index.html`);
        return
    }

    const reqBody = `<s:Envelope xmlns:a="http://www.w3.org/2005/08/addressing" xmlns:s="http://www.w3.org/2003/05/soap-envelope"><s:Header><a:Action s:mustUnderstand="1">http://www.microsoft.com/SoftwareDistribution/Server/ClientWebService/GetExtendedUpdateInfo2</a:Action><a:MessageID>urn:uuid:af2aea53-49b2-4af5-b6df-80f78143023b</a:MessageID><a:To s:mustUnderstand="1">https://fe3.delivery.mp.microsoft.com/ClientWebService/client.asmx/secured</a:To><o:Security s:mustUnderstand="1" xmlns:o="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd"><Timestamp xmlns="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd"><Created>2019-02-24T22:00:42.71Z</Created><Expires>2019-02-24T22:05:42.71Z</Expires></Timestamp><wuws:WindowsUpdateTicketsToken wsu:id="ClientMSA" xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd" xmlns:wuws="http://schemas.microsoft.com/msus/2014/10/WindowsUpdateAuthorization"><TicketType Name="AAD" Version="1.0" Policy="MBI_SSL"></TicketType></wuws:WindowsUpdateTicketsToken></o:Security></s:Header><s:Body><GetExtendedUpdateInfo2 xmlns="http://www.microsoft.com/SoftwareDistribution/Server/ClientWebService"><updateIDs><UpdateIdentity>
                    <UpdateID>${req.query.id}</UpdateID>
                    <RevisionNumber>1</RevisionNumber></UpdateIdentity></updateIDs><infoTypes><XmlUpdateFragmentType>FileUrl</XmlUpdateFragmentType><XmlUpdateFragmentType>FileDecryption</XmlUpdateFragmentType><XmlUpdateFragmentType>EsrpDecryptionInformation</XmlUpdateFragmentType><XmlUpdateFragmentType>PiecesHashUrl</XmlUpdateFragmentType><XmlUpdateFragmentType>BlockMapUrl</XmlUpdateFragmentType></infoTypes><deviceAttributes>E:BranchReadinessLevel=CBB&amp;DchuNvidiaGrfxExists=1&amp;ProcessorIdentifier=Intel64%20Family%206%20Model%2063%20Stepping%202&amp;CurrentBranch=rs4_release&amp;DataVer_RS5=1942&amp;FlightRing=Retail&amp;AttrDataVer=57&amp;InstallLanguage=en-US&amp;DchuAmdGrfxExists=1&amp;OSUILocale=en-US&amp;InstallationType=Client&amp;FlightingBranchName=&amp;Version_RS5=10&amp;UpgEx_RS5=Green&amp;GStatus_RS5=2&amp;OSSkuId=48&amp;App=WU&amp;InstallDate=1529700913&amp;ProcessorManufacturer=GenuineIntel&amp;AppVer=10.0.17134.471&amp;OSArchitecture=AMD64&amp;UpdateManagementGroup=2&amp;IsDeviceRetailDemo=0&amp;HidOverGattReg=C%3A%5CWINDOWS%5CSystem32%5CDriverStore%5CFileRepository%5Chidbthle.inf_amd64_467f181075371c89%5CMicrosoft.Bluetooth.Profiles.HidOverGatt.dll&amp;IsFlightingEnabled=0&amp;DchuIntelGrfxExists=1&amp;TelemetryLevel=1&amp;DefaultUserRegion=244&amp;DeferFeatureUpdatePeriodInDays=365&amp;Bios=Unknown&amp;WuClientVer=10.0.17134.471&amp;PausedFeatureStatus=1&amp;Steam=URL%3Asteam%20protocol&amp;Free=8to16&amp;OSVersion=10.0.17134.472&amp;DeviceFamily=Windows.Desktop</deviceAttributes></GetExtendedUpdateInfo2></s:Body></s:Envelope>`
    
    const httpsAgent = new https.Agent({
        rejectUnauthorized: false,
    });

    const response = await fetch('https://fe3.delivery.mp.microsoft.com/ClientWebService/client.asmx/secured', {
        method: 'POST',
        agent: httpsAgent,
        body: reqBody,
        headers: {
            'Content-Type': 'application/soap+xml; charset=utf-8',
            'User-Agent': 'Windows-Update-Agent/10.0.10011.16384 Client-Protocol/1.81',
            'Origin': req.get('host'),
            'Host': req.get('host')
        }
    }).catch(err => err);

    if (response?.errno) {
        console.log(response)
        res.status(400).send(`
            <h1>Can't connect to Microsoft servers!</h1>
            <p>Try again in a few minutes.</p>
            Errno: ${response.errno}
        `)
        return
    }

    const data = await response.text();

    const dlUrl = data.match(/http:\/\/tlu.dl.delivery.mp.microsoft.com\/.*?(?=<\/Url>)/g);

    if (!dlUrl || !response.ok) {
        res.send(`
            <h1>Failed retrieving download link.</h1>
            <p>Either:</p>
            <ul>
                <li>You entered a wrong uuid.</li>
                <li>You're trying to download a beta/preview build.</li>
                <li>Can't connect to Microsoft servers.</li>
            </ul>
        `)
        return
    }

    res.send(`
        <meta http-equiv="Refresh" content="1; url='${dlUrl[0]}'" />
        If the download doesn't start, <a href="${dlUrl[0]}">"Right-click" here and "Save link as..."</a>
    `);

});

app.listen(3000)