// DECENTRALIZER 1.1.0
// Copyright 2018, 2019 by Salvador Herrera <keops_cc@outlook.com>
// Licensed under GPLv3


var fs = require('fs');
var sia = require('sia.js');
var http = require('request');
var https = require('https');
var axios = require('axios');
var table = require('table')
var Path = require('path')
var os = require('os')

// Passing arguments
var argument1 = process.argv[2]
if (argument1 == "-debug" || argument1 == "--debug" || argument1 == "-d") {
    // Debug mode
    var debugMode = true
    var argument1 = process.argv[3]
    var argument2 = process.argv[4]
    var argument3 = process.argv[5]
    var argument4 = process.argv[6]
} else {
    // Normal mode
    var debugMode = false
    var argument2 = process.argv[3]
    var argument3 = process.argv[4]
    var argument4 = process.argv[5]
}


console.log()
if (debugMode == false) {
    console.log('\x1b[44m%s\x1b[0m', "*** KEOPS DECENTRALIZER v1.1.0 ***")
} else {
    console.log('\x1b[44m%s\x1b[0m', "*** KEOPS DECENTRALIZER v1.1.0 (debug mode) ***")
}
console.log()


// Getting the API authentication key to use in the rest of the program
function apiPassword() {
    // Gets the Sia API Password from disk
    let configPath
    switch (process.platform) {
        case 'win32':
            configPath = Path.join(process.env.LOCALAPPDATA, 'Sia')
            break
        case 'darwin':
            configPath = Path.join(
                os.homedir(),
                'Library',
                'Application Support',
                'Sia'
            )
            break
        default:
            configPath = Path.join(os.homedir(), '.sia')
    }
    const pass = fs.readFileSync(Path.join(configPath, 'apipassword')).toString().trim()
    return pass || ''
}
if (debugMode == true) {console.log("// DEBUG - Collecting API password")}
var apiPassword = apiPassword()
if (debugMode == true) {console.log("// DEBUG - API password: " + apiPassword.slice(0,5) + "..." + apiPassword.slice((apiPassword.length-6), (apiPassword.length-1)))}
const basicAuth = `:${apiPassword}@${'localhost:9980'}`


// Directing to the proper function according to the user arguments
if (argument1 == "scan") {
    openSettingsFile()
} else if (argument1 == "remove") {
    removeContract(argument2)
} else if (argument1 == "view" && argument2 == "farms") {
    viewFarms()
} else if (argument1 == "view" && argument2 == "contracts") {
    viewContracts()
} else if (argument1 == "view" && argument2 == "hosts" && argument3 == "countries") {
    viewCountries()
} else if (argument1 == "view" && argument2 == "hosts" && argument3 == "versions") {
    viewVersions()
} else if (argument1 == "view" && argument2 == "hosts" && argument3 != "countries" && argument3 != "orderby" && argument3 != null) {
    viewHostsCountry(argument3)
} else if (argument1 == "view" && argument2 == "hosts" && (argument3 == null || argument3 == "orderby")) {
    viewHostsAll(argument3, argument4)
} else if (argument1 == "help") {
    help()
} else if (argument1 == "filter" && argument2 == null) {
    showList()
} else if (argument1 == "filter" && argument2 == "add" && argument3 != null && argument3 != "version" && argument3 != "score") {
    addList(argument3)
} else if (argument1 == "filter" && argument2 == "add" && argument3 == "version" && argument4 != null) {
    addVersion(argument4)
} else if (argument1 == "filter" && argument2 == "add" && argument3 == "score" && argument4 != null) {
    addScore(argument4)
} else if (argument1 == "filter" && argument2 == "remove" && argument3 != "score") {
    removeList(argument3)
} else if (argument1 == "filter" && argument2 == "remove" && argument3 == "score" && argument4 != null) {
    removeScore(argument4)
} else if (argument1 == "filter" && argument2 == "mode" && (argument3 == "disable" || argument3 == "whitelist" || argument3 == "blacklist")) {
    modeList(argument3)
} else if (argument1 == "filter" && argument2 == "farms") {
    filterFarms()
} else if (argument1 == "filter" && argument2 == "clear") {
    clearList()
} else if (argument1 == "filter" && argument2 == "apply") {
    applyList()
} else {
    console.log("Invalid syntax")
    help()
}

function help() {
    console.log("   * decentralizer scan --> Analyzes contracts and shows hosts belonging to hosting farms")
    console.log("   * decentralizer remove [x] --> Removes the host numbered 'x' (refer to the 'decentralizer view contracts') from your contracts")
    console.log("   * decentralizer remove auto --> Removes all but one of the duplicate hosts in a hosting farm")
    console.log("   * decentralizer view farms --> Shows the list of farms obtained on the last scan")
    console.log("   * decentralizer view contracts --> Shows the full list of contracts, obtained on the last scan")
    console.log("   * decentralizer view hosts --> Shows all hosts, ordered by rank")
    console.log("   * decentralizer view hosts countries --> Shows the list of country codes of hosts")
    console.log("   * decentralizer view hosts versions --> Shows the list of version numbers of hosts")
    console.log("   * decentralizer view hosts [country code] --> Shows the hosts in the specified country")
    console.log("   * decentralizer view hosts orderby [storage/upload/download/collateral/score] --> Shows all hosts, ordered by the indicated parameter")
    console.log("   * decentralizer filter --> Shows your Filter mode (blacklist, whitelist) and the hosts included on it")
    console.log("   * decentralizer filter add [hostID / country code] --> Adds the desired HostID or all the hosts in a country to the Filter")
    console.log("   * decentralizer filter add version [version] --> Adds to the filter all the hosts using the selected Sia version (e.g. 1.4.0)")
    console.log("   * decentralizer filter add score [score] --> Adds to the filter all the hosts with an specific SiaStats performance score (e.g. 9")
    console.log("   * decentralizer filter remove [y] --> Removes the host with FilterID 'y' (check it with 'filter show') from the Filter")
    console.log("   * decentralizer filter remove score [score] --> Removes from the filter any host with the specified SiaStats performance score (e.g. 9")
    console.log("   * decentralizer filter mode [disable/whitelist/blacklist] --> Changes the mode of the Filter that will be applied to the list of hosts")
    console.log("   * decentralizer filter clear --> Removes all the hosts from the Filter, and sets its mode to 'disable'")
    console.log("   * decentralizer filter farms --> On whitelist, removes hosts in farms from the Filter. On blacklist, adds them to the Filter")
    console.log("   * decentralizer filter apply --> Applies the Filter of hosts and the Filter mode (white/blacklist/disable) to Sia")
    console.log("   * decentralizer help --> Shows again all the possible commands")
    console.log()
}


function openSettingsFile() {
    // First, updating the settings file or creating a new one if it is the first syncing
    if (debugMode == true) {console.log("// DEBUG - Opening the settings file")}
    
    var timestamp = Date.now() // Timestamp

    // Opening settings file
    fs.readFile('databases/settings.json', 'utf8', function (err, data) { if (!err) { 
        if (debugMode == true) {console.log("// DEBUG - Found settings file, updating it")}

        var settings = JSON.parse(data)
        settings.lastsync = timestamp
        fs.writeFileSync('databases/settings.json', JSON.stringify(settings))

        siastatsGeolocFile()
    } else {
        // Initialize a settings file here
        if (debugMode == true) {console.log("// DEBUG - No settings file found. Creating a new one")}
        settings = {
            userLon: null,
            userLat: null,
            lastsync: timestamp,
            listMode: "disable"
        }
        fs.writeFileSync('databases/settings.json', JSON.stringify(settings))

        siastatsGeolocFile()
    }});
}


function siastatsGeolocFile() {
    // SiaStats JSON geolocation. If the file can't be downloaded, the local copy is used instead
    if (debugMode == true) {console.log("// DEBUG - Getting the SiaStats geolocation/scores API")}

    // Removing SSL authorization for this specific API call
    var agent = new https.Agent({  
        rejectUnauthorized: false
    });

    axios.get('https://siastats.info:3510/hosts-api/decentralizer/sia', { httpsAgent: agent }).then(response => {
        var siastatsGeoloc = response.data
        console.log("Downloaded " + siastatsGeoloc.length + " hosts geolocation and score from SiaStats.info");

        // Saving the file
        fs.writeFileSync('databases/hosts_geoloc.json', JSON.stringify(siastatsGeoloc))

        siastatsFarmsFile(siastatsGeoloc)
    }).catch(error => {
        if (debugMode == true) {console.log("// DEBUG - Could not download SiaStats API. Reading local file instead. Error: \n" + error)}
        fs.readFile('databases/hosts_geoloc.json', 'utf8', function (err, data) { if (!err) { 
            siastatsGeoloc = JSON.parse(data);
            console.log("The hosts geolocation file could not be fetched from SiaStats.info. Using a local copy instead")
            siastatsFarmsFile(siastatsGeoloc)
        } else {
            console.log("ERROR - The software can't find locally, or download, necessary databases. Try re-installing Decentralizer or connecting to the Internet")
        }});
    });
}


function siastatsFarmsFile(siastatsGeoloc) {
    // SiaStats JSON geolocation. If the file can't be downloaded, the local copy is used instead
    if (debugMode == true) {console.log("// DEBUG - Getting the SiaStats farms API")}

    axios.get('https://siastats.info/dbs/farms_api.json').then(response => {
        var siastatsFarms = response.data
        console.log("Downloaded data from " + siastatsFarms.length + " farms from SiaStats.info");

        // Saving the file
        fs.writeFileSync('databases/farms_definition.json', JSON.stringify(siastatsFarms))

        siaHosts(siastatsGeoloc, siastatsFarms)
    }).catch(error => {
        if (debugMode == true) {console.log("// DEBUG - Could not download SiaStats API. Reading local file instead. Error: \n" + error)}
        fs.readFile('databases/farms_definition.json', 'utf8', function (err, data) { if (!err) { 
            siastatsFarms = JSON.parse(data);
            console.log("The farms definition file could not be fetched from SiaStats.info. Using a local copy instead")
            siaHosts(siastatsGeoloc, siastatsFarms)
        } else {
            console.log("ERROR - The software can't find locally, or download, necessary databases. Try re-installing Decentralizer or connecting to the Internet")
        }});
    });
}


function siaHosts(siastatsGeoloc, siastatsFarms) {
    // Requesting active hosts with an API call:
    console.log("Retreiving your hosts list from Sia")
    sia.connect('localhost:9980')
    .then((siad) => {siad.call('/hostdb/all')
        .then((hosts) => {
            var allHosts = hosts.hosts
            // Filtering only the active and accepting contracts. If I was using the /hostdb/active, it would show less hosts after applying a filter
            var active = []
            for (var i = 0; i < allHosts.length; i++) {
                if (allHosts[i].scanhistory[allHosts[i].scanhistory.length-1].success == true
                    && allHosts[i].acceptingcontracts == true) {
                    active.push(allHosts[i])
                }
            }
            var hostNum = 0
            if (debugMode == true) {console.log("// DEBUG - Iterating hostdb/hosts/ Sia calls for each host")}
            hostsScore(siastatsGeoloc, siastatsFarms, active, hostNum)
        })
        .catch((err) => {
            console.log("Error retrieving data from Sia. Is Sia working, synced and connected to internet? Try this script again after restarting Sia.")
            if (debugMode == true) {console.log("// DEBUG - Error: \n" + err)}
            console.log()
        })
    })
    .catch((err) => {
        console.log("Error connecting to Sia. Start the Sia app (either daemon or UI) and try again")
        console.log()
        if (debugMode == true) {console.log("// DEBUG - Error: \n" + err)}
    })
}


function hostsScore(siastatsGeoloc, siastatsFarms, active, hostNum) {
    // Iterates on each host to collect from Sia the score of the host
    if (hostNum < active.length) {
        sia.connect('localhost:9980')
        .then((siad) => {siad.call('/hostdb/hosts/' + active[hostNum].publickeystring)
            .then((host) => {
                var score = host.scorebreakdown.conversionrate
                active[hostNum].score = score
                hostNum++
                process.stdout.clearLine();  // clear current text
                process.stdout.cursorTo(0);  // move cursor to beginning of line
                process.stdout.write("(" + hostNum + "/" + active.length + ") - " + active[hostNum-1].netaddress)
                hostsScore(siastatsGeoloc, siastatsFarms, active, hostNum)
            })
            .catch((err) => {
                console.log("Error retrieving data from Sia. Is Sia working, synced and connected to internet? Try this script again after restarting Sia.")
                if (debugMode == true) {console.log("// DEBUG - Error on host " + active[hostNum].publickeystring + ": \n" + err)}
                console.log()
            })
        })
        .catch((err) => {
            console.log("Error connecting to Sia. Start the Sia app (either daemon or UI) and try again")
            if (debugMode == true) {console.log("// DEBUG - Error on host " + active[hostNum].publickeystring + ": \n" + err)}
            console.log()
        })

    } else {
        // We are done. Move to the next step
        process.stdout.clearLine();  // clear current text
        console.log()
        if (debugMode == true) {console.log("// DEBUG - Host data collection done")}
        
        // Arranges the hosts array by score
        function compare(a,b) {
            if (a.score < b.score)
                return -1;
            if (a.score > b.score)
                return 1;
            return 0;
        }
        active.sort(compare);

        hostsProcessing(siastatsGeoloc, siastatsFarms, active)
    }
}


function hostsProcessing(siastatsGeoloc, siastatsFarms, hostdb) {
    if (debugMode == true) {console.log("// DEBUG - Starting hostsProcessing() function")}
    // Assigns IPs to the hostdb and determines the hosts that need additional geolocation
    hostsToGeoloc = [] // Entries numbers that need to be geolocated locally by Decentralizer
    for (var i = 0; i < hostdb.length; i++) { // For each host
        var matchBool = false
        for (var j = 0; j < siastatsGeoloc.length; j++) { // For each geolocation in list
            if (hostdb[i].publickeystring == siastatsGeoloc[j].pubkey) {
                // Match, update hostdb entry
                matchBool = true
                hostdb[i].lon = siastatsGeoloc[j].lon
                hostdb[i].lat = siastatsGeoloc[j].lat
                hostdb[i].countryName = siastatsGeoloc[j].countryName
                hostdb[i].countryCode = siastatsGeoloc[j].countryCode
                hostdb[i].siastatsScore = siastatsGeoloc[j].siastatsScore

                // We update the geoloc file with the pubkey in the non-hex format, as it will be lated needed for the contracts identification
                siastatsGeoloc[j].pubkey2 = hostdb[i].publickey.key 
            }
        }
        if (matchBool == false) {
            // If no match, add to the list
            hostsToGeoloc.push(i)
            
            hostdb[i].siastatsScore = 0 // Adding a 0 in the score
        }
    }

    console.log("Number of additional hosts to be geolocated: " + hostsToGeoloc.length + "\n")
    if (hostsToGeoloc.length > 0) {
        var i = 0
        requestIP(siastatsFarms, hostdb, hostsToGeoloc, i, siastatsGeoloc)
    } else {
        // No additional host to geolocate, save and proceed to next step
        if (debugMode == true) {console.log("// DEBUG - No additional host to geolocate. Moving to compareOldDb()")}
        compareOldDb(hostdb, siastatsFarms, siastatsGeoloc)
    }
}


function requestIP(siastatsFarms, hostdb, hostsToGeoloc, i, siastatsGeoloc) {
    
    // Triming the ":port" from the host IP
    var hostip = hostdb[hostsToGeoloc[i]].netaddress
    var s = hostip.search(":")
    var totrim = hostip.length - s
    trimedip = hostip.slice(0, -totrim)
        
    // Requesting the geolocation of the host
    var ipquery = "http://ip-api.com/json/" + trimedip
    axios.get(ipquery).then(response => {
        var ipAPI = response.data
        var lat = parseFloat(ipAPI.lat)
        var lon = parseFloat(ipAPI.lon)
        process.stdout.clearLine();  // clear current text
        process.stdout.cursorTo(0);  // move cursor to beginning of line
        process.stdout.write("(" + (i+1) + "/" + hostsToGeoloc.length + ") - " + hostip)

        hostdb[hostsToGeoloc[i]].lon = lon
        hostdb[hostsToGeoloc[i]].lat = lat
        hostdb[hostsToGeoloc[i]].as = ipAPI.as // Also adding the ISP
        hostdb[hostsToGeoloc[i]].countryName = ipAPI.country // Also adding the ISP
        hostdb[hostsToGeoloc[i]].countryCode = ipAPI.countryCode // Also adding the ISP
        nextIP(siastatsFarms, hostdb, hostsToGeoloc, i, siastatsGeoloc)

    }).catch(error => {
        // On failed IP request, move to the next IP
        console.log(hostip + " - Failed")
        if (debugMode == true) {console.log("// DEBUG - Error (non-critical): \n" + error)}
        nextIP(siastatsFarms, hostdb, hostsToGeoloc, i, siastatsGeoloc)
    })
}

function nextIP(siastatsFarms, hostdb, hostsToGeoloc, i, siastatsGeoloc) {
    setTimeout(function(){ // 500ms cooldown, to avoid being banned by ip-api.com
        i++
        if (i < hostsToGeoloc.length) {
            requestIP(siastatsFarms, hostdb, hostsToGeoloc, i, siastatsGeoloc)
        } else {
            console.log("\nGeolocation task done!\n")

            compareOldDb(hostdb, siastatsFarms, siastatsGeoloc)
        }
    }, 500);
}

function compareOldDb(hostdb, siastatsFarms, siastatsGeoloc) {
    // Opening the hosts file to re-add the "onlist" value (hosts added to the Filter)
    if (debugMode == true) {console.log("// DEBUG - compareOldDb(): reading hosts.json and updating it")}
    fs.readFile('databases/hosts.json', 'utf8', function (err, data) { if (!err) { 
        oldHosts = JSON.parse(data);

        for (var i = 0; i < hostdb.length; i++) {
            for (var j = 0; j < oldHosts.length; j++) {
                if (hostdb[i].publickey.key == oldHosts[j].publickey.key) { // Match of hosts
                    if (oldHosts[j].onList == true) {
                        // Add the boolean to the new hostdb
                        hostdb[i].onList = true
                    }
                }
            }
        }
        
        // Saving the file
        fs.writeFileSync('databases/hosts.json', JSON.stringify(hostdb))

        // Next
        siaContracts(siastatsFarms, siastatsGeoloc)
        
    } else {
        // If no file was found, it is the first scanning: just proceed
        if (debugMode == true) {console.log("// DEBUG - No previous hosts.json file. Creating new")}
        fs.writeFileSync('databases/hosts.json', JSON.stringify(hostdb))
        siaContracts(siastatsFarms, siastatsGeoloc)
    }});
}


function siaContracts(siastatsFarms, siastatsGeoloc) {
    // Requesting the contracts list with an API call:
    console.log("Retreiving contracts list from Sia")
    sia.connect('localhost:9980')
    .then((siad) => {siad.call('/renter/contracts')
        .then((contractsAPI) => {
            if (debugMode == true) {console.log("// DEBUG - /renter/contracts call succedded")}
            var contracts = contractsAPI.contracts

            if (contracts.length == 0) {
                console.log("ERROR: You don't have currently any active contract. Set an allowance first in Sia")
                console.log()
            } else {
                // Considering only the contracts good for upload and good for renew, this is, active
                // (sia returns active and inactive all together)
                var activeContracts = []
                for (var i = 0; i < contracts.length; i++) {
                    if (contracts[i].goodforupload == false && contracts[i].goodforrenew == false) {
                        // Inactive contract, do not consider further
                    } else {
                        activeContracts.push(contracts[i])
                    }
                }

                console.log("Checking IPs of " + activeContracts.length + " active contracts")
                contractsIpAssign(siastatsFarms, activeContracts, siastatsGeoloc)
            }

        })
        .catch((err) => {
            console.log("Error retrieving data from Sia. Is Sia working, synced and connected to internet? Try this script again after restarting Sia.")
            if (debugMode == true) {console.log("// DEBUG - Error: " + err)}
            console.log()
        })
    })
    .catch((err) => {
        console.log("Error connecting to Sia. Start the Sia app (either daemon or UI) and try again")
        if (debugMode == true) {console.log("// DEBUG - Error: " + err)}
        console.log()
    })
}


function contractsIpAssign(siastatsFarms, contracts, siastatsGeoloc) {
    // Assigns IPs to the contracts and determines the hosts that need additional geolocation
    if (debugMode == true) {console.log("// DEBUG - contractsIPAssign(): adding geolocation/score data to hosts")}

    contractsToGeoloc = [] // Entries numbers that need to be geolocated locally by Decentralizer
    for (var i = 0; i < contracts.length; i++) { // For each contract
        var matchBool = false
        for (var j = 0; j < siastatsGeoloc.length; j++) { // For each geolocation in list
            if (contracts[i].hostpublickey.key == siastatsGeoloc[j].pubkey2) {
                // Match, update hostdb entry
                matchBool = true
                contracts[i].lon = siastatsGeoloc[j].lon
                contracts[i].lat = siastatsGeoloc[j].lat
                contracts[i].as = siastatsGeoloc[j].as
                contracts[i].countryName = siastatsGeoloc[j].countryName
                contracts[i].siastatsScore = siastatsGeoloc[j].siastatsScore
            }
        }
        if (matchBool == false) {
            // If no match, add to the list
            contractsToGeoloc.push(i)

            contracts[i].siastatsScore = 0 // 0 score, as it is not on the database
        }
    }

    console.log("Number of additional contracts to be geolocated: " + contractsToGeoloc.length + "\n")
    if (contractsToGeoloc.length > 0) {
        var i = 0
        requestContractIP(siastatsFarms, contracts, contractsToGeoloc, i)
    } else {
        // No additional host to geolocate, save and proceed to next step
        if (debugMode == true) {console.log("// DEBUG - No geolocation necessary, saving contracts.json")}
        fs.writeFileSync('databases/contracts.json', JSON.stringify(contracts))
        processHosts(siastatsFarms, contracts)
    }
}


function requestContractIP(siastatsFarms, contracts, contractsToGeoloc, i) {
    
    // Triming the ":port" from the host IP
    var hostip = contracts[contractsToGeoloc[i]].netaddress
    var s = hostip.search(":")
    var totrim = hostip.length - s
    trimedip = hostip.slice(0, -totrim)
        
    // Requesting the geolocation of the host
    var ipquery = "http://ip-api.com/json/" + trimedip
    axios.get(ipquery).then(response => {
        var ipAPI = response.data

        var lat = parseFloat(ipAPI.lat)
        var lon = parseFloat(ipAPI.lon)
        process.stdout.clearLine();  // clear current text
        process.stdout.cursorTo(0);  // move cursor to beginning of line
        process.stdout.write("(" + (i+1) + "/" + contractsToGeoloc.length + ") - " + hostip)

        contracts[contractsToGeoloc[i]].lon = lon
        contracts[contractsToGeoloc[i]].lat = lat
        contracts[contractsToGeoloc[i]].as = ipAPI.as // Also adding the ISP
        contracts[contractsToGeoloc[i]].countryName = ipAPI.country // Also adding the ISP
        contracts[contractsToGeoloc[i]].countryCode = ipAPI.countryCode // Also adding the ISP
        nextContractIP(siastatsFarms, contracts, contractsToGeoloc, i)

    }).catch(error => {
        // On failed IP request, move to the next IP
        console.log(hostip + " - Failed")
        if (debugMode == true) {console.log("// DEBUG - Error: " + error)}
        nextContractIP(siastatsFarms, contracts, contractsToGeoloc, i)
    })
}

function nextContractIP(siastatsFarms, contracts, contractsToGeoloc, i) {
    setTimeout(function(){ // 500ms cooldown, to avoid being banned by ip-api.com
        i++
        if (i < contractsToGeoloc.length) {
            requestContractIP(siastatsFarms, contracts, contractsToGeoloc, i)
        } else {
            console.log("\nGeolocation task done!\n")

            // Saving the file
            fs.writeFileSync('databases/contracts.json', JSON.stringify(contracts))

            // Next
            processHosts(siastatsFarms, contracts)
        }
    }, 500);
}


function processHosts(siastatsFarms, contracts) {
    if (debugMode == true) {console.log("// DEBUG - processHosts() function")}
    console.log("Detecting hosting farms among contracts")

    // Finding centralized farms
    var hostsGroups = []
    for (var i = 0; i < contracts.length; i++) { // For each contract
        var hostInGroupBool = false
        for (var j = 0; j < hostsGroups.length; j++) {
            if (contracts[i].lat == hostsGroups[j][0].lat && contracts[i].lon == hostsGroups[j][0].lon && contracts[i].as == hostsGroups[j][0].as) { // Checking if geolocation is the same as the first element in a group. Has to match the ISP too
                hostsGroups[j].push(contracts[i]) // Add host to the group
                hostInGroupBool = true
                //console.log("New farm member identified")
                contracts[i].assigned = true // Flag that the contract has been already included in a farm
            }
        }
        if (hostInGroupBool == false) {
            contracts[i].assigned = true // Flag that the contract has been already included in a farm
            var newGroup = [contracts[i]]
            hostsGroups.push(newGroup) // Add a new group
        }
    }


    // Rearranging the array
    var farmNumber = 1
    var farmList = [{ // Initializing array
        farm: "Other hosts",
        hosts: []
    },{
        farm: "Geolocation unavailable",
        hosts: []
    }]
    for (var j = 0; j < hostsGroups.length; j++) {
        if (hostsGroups[j].length > 1) { // Only groups with more than one member: hosting farms
            var farmEntry = {
                farm: "User-identified farm #U-" + (farmNumber),
                hosts: []
            }
            for (var k = 0; k < hostsGroups[j].length; k++) {
                var hostEntry = {
                    ip: hostsGroups[j][k].netaddress,
                    contract: hostsGroups[j][k].id,
                    cost: parseFloat((hostsGroups[j][k].totalcost/1000000000000000000000000).toFixed(2)),
                    data: parseFloat((hostsGroups[j][k].size/1000000000).toFixed(2)), // In GB
                    pubkey: hostsGroups[j][k].hostpublickey.key,
                    siastatsScore: hostsGroups[j][k].siastatsScore
                }
                farmEntry.hosts.push(hostEntry)
            }
            // Arrange the hosts by stored data
            function compare(a,b) {
                if (a.data < b.data)
                    return 1;
                if (a.data > b.data)
                    return -1;
                return 0;
            }
            farmEntry.hosts.sort(compare);
            
            // Push data
            if (hostsGroups[j][0].lat > 0 || hostsGroups[j][0].lat < 0) { // Geolocation is a number
                farmList.push(farmEntry)
                farmNumber++
            } else { // Geolocation unavailable host group
                // consider these hosts unassigned, as we may have better chances of assigning them later checking with SiaStats
                for (var p = 0; p < farmEntry.hosts.length; p++) {
                    farmEntry.hosts[p].assigned = false
                }
                
                // Replace element 1 by this
                farmList[1].hosts = farmEntry.hosts
            }
            
        
        } else { // Individual hosts
            var hostEntry = {
                ip: hostsGroups[j][0].netaddress,
                contract: hostsGroups[j][0].id,
                cost: parseFloat((hostsGroups[j][0].totalcost/1000000000000000000000000).toFixed(2)),
                data: parseFloat((hostsGroups[j][0].size/1000000000).toFixed(2)), // In GB
                pubkey: hostsGroups[j][0].hostpublickey.key,
                siastatsScore: hostsGroups[j][0].siastatsScore
            }
            // Pushing it to the element 0 of farmList, the "Other hosts"
            farmList[0].hosts.push(hostEntry)
        }
    }

    siastatsProcess(farmList, contracts, siastatsFarms)
}


function siastatsProcess(farmList, contracts, siastatsFarms) {
    // This function compares our farmList with the list of siastats farms, to add the remaining farm-positive contracts to farmList
    if (debugMode == true) {console.log("// DEBUG - siastatsProcess() function: comparing farms list to data from SiaStats")}

    // A - Create a temporal array where we add contracts not yet assigned, and belonging to farms, to groups
    // Iterate on the list of farms, on each host of it
    var extraGroups = []
    for (var j = 0; j < siastatsFarms.length; j++) {
        extraGroups.push({ // Adding an empty sub-array. We will fill it with contracts if positive for a farm
            farm: siastatsFarms[j].farm,
            hosts: []
        })

        // Adding the Alert flag if the farms is dangerous
        if (siastatsFarms[j].alert == true) {
            extraGroups[extraGroups.length-1].alert = true
            extraGroups[extraGroups.length-1].message = siastatsFarms[j].message
        }

        for (var k = 0; k < siastatsFarms[j].hosts.length; k++) {
            // Iterate on the list of contracts not yet assigned to a farm
            for (var i = 0; i< contracts.length; i++) {
                if (contracts[i].assigned != true && siastatsFarms[j].hosts[k].pubkey == contracts[i].hostpublickey.key){ // Match of public keys: the host is in a farm!
                    extraGroups[j].hosts.push(contracts[i])
                }
            }
        }
    }
    
    // B - Assign these groups to farms already identified (farmsList). Add a flag about SiaStats
    // Iterate on the farmList to find matches with the siaStats database. If a match, we will iterate on extraGroups and add hosts if they match the farm ID
    for (var i = 0; i < farmList.length; i++) {
        for (var j = 0; j < farmList[i].hosts.length; j++) {

            // Iterating on siastatsFarms
            for (var k = 0; k < siastatsFarms.length; k++) {
                for (l = 0; l < siastatsFarms[k].hosts.length; l++) {
                    if (farmList[i].hosts[j].pubkey == siastatsFarms[k].hosts[l].pubkey) { // Matched farm
                        
                        // Now we iterate on our newGroups array, to find the one carrying the .farm property that matches
                        for (var m = 0; m < extraGroups.length; m++) {
                            if (extraGroups[m].farm == siastatsFarms[k].farm) { // Match!
                                
                                // B1 - Assign the hosts of the group to the farm list
                                for (var n = 0; n < extraGroups[m].hosts.length; n++) {
                                    farmList[i].hosts.push({
                                        ip: extraGroups[m].hosts[n].netaddress,
                                        contract: extraGroups[m].hosts[n].id,
                                        cost: parseFloat((extraGroups[m].hosts[n].totalcost/1000000000000000000000000).toFixed(2)),
                                        data: parseFloat((extraGroups[m].hosts[n].size/1000000000).toFixed(2)), // In GB
                                        siastatsFlag: true, // Add the flag to the latest host of that farm (the one we just pushed)
                                        siastatsScore: extraGroups[m].hosts[n].siastatsScore
                                    })
                                }

                                // Adding an alert if the group carries it
                                if (extraGroups[m].alert == true) {
                                    farmList[farmList.length-1].alert = true
                                    farmList[farmList.length-1].message = extraGroups[m].message
                                }

                                // B2 - Remove the group from extraGroups
                                extraGroups.splice(m, 1)

                                // B3 - Renaming the farm name to keep consistency with SiaStats
                                farmList[i].farm = "SiaStats ID-" + siastatsFarms[k].farm
                            }
                        }
                    }
                }
            }
        }
    }

    // C - Push unassigned groupd with 2+ contracts to a new farm
    for (var i = 0; i < extraGroups.length; i++) {
        if (extraGroups[i].hosts.length >= 2) {
            // Initializing new entry
            newEntry = {
                farm: "SiaStats ID-" + extraGroups[i].farm,
                hosts: []
            }
            for (var j = 0; j < extraGroups[i].hosts.length; j++) { // For each host in the group
                newEntry.hosts.push({
                    ip: extraGroups[i].hosts[j].netaddress,
                    contract: extraGroups[i].hosts[j].id,
                    cost: parseFloat((extraGroups[i].hosts[j].totalcost/1000000000000000000000000).toFixed(2)),
                    data: parseFloat((extraGroups[i].hosts[j].size/1000000000).toFixed(2)), // In GB
                    siastatsScore: extraGroups[m].hosts[n].siastatsScore
                })

                // Adding an alert if the groups carries it
                if (extraGroups[i].alert == true) {
                    newEntry[newEntry.length-1].alert = true
                    newEntry[newEntry.length-1].message = extraGroups[i].message
                }
            }

            farmList.push(newEntry)
        }
    }

    // D - Correcting group names
    farmList[0].farm = "Non-farms"
    farmList[1].farm = "Geolocation unavailable"


    // Saving the farms file
    if (debugMode == true) {console.log("// DEBUG - siastatsProcess() done. Saving farms.json")}
    fs.writeFileSync('databases/farms.json', JSON.stringify(farmList))

    showFarms(farmList)
}


function showFarms(farmList) {
    if (debugMode == true) {console.log("// DEBUG - showFarms(): Showing the results")}
    let data, output;

    if (farmList.length <= 2) {
        data = [["No host farms have been found in your contracts list"]]
        output = table.table(data);
        console.log(output);
    
    } else {
        // Table headers
        data = [["Farm", "Contract #", "IP", "Value", "Data", "Alerts"]]

        var listNumber = 1
        for (var i = 1; i < farmList.length; i++) { // Each farm
            if (farmList[i].hosts.length > 0) { // For not displaying the not geolocated if there is no host in this category
                for (var j = 0; j < farmList[i].hosts.length; j++) { // Each host
                    
                    if (farmList[i].alert == true) { // Add a special labelling for hosts identified by SiaStats as dangerous
                        data.push(["", listNumber, "[*]" + farmList[i].hosts[j].ip, farmList[i].hosts[j].cost + "SC", farmList[i].hosts[j].data + "GB", "Alert: " + farmList[i].message])
                        listNumber++
                    } else {
                        data.push(["", listNumber, farmList[i].hosts[j].ip, farmList[i].hosts[j].cost + "SC", farmList[i].hosts[j].data + "GB", ""])
                        listNumber++
                    }
                    
                    // Farm name only in first entry
                    if (j == 0) {
                        data[data.length-1][0] = farmList[i].farm
                    }
                }
            }
        }
        
        config = {
            columns: {
                5: {
                    width: 20,
                    wrapWord: true
                }
            }
        };

        output = table.table(data, config);
        console.log(output);
        console.log("Use 'decentralizer remove auto' to remove all the hosts in farms (and those not geolocated) with the exception of the top one, or "
            + "'decentralizer remove x' for manually removing a contract, where x is the shown Contract#")
    }
    console.log()
}




/////////////////////////////////////////////////////
// CONTRACT REMOVAL

function removeContract(argument2) {
    if (debugMode == true) {console.log("// DEBUG - Removing contract: " + argument2)}
    if (argument2 > 0 || argument2 == "auto") {
        
        // Open "farms.json" file
        fs.readFile('databases/farms.json', 'utf8', function (err, data) { if (!err) { 
            farmList = JSON.parse(data);

            var contractsToRemove = []
            var hostCount = 1 // Start in 1 the counting
            // A) Starts checking the number in the farms:
            for (var i = 1; i < farmList.length; i++) { // Starts in 1, as "1" is the other hosts
                for (var j = 0; j < farmList[i].hosts.length; j++) {
                    if (j != 0 && argument2 == "auto") { // If auto mode and it is not the top host of the farm, add it
                        contractsToRemove.push({
                            ip: farmList[i].hosts[j].ip,
                            contract: farmList[i].hosts[j].contract
                        })
                    } else if (argument2 == hostCount) { // If manual mode, if the number is a match add it
                        contractsToRemove.push({
                            ip: farmList[i].hosts[j].ip,
                            contract: farmList[i].hosts[j].contract
                        })
                    }
                    hostCount++
                }
            }
            // B) Next we check the non farms (number above represent no-farms)
            for (var j = 0; j < farmList[0].hosts.length; j++) {
                if (argument2 == hostCount) {
                    contractsToRemove.push({
                        ip: farmList[0].hosts[j].ip,
                        contract: farmList[0].hosts[j].contract
                    })
                }
                hostCount++
            }

            if (contractsToRemove.length == 1) {
                console.log("This will remove the contract with host: " + contractsToRemove[0].ip + " - Proceed? (y/n)")
            } else if (contractsToRemove.length == 0) {
                console.log("No contracts to be removed with the selected parameters")
                console.log()
            } else {
                console.log("This will remove " + contractsToRemove.length + " contracts with hosts. Proceed? (y/n)")
            }

            if (contractsToRemove.length > 0) {
                // Input form for confirmation
                var stdin = process.stdin;
                stdin.setRawMode( true );
                stdin.resume();
                stdin.setEncoding( 'utf8' );
                stdin.on( 'data', function( key ){
                    if ( key === '\u0003' ) { // ctrl-c
                        process.exit();
                    } else if (key === 'y') {
                        var contractNum = 0
                        var attempt = 0
                        cancelContract(contractNum, contractsToRemove, attempt)
                    } else if (key === 'n') {
                        console.log()
                        process.exit();
                    }
                    //process.stdout.write( key );
                });
            }

        } else {
            console.log("Error: Decentralizer needs to scan the contracts first. Run first 'decentralizer scan'")
            if (debugMode == true) {console.log("// DEBUG - Error: " + err)}
        }});

    } else {
        // Error
        console.log("Invalid syntax")
        help()
    }
}



function cancelContract(contractNum, contractsToRemove, attempt) {
    // Iterates on contractsToRemove canceling the contract
    if (debugMode == true) {console.log("// DEBUG - cancelContract() function: " + contractsToRemove[contractNum].contract)}
    process.stdout.write("\n(" + (contractNum+1) + "/" + contractsToRemove.length + ") Canceling contract with host: " + contractsToRemove[contractNum].ip + " ...")

    // Sia call parameters
    var url = "/renter/contract/cancel"
    var qs = {
        id: contractsToRemove[contractNum].contract,
    }
    
    // Sia call
    sia.call(basicAuth, {
        url: url,
        method: "POST",
        qs: qs
    })
    .then((API) => {
        process.stdout.write(" Success")
        attempt = 0
        contractNum++
        if (contractNum < contractsToRemove.length) {
            cancelContract(contractNum, contractsToRemove, attempt)
        } else {
            // End script
            console.log("")
            console.log("\nALL SELECTED CONTRACTS REMOVED")
            console.log("After removing all the desired hosts, it is recommended to run the 'scan' command again for confirmation")
            console.log("")
            // Finishes the process
            process.exit();
        }
    })
    .catch((err) => {
        attempt++
        process.stdout.write(" RETRYING")
        if (debugMode == true) {console.log("// DEBUG - Error: " + err)}
        if (attempt > 3) {
            console.log("\nError with command. This contract was not canceled: " + contractsToRemove[contractNum].ip)
            contractNum++
            if (contractNum < contractsToRemove.length) {
                cancelContract(contractNum, contractsToRemove, attempt)
            } else {
                console.log()
                process.exit();
            }
        } else { // Retry up to 3 times
            cancelContract(contractNum, contractsToRemove, attempt)
        }
    })
}



//////////////////////
// VIEW ENDPOINTS

function viewFarms() {
    // Show farms endpoint
    fs.readFile('databases/farms.json', 'utf8', function (err, data) { if (!err) { 
        farmList = JSON.parse(data);
        showFarms(farmList)
    } else {
        console.log('ERROR - The farms file could not be fetched. Run the "decentralizer scan" command first')
        console.log()
    }});
}


function viewContracts() {
    // Show all contracts endpoint
    fs.readFile('databases/farms.json', 'utf8', function (err, data) { if (!err) { 
        farmList = JSON.parse(data);
        
        // Table headers
        data = [["Contract #", "IP", "Value", "Data", "SiaStats Score", "Is a farm", "Alerts"]]

            var listNumber = 1
            // First those in farms, to keep compatibility of contract#
            for (var i = 1; i < farmList.length; i++) { // Each farm
                if (farmList[i].hosts.length > 0) { // For not displaying the not geolocated if there is no host in this category
                    for (var j = 0; j < farmList[i].hosts.length; j++) { // Each host
                        // SiaStats score representation
                        if (farmList[i].hosts[j].siastatsScore > 0) {
                            var score = '\x1b[42m ' + farmList[i].hosts[j].siastatsScore + ' \x1b[0m'
                        } else {
                            var score = '\x1b[41m ' + farmList[i].hosts[j].siastatsScore + ' \x1b[0m'
                        }

                        // SiaStats alert representation
                        if (farmList[i].message != null) {
                            alert = "*"
                        } else {
                            alert = ""
                        }

                        data.push([
                            listNumber, 
                            farmList[i].hosts[j].ip, 
                            farmList[i].hosts[j].cost + "SC", 
                            farmList[i].hosts[j].data + "GB",
                            score,
                            "*", 
                            alert
                        ])
                        listNumber++
                    }
                }
            }

            // Next the no-farms
            for (var j = 0; j < farmList[0].hosts.length; j++) { // Each host
                // SiaStats score representation
                if (farmList[0].hosts[j].siastatsScore > 0) {
                    var score = '\x1b[42m ' + farmList[0].hosts[j].siastatsScore + ' \x1b[0m'
                } else {
                    var score = '\x1b[41m ' + farmList[0].hosts[j].siastatsScore + ' \x1b[0m'
                }

                data.push([
                    listNumber, 
                    farmList[0].hosts[j].ip, 
                    farmList[0].hosts[j].cost + "SC", 
                    farmList[0].hosts[j].data + "GB",
                    score,
                    "", 
                    "",
                ])
                listNumber++
            }

            var output = table.table(data);
            console.log(output);
            console.log("Use 'decentralizer view farms' to check details about the host farms in your contract list")
            console.log("Use 'decentralizer remove auto' to remove all the hosts in farms (and those not geolocated) with the exception of the top one, or "
                + "'decentralizer remove x' for manually removing a contract, where x is the shown Contract#")
        
        console.log()
        

    } else {
        console.log('ERROR - The farms file could not be fetched. Run the "decentralizer scan" command first')
        console.log()
    }});
}


function viewCountries() {
    // Displays a list of countries with hosts

    // Open file
    fs.readFile('databases/hosts.json', 'utf8', function (err, data) { if (!err) { 
        hosts = JSON.parse(data);

        // Initializing, with European Union empty
        var countries = [ 
            {
                countryName: "European Union",
                countryCode: "EU",
                hosts: 0
            }
        ]

        // Iterating hosts
        for (var i = 0; i < hosts.length; i++) {
            var countryMatch = false
            for (var j = 0; j < countries.length; j++) {
                if (hosts[i].countryCode == countries[j].countryCode) {
                    countryMatch = true
                    countries[j].hosts++
                }
            }
            if (countryMatch == false) {
                // Create new entry on array
                countries.push({
                    countryName: hosts[i].countryName,
                    countryCode: hosts[i].countryCode,
                    hosts: 1
                })
            }
            // Adding to the EU
            var c = hosts[i].countryCode
            if (c == "BE" || c == "BG" || c == "CZ" || c == "DK" || c == "DE" || c == "EE" || c == "IE" || c == "EL" || c == "ES" || c == "FR" ||
                c == "HR" || c == "IT" || c == "CY" || c == "LV" || c == "LT" || c == "LU" || c == "HU" || c == "MT" || c == "NL" || c == "AT" ||
                c == "PL" || c == "PT" || c == "RO" || c == "SI" || c == "SK" || c == "FI" || c == "SE" || c == "GB" || c == "LI" || c == "IS" ||
                c == "NO") {
                    countries[0].hosts++
            }
        }

        // Sorting by number of hosts
        function compare(a,b) {
            if (a.hosts < b.hosts)
                return 1;
            if (a.hosts > b.hosts)
                return -1;
            return 0;
        }
        countries.sort(compare);

        // Displaying table
        data = [["Country name", "Country code", "Number of hosts"]]
        for (var i = 0; i < countries.length; i++) {
            // Correcting data of not geolocated hosts
            if (countries[i].countryName == null) {
                countries[i].countryName = "UNKNOWN"
                countries[i].countryCode = "XX"
            }

            // Adding to table
            data.push([
                countries[i].countryName,
                countries[i].countryCode,
                countries[i].hosts
            ])
        }
        output = table.table(data);
        console.log(output);

    } else {
        console.log('ERROR - The hosts file could not be fetched. Run the "decentralizer scan" command first')
        console.log()
    }});

}


function viewHostsCountry(country) {
    // Displays hosts in a country

    // Make country uppercase
    var country = country.toUpperCase();

    // Make "XX" a null (unknown geolocation)
    if (country == "XX") {country = null}

    // Open file
    fs.readFile('databases/hosts.json', 'utf8', function (err, data) { if (!err) { 
        hosts = JSON.parse(data);

        // Table header
        data = [["Country code", "Host #", "Host IP", "Storage price per TB/mo", "Upload per TB", "Download per TB", "Collateral ratio", "Rank", "SiaStats score", "On Filter"]]

        // Iterating the list of hosts
        for (var i = 0; i < hosts.length; i++) {
            var addHost = false
            if (country == "EU") {
                // European Union
                var c = hosts[i].countryCode 
                if (c == "BE" || c == "BG" || c == "CZ" || c == "DK" || c == "DE" || c == "EE" || c == "IE" || c == "EL" || c == "ES" || c == "FR" ||
                    c == "HR" || c == "IT" || c == "CY" || c == "LV" || c == "LT" || c == "LU" || c == "HU" || c == "MT" || c == "NL" || c == "AT" ||
                    c == "PL" || c == "PT" || c == "RO" || c == "SI" || c == "SK" || c == "FI" || c == "SE" || c == "GB" || c == "LI" || c == "IS" ||
                    c == "NO") {
                        addHost = true
                    }
            } else {
                if (hosts[i].countryCode == country) {
                    addHost = true
                }
            }
            // Adding host
            if (addHost == true) {
                

                var upload = parseInt(hosts[i].uploadbandwidthprice/1000000000000) + " SC"
                var download = parseInt(hosts[i].downloadbandwidthprice/1000000000000) + " SC"
                var collateralRatio = (hosts[i].collateral / hosts[i].storageprice).toFixed(1) + "x"
                // This obtuse algorithm converts the storage price from the hostdb to something human-legible. Obtained by test and error
                var storage = parseInt(hosts[i].storageprice * 400 / 92592592592) + " SC"
                var rank = hosts.length - i
                // On list
                if (hosts[i].onList == true) {
                    var onList = "*"
                } else {
                    var onList = ""
                }
                // Siastats score
                if (hosts[i].siastatsScore > 0) {
                    var score = '\x1b[42m(' + hosts[i].siastatsScore + ')\x1b[0m'
                } else {
                    var score = '\x1b[41m(' + hosts[i].siastatsScore + ')\x1b[0m'
                }
                data.push([
                    hosts[i].countryCode,
                    i,
                    hosts[i].netaddress,
                    storage,
                    upload,
                    download,
                    collateralRatio,
                    rank,
                    score,
                    onList
                ])
            }
        }
        config = {
            columns: {
                0: {
                    width: 7,
                    wrapWord: true
                },
                3: {
                    width: 7,
                    wrapWord: true
                },
                4: {
                    width: 6,
                    wrapWord: true
                },
                5: {
                    width: 8,
                    wrapWord: true
                },
                6: {
                    width: 10,
                    wrapWord: true
                },
                8: {
                    width: 8,
                    wrapWord: true
                },
                9: {
                    width: 6,
                    wrapWord: true
                }
            }
        };

        // Render table
        if (data.length > 1) {
            output = table.table(data, config);
            console.log(output);
            console.log("Add hosts to your Filter by using the 'Host #' code in the second column")
            console.log("Example: 'decentralizer filter add 23'")
            console.log()
        } else {
            console.log('No hosts in the selected country code')
            console.log('(try codes as US, GB or EU, get the full list with "decentralizer view hosts countries")')
            console.log()
        }

    } else {
        console.log('ERROR - The hosts file could not be fetched. Run the "decentralizer scan" command first')
        console.log()
    }});
}


function viewHostsAll(argument3, orderby) {
    if (argument3 == null || (argument3 == "orderby" && (orderby == "storage" || orderby == "upload" || orderby == "download" 
        || orderby == "collateral" || orderby == "score"))) {
        
        // Open file
        fs.readFile('databases/hosts.json', 'utf8', function (err, data) { if (!err) { 
            hosts = JSON.parse(data);
            
            // Filling the table
            var hostsTable = []
            for (var i = 0; i < hosts.length; i++) {
                var countryCode = hosts[i].countryCode
                if (countryCode == null) {countryCode = "XX"}
                var upload = parseInt(hosts[i].uploadbandwidthprice/1000000000000)
                var download = parseInt(hosts[i].downloadbandwidthprice/1000000000000)
                var collateralRatio = parseFloat((hosts[i].collateral / hosts[i].storageprice).toFixed(1))
                // This obtuse algorithm converts the storage price from the hostdb to something human-legible. Obtained by test and error
                var storage = parseInt(hosts[i].storageprice * 400 / 92592592592)
                var rank = hosts.length - i
                // On list
                if (hosts[i].onList == true) {
                    var onList = "*"
                } else {
                    var onList = ""
                }

                hostsTable.push([
                    countryCode,
                    i,
                    hosts[i].netaddress,
                    storage,
                    upload,
                    download,
                    collateralRatio,
                    rank,
                    hosts[i].siastatsScore,
                    onList
                ])
            }

            // Ordering table
            if (argument3 != null && orderby == "collateral") {
                function orderTableCollateral(a,b) {
                    if (a[6] < b[6])
                        return 1;
                    if (a[6] > b[6])
                        return -1;
                    return 0;
                }
                hostsTable.sort(orderTableCollateral);
            } else if (argument3 != null && orderby == "storage") {
                function orderTableStorage(a,b) {
                    if (a[3] < b[3])
                        return 1;
                    if (a[3] > b[3])
                        return -1;
                    return 0;
                }
                hostsTable.sort(orderTableStorage);
            } else if (argument3 != null && orderby == "upload") {
                function orderTableUpload(a,b) {
                    if (a[4] < b[4])
                        return 1;
                    if (a[4] > b[4])
                        return -1;
                    return 0;
                }
                hostsTable.sort(orderTableUpload);
            } else if (argument4 != null && orderby == "download") {
                function orderTableDownload(a,b) {
                    if (a[5] < b[5])
                        return 1;
                    if (a[5] > b[5])
                        return -1;
                    return 0;
                }
                hostsTable.sort(orderTableDownload);
            } else if (argument4 != null && orderby == "score") {
                function orderTableScore(a,b) {
                    if (a[8] < b[8])
                        return 1;
                    if (a[8] > b[8])
                        return -1;
                    return 0;
                }
                hostsTable.sort(orderTableScore);
            }

            // Adjusting color of the scores
            for (var i = 0; i < hostsTable.length; i++) {
                if (hostsTable[i][8] > 0) {
                    hostsTable[i][8] = '\x1b[42m(' + hostsTable[i][8] + ')\x1b[0m'
                } else {
                    hostsTable[i][8] = '\x1b[41m(' + hostsTable[i][8] + ')\x1b[0m'
                }
            }
            

            // Adding units to the table values
            for (var i = 0; i < hostsTable.length; i++) {
                hostsTable[i][3] = hostsTable[i][3] + " SC"
                hostsTable[i][4] = hostsTable[i][4] + " SC"
                hostsTable[i][5] = hostsTable[i][5] + " SC"
                if (hostsTable[i][6] != "Infinity") {
                    hostsTable[i][6] = hostsTable[i][6] + "x"
                }
            }
            
            // Concatenating the header
            header = [["Country code", "Host #", "Host IP", "Storage price per TB/mo", "Upload per TB", "Download per TB", "Collateral ratio", "Rank", "SiaStats Score", "On Filter"]]
            var data = header.concat(hostsTable);

            // Render table
            config = {
                columns: {
                    0: {
                        width: 7,
                        wrapWord: true
                    },
                    3: {
                        width: 7,
                        wrapWord: true
                    },
                    4: {
                        width: 6,
                        wrapWord: true
                    },
                    5: {
                        width: 8,
                        wrapWord: true
                    },
                    6: {
                        width: 10,
                        wrapWord: true
                    },
                    8: {
                        width: 8,
                        wrapWord: true
                    },
                    9: {
                        width: 6,
                        wrapWord: true
                    }
                }
            };
            output = table.table(data, config);
            console.log(output);
            console.log("Add hosts to your Filter by using the 'Host #' code in the second column")
            console.log("Example: 'decentralizer filter add 23'")
            console.log()
        }})
        
    } else {
        // Wrong syntax
        console.log("Invalid syntax")
        help()
    }
}



//////////////////////
// FILTER ENDPOINTS

function showList() {
    // Displays filter mode and hosts in the filter
    
    // Open files
    fs.readFile('databases/hosts.json', 'utf8', function (err, data) { if (!err) { 
        hosts = JSON.parse(data)
        
        fs.readFile('databases/settings.json', 'utf8', function (err, data) { if (!err) { 
            settings = JSON.parse(data)

            // Hosts
            // Table header
            data = [["Country code", "Filter-ID#", "Host IP", "Storage price per TB/mo", "Upload per TB", "Download per TB", "Collateral ratio", "Rank", "SiaStats score"]]
            var listNumber = 0 // For deducing the Filter-ID
            // Iterating the list of hosts
            for (var i = 0; i < hosts.length; i++) {
                if (hosts[i].onList == true) {
                    listNumber++
                    var listID = "F" + listNumber
                    var upload = parseInt(hosts[i].uploadbandwidthprice/1000000000000) + " SC"
                    var download = parseInt(hosts[i].downloadbandwidthprice/1000000000000) + " SC"
                    var collateralRatio = (hosts[i].collateral / hosts[i].storageprice).toFixed(1) + "x"
                    // This obtuse algorithm converts the storage price from the hostdb to something human-legible. Obtained by test and error
                    var storage = parseInt(hosts[i].storageprice * 400 / 92592592592) + " SC"
                    var rank = hosts.length - i
                    // Siastats score
                    if (hosts[i].siastatsScore > 0) {
                        var score = '\x1b[42m(' + hosts[i].siastatsScore + ')\x1b[0m'
                    } else {
                        var score = '\x1b[41m(' + hosts[i].siastatsScore + ')\x1b[0m'
                    }
                    data.push([
                        hosts[i].countryCode,
                        listID,
                        hosts[i].netaddress,
                        storage,
                        upload,
                        download,
                        collateralRatio,
                        rank,
                        score
                    ])
                }
            }
            config = {
                columns: {
                    0: {
                        width: 7,
                        wrapWord: true
                    },
                    3: {
                        width: 7,
                        wrapWord: true
                    },
                    4: {
                        width: 6,
                        wrapWord: true
                    },
                    5: {
                        width: 8,
                        wrapWord: true
                    },
                    6: {
                        width: 10,
                        wrapWord: true
                    },
                    6: {
                        width: 10,
                        wrapWord: true
                    },
                    8: {
                        width: 8,
                        wrapWord: true
                    },
                }
            };

            // Render table
            if (data.length > 1) {
                output = table.table(data, config);
                console.log(output);
                console.log()
            } else {
                console.log('No hosts currently on the filter')
                console.log('Add them with the "filter add [host#]" or "filter add [country code]" commands')
                console.log()
            }

            // Displaying the list mode
            data = [["Filter Mode:", settings.listMode]]
            output = table.table(data);
            console.log(output);
            console.log("To apply this Filter to Sia, use the command: 'decentralizer filter apply'")
            console.log()

        } else {
            console.log('ERROR - The settings file could not be fetched. Run the "decentralizer scan" command first')
            console.log()
        }});
    } else {
        console.log('ERROR - The hosts file could not be fetched. Run the "decentralizer scan" command first')
        console.log()
    }});
}


function addList(hostID) {
    // Adds a host to the List. It is just adding onlist = true
    
    // Open file
    fs.readFile('databases/hosts.json', 'utf8', function (err, data) { if (!err) { 
        hosts = JSON.parse(data)
        fs.readFile('databases/farms_definition.json', 'utf8', function (err, data) { if (!err) { 
            farms = JSON.parse(data);
            fs.readFile('databases/settings.json', 'utf8', function (err, data) { if (!err) { 
                settings = JSON.parse(data);
        
                // Sanity check of the hostID
                if (hostID >= 0 && hostID < hosts.length) {

                    // Safety checks on the host, before adding it
                    if (settings.listMode == "disable" || settings.listMode == "blacklist") {
                        var alert = false
                    } else if (settings.listMode == "whitelist") {
                        // We don't want to add an alerted host to a whitelist
                        var alert = checkAlertOnHost(hosts[hostID].publickeystring, hosts[hostID].netaddress, farms) // Checking for alerts
                    }
                    if (alert == false) {
                        addingHosts++
                        hosts[hostID].onList = true
                        // Save file
                        fs.writeFileSync('databases/hosts.json', JSON.stringify(hosts))
                        console.log("The host " + hosts[hostID].netaddress + " has been added to the Filter")
                        console.log()
                    } else {
                        // The function checkAlertOnHost already shows an error message
                        console.log()
                    }
                    
                } else {
                    // Adding a country. First a sanity check
                    if (hostID.length == 2) {
                        var country = hostID.toUpperCase()

                        // Transform "XX" into null for not geolocated hosts
                        if (country == "XX") {country = null}

                        // Iterating hosts
                        var addingHosts = 0
                        for (var i = 0; i < hosts.length; i++) {
                            if (country == "EU") {
                                var c = hosts[i].countryCode
                                if (c == "BE" || c == "BG" || c == "CZ" || c == "DK" || c == "DE" || c == "EE" || c == "IE" || c == "EL" || c == "ES" || c == "FR" ||
                                    c == "HR" || c == "IT" || c == "CY" || c == "LV" || c == "LT" || c == "LU" || c == "HU" || c == "MT" || c == "NL" || c == "AT" ||
                                    c == "PL" || c == "PT" || c == "RO" || c == "SI" || c == "SK" || c == "FI" || c == "SE" || c == "GB" || c == "LI" || c == "IS" ||
                                    c == "NO") {
                                        // Safety checks on the host, before adding it
                                        if (settings.listMode == "disable" || settings.listMode == "blacklist") {
                                            var alert = false
                                        } else if (settings.listMode == "whitelist") {
                                            // We don't want to add an alerted host to a whitelist
                                            var alert = checkAlertOnHost(hosts[i].publickeystring, hosts[i].netaddress, farms) // Checking for alerts
                                        }
                                        if (alert == false) {
                                            addingHosts++
                                            hosts[i].onList = true
                                        }
                                }

                            } else {
                                if (hosts[i].countryCode == country) {
                                    // Safety checks on the host, before adding it
                                    if (settings.listMode == "disable" || settings.listMode == "blacklist") {
                                        var alert = false
                                    } else if (settings.listMode == "whitelist") {
                                        // We don't want to add an alerted host to a whitelist
                                        var alert = checkAlertOnHost(hosts[i].publickeystring, hosts[i].netaddress, farms) // Checking for alerts
                                    }
                                    if (alert == false) {
                                        addingHosts++
                                        hosts[i].onList = true
                                    }
                                }
                            }
                        }

                        // Saving
                        fs.writeFileSync('databases/hosts.json', JSON.stringify(hosts))
                        console.log(addingHosts + " hosts in " + country +" have been added to the Filter")
                        console.log()

                    } else {
                        console.log("Wrong syntax: use a valid hostID number or a country code")
                        help()
                    }
                }

            } else {
                console.log('ERROR - The settings file could not be fetched. Run the "decentralizer scan" command first')
                console.log()
            }});
        } else {
            console.log('ERROR - The farms definition file could not be fetched. Run the "decentralizer scan" command first')
            console.log()
        }});
    } else {
        console.log('ERROR - The hosts file could not be fetched. Run the "decentralizer scan" command first')
        console.log()
    }});
}


function removeList(listID) {
    // Removes a host from the List
    var listNumber = listID.slice(1)
    
    // Open file
    fs.readFile('databases/hosts.json', 'utf8', function (err, data) { if (!err) { 
        hosts = JSON.parse(data)
        
        // Sanity check of the listID
        if (listID.slice(0,1) == "F" && listNumber > 0) {
            var listScannedCount = 1
            var hostFound = false
            for (var i = 0; i < hosts.length; i++) {
                if (hosts[i].onList == true) {
                    // If it is the listNumber, change it, otherwise increase the count
                    if (listScannedCount == listNumber) {
                        hostFound = true
                        hosts[i].onList = false
                        console.log("The host " + hosts[i].netaddress + " has been removed from the Filter")
                        console.log("If you want to remove additional hosts, run 'decentralizer filter' again, as Filter-IDs might have changed")
                    }
                    listScannedCount++
                }
            }
            if (hostFound == false) {
                console.log("ERROR: There is no host in the Filter with the " + listID + " Filter-ID")
                console.log("Check the correct Filter-IDs with the command 'filter show'")
            }

            // Save file
            fs.writeFileSync('databases/hosts.json', JSON.stringify(hosts))
            console.log()
        } else {
            console.log("Wrong Filter-ID. Check the Filter-IDs with the command 'filter show'")
            help()
        }

    
    } else {
        console.log('ERROR - The hosts file could not be fetched. Run the "decentralizer scan" command first')
        console.log()
    }});
}


function clearList() {
    // Removes all the hosts and sets the list mode to "disable"

    // Open files
    fs.readFile('databases/hosts.json', 'utf8', function (err, data) { if (!err) { 
        hosts = JSON.parse(data)

        fs.readFile('databases/settings.json', 'utf8', function (err, data) { if (!err) { 
            settings = JSON.parse(data)

            // Iterating hosts
            for (var i = 0; i < hosts.length; i++) {
                hosts[i].onList = false
            }

            // Changing the mode of the list
            settings.listMode = "disable"

            // Saving files
            fs.writeFileSync('databases/hosts.json', JSON.stringify(hosts))
            fs.writeFileSync('databases/settings.json', JSON.stringify(settings))
            console.log("Filter of hosts cleared and set in 'disable' mode")
            console.log()
        
        } else {
            console.log('ERROR - The settings file could not be fetched. Run the "decentralizer scan" command first')
            console.log()
        }});
    } else {
        console.log('ERROR - The hosts file could not be fetched. Run the "decentralizer scan" command first')
        console.log()
    }});
}


function modeList(newMode) {
    // Changes the mode of the list (white/black-listing)
    
    // Checking the list in order to add/remove alerted hosts
    fs.readFile('databases/hosts.json', 'utf8', function (err, data) { if (!err) { 
        hosts = JSON.parse(data)
        fs.readFile('databases/farms_definition.json', 'utf8', function (err, data) { if (!err) { 
            farms = JSON.parse(data)

            // Adding alerts
            for (var i = 0; i < hosts.length; i++) { // Each host
                for (var j = 0; j < farms.length; j++) { // Each farm
                    if (farms[j].alert == true) {
                        for (var k = 0; k < farms[j].hosts.length; k++) { // Each host in a farm
                            if (farms[j].hosts[k].pubkey == hosts[i].publickey.key) {
                                hosts[i].alert = true
                            }
                        }
                    }
                }
            }
            
            // Correcting the list with the alerts
            var correctedHosts = 0
            for (var i = 0; i < hosts.length; i++) {
                if (newMode == "blacklist") {
                    if (hosts[i].onList != true && hosts[i].alert == true) {
                        hosts[i].onList = true
                        correctedHosts++
                    }
                } else if (newMode == "whitelist") {
                    if (hosts[i].onList == true && hosts[i].alert == true) {
                        hosts[i].onList = false
                        correctedHosts++

                    }
                }
            }

            if (newMode == "blacklist" && correctedHosts > 0) {
                console.log(correctedHosts + " dangerous hosts have been added automatically to the blacklist for safety")
            } else if (newMode == "whitelist" && correctedHosts > 0) {
                console.log(correctedHosts + " dangerous hosts have been removed automatically from the withelist for safety")
            }

            // Saving the corrected hosts file
            fs.writeFileSync('databases/hosts.json', JSON.stringify(hosts))

            // Updating the list mode
            fs.readFile('databases/settings.json', 'utf8', function (err, data) { if (!err) { 
                settings = JSON.parse(data)
                settings.listMode = newMode
                fs.writeFileSync('databases/settings.json', JSON.stringify(settings))
                console.log("Filter mode updated to: " + newMode)
                console.log()
            } else {
                console.log('ERROR - The settings file could not be fetched. Run the "decentralizer scan" command first')
                console.log()
            }});

        } else {
            console.log('ERROR - The farms definition file could not be fetched. Run the "decentralizer scan" command first')
            console.log()
        }})
    } else {
        console.log('ERROR - The hosts file could not be fetched. Run the "decentralizer scan" command first')
        console.log()
    }})

}



function applyList() {
    if (debugMode == true) {console.log("// DEBUG - applyList(): Opening files")}

    fs.readFile('databases/hosts.json', 'utf8', function (err, data) { if (!err) { 
        hosts = JSON.parse(data)
        
        fs.readFile('databases/farms_definition.json', 'utf8', function (err, data) { if (!err) { 
            farms = JSON.parse(data)

            fs.readFile('databases/settings.json', 'utf8', function (err, data) { if (!err) { 
                settings = JSON.parse(data)
                var newMode = settings.listMode

                fs.readFile('databases/contracts.json', 'utf8', function (err, data) { if (!err) { 
                    contracts = JSON.parse(data)

                    // Next funtion
                    applyList2(hosts, farms, settings, newMode, contracts)

                } else {
                    if (debugMode == true) {console.log("// DEBUG - No contracts")}
                    // There is just no contracts file, move one with an empty array
                    var contracts = []
                    applyList2(hosts, farms, settings, newMode, contracts)
                }});
            
            } else {
                console.log('ERROR - The settings file could not be fetched. Run the "decentralizer scan" command first')
                if (debugMode == true) {console.log("// DEBUG - Error: " + err)}
                console.log()
            }});

        } else {
            console.log('ERROR - Databases are corrupted. Please, download again Decentralizer from https://keops.cc/decentralizer')
            if (debugMode == true) {console.log("// DEBUG - Error: " + err)}
            console.log()
        }})
    } else {
        console.log('ERROR - The hosts file could not be fetched. Run the "decentralizer scan" command first')
        if (debugMode == true) {console.log("// DEBUG - Error: " + err)}
        console.log()
    }})
}


function applyList2(hosts, farms, settings, newMode, contracts) {
    if (debugMode == true) {console.log("// DEBUG - applyList2() function")}
    farmsFlagged = 0
    for (var i = 0; i < farms.length; i++) {
        if (farms[i].alert == true) {farmsFlagged++}
    }
    if ((settings.listMode == "whitelist" || settings.listMode == "blacklist") && farmsFlagged > 0) {

        for (var i = 0; i < hosts.length; i++) { // Each host
            for (var j = 0; j < farms.length; j++) { // Each farm
                if (farms[j].alert == true) {
                    for (var k = 0; k < farms[j].hosts.length; k++) { // Each host in a farm
                        if (farms[j].hosts[k].pubkey == hosts[i].publickey.key) {
                            hosts[i].alert = true
                        }
                    }
                }
            }
        }

        var correctedHosts = 0
        for (var i = 0; i < hosts.length; i++) {
            if (newMode == "blacklist") {
                if (hosts[i].onList != true && hosts[i].alert == true) {
                    hosts[i].onList = true
                    correctedHosts++
                }
            } else if (newMode == "whitelist") {
                if (hosts[i].onList == true && hosts[i].alert == true) {
                    hosts[i].onList = false
                    correctedHosts++
                }
            }
        }

        if (newMode == "blacklist" && correctedHosts > 0) {
            console.log(correctedHosts + " dangerous hosts have been added automatically to the blacklist for safety")
        } else if (newMode == "whitelist" && correctedHosts > 0) {
            console.log(correctedHosts + " dangerous hosts have been removed automatically from the withelist for safety")
        }

        // Saving the corrected hosts file
        fs.writeFileSync('databases/hosts.json', JSON.stringify(hosts))
        if (debugMode == true) {console.log("// DEBUG - List corrected. Saving")}

        // Preparing the array
        var list = []
        for (var i = 0; i < hosts.length; i++) {
            if (hosts[i].onList == true) {
                list.push({
                    ip: hosts[i].netaddress,
                    pubkey: hosts[i].publickeystring,
                    key: hosts[i].publickey.key
                })
            }
        }
        if (settings.listMode == "whitelist") {
            var availableHosts = list.length
        } else if (settings.listMode == "blacklist") {
            var availableHosts = hosts.length - list.length
        }

        // Checking how many contracts will be cancelled
        var contractsToCancel = 0
        for (var i = 0; i < contracts.length; i++) {
            var matchContract = false
            for (var j = 0; j < list.length; j++) {
                // Depending on the mode
                if (settings.listMode == "blacklist") {
                    if (contracts[i].hostpublickey.key == list[j].key) {
                        contractsToCancel++ // Add to count
                    }
                } else if (settings.listMode == "whitelist") {
                    if (contracts[i].hostpublickey.key == list[j].key) {
                        matchContract = true
                    }
                }
            }
            if (settings.listMode == "whitelist" && matchContract == false) {
                // If we are in whitelist, and the contract was not found on it
                contractsToCancel++
            }
        }

        // Asking for feedback before applying
        console.log(list.length + " hosts will be " + settings.listMode + "ed")
        console.log("After applying this Filter, " + availableHosts + " hosts will be available to form contracts with")
        console.log(contractsToCancel + " of your current contracts will be immediately cancelled")
        console.log("Proceed? (y/n)")

        // Input form
        var stdin = process.stdin;
        stdin.setRawMode( true );
        stdin.resume();
        stdin.setEncoding( 'utf8' );
        stdin.on( 'data', function( key ){
            if ( key === '\u0003' ) { // ctrl-c
                process.exit();
            } else if (key === 'y') {
                console.log()
                siaFilter(list, settings)
            } else if (key === 'n') {
                console.log()
                process.exit();
            }
            //process.stdout.write( key );
        });

    } else if (settings.listMode == "disable") {

        var list = []
        // Asking for feedback before applying
        console.log("This will disable the Filter on Sia")
        console.log("Proceed? (y/n)")

        // Input form
        var stdin = process.stdin;
        stdin.setRawMode( true );
        stdin.resume();
        stdin.setEncoding( 'utf8' );
        stdin.on( 'data', function( key ){
            if ( key === '\u0003' ) { // ctrl-c
                process.exit();
            } else if (key === 'y') {
                console.log()
                siaFilter(list, settings)
            } else if (key === 'n') {
                console.log()
                process.exit();
            }
            //process.stdout.write( key );
        });
    }
}


function filterFarms() {
    // Adds farms to the Filter on a blacklist, excludes them on a whitelist
    fs.readFile('databases/hosts.json', 'utf8', function (err, data) { if (!err) { 
        hosts = JSON.parse(data);
        fs.readFile('databases/farms_definition.json', 'utf8', function (err, data) { if (!err) { 
            farms = JSON.parse(data);
            // Opening the hosts file to re-add the "onlist" value (hosts added to the Filter)
            fs.readFile('databases/settings.json', 'utf8', function (err, data) { if (!err) { 
                settings = JSON.parse(data);

                if (settings.listMode == "disable") {
                    console.log('ERROR - Your Filter is currently disabled. Set it as whitelist or blacklist to apply this command')
                    console.log()
                } else if (settings.listMode == "whitelist" || settings.listMode == "blacklist") {
                    applyFarmsToFilter(settings.listMode, farms, hosts)
                }
                
            } else {
                console.log('ERROR - Databases not found. Run the "decentralizer scan" command first')
                console.log()
            }});
        } else {
            console.log('ERROR - Databases not found. Run the "decentralizer scan" command first')
            console.log()
        }});     
    } else {
        console.log('ERROR - Databases not found. Run the "decentralizer scan" command first')
        console.log()
    }});
}

function applyFarmsToFilter(mode, farmsDefinition, hosts) {
    // Applies the farms list to the Filter
    
    var counter = 0
    // Check on each farm and marks the host if it is not the first one found on the farms definition list
    for (var i = 0; i < farmsDefinition.length; i++) {
        var firstHostFound = false
        for (var j = 0; j < farmsDefinition[i].hosts.length; j++) {
            for (var k = 0; k < hosts.length; k++) {
                if (farmsDefinition[i].hosts[j].pubkey == hosts[k].publickey.key) {
                    if (firstHostFound == false) {
                        // Do nothing with the first host of the farm identified, just update the boolean
                        firstHostFound = true
                    } else {
                        if (mode == "whitelist") {
                            hosts[k].onList = false
                            counter++
                        } else {
                            hosts[k].onList = true
                            counter++
                        }
                    }
                }
            }
        }
    }

    // Saving the corrected hosts file
    fs.writeFileSync('databases/hosts.json', JSON.stringify(hosts))

    if (mode == "whitelist") {
        console.log("Hosts removed from the whitelist: " + counter)
        console.log()
    } else {
        console.log("Hosts added to the blacklist: " + counter)
        console.log()
    }
    
}


function viewVersions() {
    // Displays a list of versions of hosts, with the count of hosts

    // Open file
    fs.readFile('databases/hosts.json', 'utf8', function (err, data) { if (!err) { 
        hosts = JSON.parse(data);

        var versions = []

        // Iterating hosts
        for (var i = 0; i < hosts.length; i++) {
            var versionMatch = false
            for (var j = 0; j < versions.length; j++) {
                if (hosts[i].version == versions[j].version) {
                    versionMatch = true
                    versions[j].hosts++
                }
            }
            if (versionMatch == false) {
                // Create new entry on array
                versions.push({
                    version: hosts[i].version,
                    hosts: 1
                })
            }
        }

        // Sorting by version
        function compare(a,b) {
            if (a.version < b.version)
                return 1;
            if (a.version > b.version)
                return -1;
            return 0;
        }
        versions.sort(compare);

        // Displaying table
        data = [["Sia version", "Number of hosts"]]
        for (var i = 0; i < versions.length; i++) {
            // Correcting data of not geolocated hosts

            // Adding to table
            data.push([
                versions[i].version,
                versions[i].hosts
            ])
        }
        output = table.table(data);
        console.log(output);
        console.log("Add all the hosts of a software version with the command 'decentralizer filter add version [version#]")
        console.log()

    } else {
        console.log('ERROR - The hosts file could not be fetched. Run the "decentralizer scan" command first')
        console.log()
    }});
}

function addVersion(argument4) {
    // Adds a version number to the Filter
    fs.readFile('databases/hosts.json', 'utf8', function (err, data) { if (!err) { 
        hosts = JSON.parse(data);
        fs.readFile('databases/farms_definition.json', 'utf8', function (err, data) { if (!err) { 
            farms = JSON.parse(data);
            fs.readFile('databases/settings.json', 'utf8', function (err, data) { if (!err) { 
                settings = JSON.parse(data);
            
                var addingHosts = 0
                for (var i = 0; i < hosts.length; i++) {
                    if (hosts[i].version == argument4 && hosts[i].onList != true) {
                        if (settings.listMode == "disable" || settings.listMode == "blacklist") {
                            var alert = false
                        } else if (settings.listMode == "whitelist") {
                            // We don't want to add an alerted host to a whitelist
                            var alert = checkAlertOnHost(hosts[i].publickeystring, hosts[i].netaddress, farms) // Checking for alerts
                        }
                        if (alert == false) {
                            addingHosts++
                            hosts[i].onList = true
                        }
                    }
                }

                if (addingHosts > 0) {
                    // Saving
                    fs.writeFileSync('databases/hosts.json', JSON.stringify(hosts))
                    console.log(addingHosts + " hosts using the version " + argument4 +" have been added to the Filter")
                    console.log()
                } else {
                    console.log('ERROR - No host added using this software version')
                    console.log()
                }
            
            } else {
                console.log('ERROR - The settings file could not be fetched. Run the "decentralizer scan" command first')
                console.log()
            }});
        } else {
            console.log('ERROR - The farms definition file could not be fetched. Run the "decentralizer scan" command first')
            console.log()
        }});
    } else {
        console.log('ERROR - The hosts file could not be fetched. Run the "decentralizer scan" command first')
        console.log()
    }});
}



function addScore(argument4) {
    // Adds the hosts with the specified SiaStats score to the filter
    if (argument4 >= 0 && argument4 <= 10) { // The score has to be from 0 to 10
        fs.readFile('databases/hosts.json', 'utf8', function (err, data) { if (!err) { 
            hosts = JSON.parse(data);
            fs.readFile('databases/farms_definition.json', 'utf8', function (err, data) { if (!err) { 
                farms = JSON.parse(data);
                fs.readFile('databases/settings.json', 'utf8', function (err, data) { if (!err) { 
                    settings = JSON.parse(data);

                    var addingHosts = 0
                    for (var i = 0; i < hosts.length; i++) {
                        if (hosts[i].siastatsScore == argument4 && hosts[i].onList != true) {
                            if (settings.listMode == "disable" || settings.listMode == "blacklist") {
                                var alert = false
                            } else if (settings.listMode == "whitelist") {
                                // We don't want to add an alerted host to a whitelist
                                var alert = checkAlertOnHost(hosts[i].publickeystring, hosts[i].netaddress, farms) // Checking for alerts
                            }
                            if (alert == false) {
                                addingHosts++
                                hosts[i].onList = true
                            }
                        }
                    }
                    if (addingHosts > 0) {
                        // Saving
                        fs.writeFileSync('databases/hosts.json', JSON.stringify(hosts))
                        // Adjusting color of the score
                        if (argument4 > 0) {
                            argument4 = '\x1b[42m(' + argument4 + ')\x1b[0m'
                        } else {
                            argument4 = '\x1b[41m(' + argument4 + ')\x1b[0m'
                        }
                        console.log(addingHosts + " hosts with the SiaStats score " + argument4 + " have been added to the Filter")
                        console.log()
                    } else {
                        console.log('ERROR - No host added with this SiaStats score')
                        console.log()
                    }

                } else {
                    console.log('ERROR - The settings file could not be fetched. Run the "decentralizer scan" command first')
                    console.log()
                }});
            } else {
                console.log('ERROR - The farms definition file could not be fetched. Run the "decentralizer scan" command first')
                console.log()
            }});
        } else {
            console.log('ERROR - The hosts file could not be fetched. Run the "decentralizer scan" command first')
            console.log()
        }});
    } else {
        console.log('ERROR - The SiaStats performance score needs to be a number between 0 and 10')
        console.log()
    }
}



function removeScore(argument4) {
    if (argument4 >= 0 && argument4 <= 10) { // The score has to be from 0 to 10
        fs.readFile('databases/hosts.json', 'utf8', function (err, data) { if (!err) { 
            hosts = JSON.parse(data);
            fs.readFile('databases/farms_definition.json', 'utf8', function (err, data) { if (!err) { 
                farms = JSON.parse(data);
                fs.readFile('databases/settings.json', 'utf8', function (err, data) { if (!err) { 
                    settings = JSON.parse(data);

                    var removingHosts = 0
                    for (var i = 0; i < hosts.length; i++) {
                        if (hosts[i].siastatsScore == argument4 && hosts[i].onList == true) {
                            if (settings.listMode == "disable" || settings.listMode == "whitelist") {
                                var alert = false
                            } else if (settings.listMode == "blacklist") {
                                // We don't want to remove an alerted host from a blacklist
                                var alert = checkAlertOnHost(hosts[i].publickeystring, hosts[i].netaddress, farms) // Checking for alerts
                            }
                            if (alert == false) {
                                removingHosts++
                                hosts[i].onList = false
                            }
                        }
                    }
                    if (removingHosts > 0) {
                        // Saving
                        fs.writeFileSync('databases/hosts.json', JSON.stringify(hosts))
                        // Adjusting color of the score
                        if (argument4 > 0) {
                            argument4 = '\x1b[42m(' + argument4 + ')\x1b[0m'
                        } else {
                            argument4 = '\x1b[41m(' + argument4 + ')\x1b[0m'
                        }
                        console.log(removingHosts + " hosts with the SiaStats score " + argument4 + " have been removed from the Filter")
                        console.log()
                    } else {
                        console.log('ERROR - No host currently on the Filter with this SiaStats score')
                        console.log()
                    }
                    /////////////////////////////////////////////////////////////////////////////

                } else {
                    console.log('ERROR - The settings file could not be fetched. Run the "decentralizer scan" command first')
                    console.log()
                }});
            } else {
                console.log('ERROR - The farms definition file could not be fetched. Run the "decentralizer scan" command first')
                console.log()
            }});
        } else {
            console.log('ERROR - The hosts file could not be fetched. Run the "decentralizer scan" command first')
            console.log()
        }});
    } else {
        console.log('ERROR - The SiaStats performance score needs to be a number between 0 and 10')
        console.log()
    }
}



function checkAlertOnHost(pubkey, ip, farms) {
    // Checks if the host to be added has an alert on it
    var alert = false // By default
    for (var i = 0; i < farms.length; i++) {
        if (farms[i].alert == true) {
            for (var j = 0; j < farms[i].hosts.length; j++) {
                if (farms[i].hosts[j].publickeystring == pubkey) {
                    alert = true
                    console.log("* The host " + ip + " was identified as unsafe and will not be added to the filter")
                }
            }
        }
        
    }
    return alert
}


function siaFilter(list, settings) {
    // Connects to Sia and applies the List to the hosts Filter of Sia
    if (debugMode == true) {console.log("// DEBUG - siaFilter(). Applying the filter to Sia")}
    
    var hostsList = []
    for (var i = 0; i < list.length; i++) {
        hostsList.push(list[i].pubkey)
    }

    sia.call(basicAuth, {
        url: "/hostdb/filtermode",
        method: "POST",
        body: {
            filtermode: settings.listMode,
            hosts: hostsList,
        },
    })
    .then((API) => {
        console.log("\nFilter applied successfully to Sia\n")
        process.exit();
    })
    .catch((err) => {
        console.log("ERROR - Filter could not be applied. Is Sia software running and updated to 1.4.0 or onwards?\n")
        if (debugMode == true) {console.log("// DEBUG - Error: " + err)}
        process.exit();
    })
}


