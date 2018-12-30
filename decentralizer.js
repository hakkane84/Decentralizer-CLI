// DECENTRALIZER 0.3.0
// Copyright 2018, 2019 by Salvador Herrera <keops_cc@outlook.com>


var fs = require('fs');
var sia = require('sia.js');
var http = require('request');
var getJSON = require('get-json')
var table = require('table')
var Path = require('path')

// Passing arguments
var argument1 = process.argv[2]
var argument2 = process.argv[3]
var argument3 = process.argv[4]
var argument4 = process.argv[5]

console.log()
console.log('\x1b[44m%s\x1b[0m', "*** KEOPS DECENTRALIZER v0.3.0 ***")
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
var apiPassword = apiPassword()
const basicAuth = `:${apiPassword}@${'localhost:9980'}`


// Directing to the proper function according to the user arguments
if (argument1 == "scan") {
    openSettingsFile() // In the background, we geolocate the user to update the settings file
    siastatsGeolocFile()
} else if (argument1 == "remove") {
    removeContract(argument2)
} else if (argument1 == "view" && argument2 == "farms") {
    viewFarms()
} else if (argument1 == "view" && argument2 == "contracts") {
    viewContracts()
} else if (argument1 == "help") {
    help()
} else {
    console.log("Invalid syntax")
    help()
}

function help() {
    console.log("   * decentralizer scan --> Analyzes contracts and shows hosts belonging to hosting farms")
    console.log("   * decentralizer remove x --> Removes the host numbered 'x' (refer to the 'decentralizer scan') from your contracts")
    console.log("   * decentralizer remove auto --> Removes all but one of the duplicate hosts in a hosting farm")
    console.log("   * decentralizer view farms --> Shows the list of farms obtained on the last scan")
    console.log("   * decentralizer view contracts --> Shows the full list of contracts, obtained on the last scan")
    console.log("   * decentralizer help --> Shows all possible commands")
    console.log()
}


function siastatsGeolocFile() {
    // SiaStats JSON geolocation. If the file can't be downloaded, the local copy is used instead
    getJSON('https://siastats.info/dbs/decentralizer_hosts_geoloc.json').then(function(siastatsGeoloc) {
        console.log("Downloaded " + siastatsGeoloc.length + " hosts geolocation from SiaStats.info");

        // Saving the file
        fs.writeFileSync('databases/hosts_geoloc.json', JSON.stringify(siastatsGeoloc))

        siastatsFarmsFile(siastatsGeoloc)
    }).catch(function(error) {
        
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
    getJSON('http://siastats.info/dbs/farms_api.json').then(function(siastatsFarms) {
        console.log("Downloaded data from " + siastatsFarms.length + " farms from SiaStats.info");

        // Saving the file
        fs.writeFileSync('databases/farms_definition.json', JSON.stringify(siastatsFarms))

        siaHosts(siastatsGeoloc, siastatsFarms)
    }).catch(function(error) {
        
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
    .then((siad) => {siad.call('/hostdb/active')
        .then((hosts) => {
            var hostdb = hosts.hosts
            hostsProcessing(siastatsGeoloc, siastatsFarms, hostdb)
        })
        .catch((err) => {
            console.log("Error retrieving data from Sia. Is Sia working, synced and connected to internet? Try this script again after restarting Sia.")
            console.log()
        })
    })
    .catch((err) => {
        console.log("Error connecting to Sia. Start the Sia app (either daemon or UI) and try again")
        console.log()
    })
}


function hostsProcessing(siastatsGeoloc, siastatsFarms, hostdb) {
    // Assigns IPs to the hostdb and determines the hosts that need additional geolocation
    hostsToGeoloc = [] // Entries numbers that need to be geolocated locally by Decentralizer
    for (var i = 0; i < hostdb.length; i++) { // For each host
        var matchBool = false
        for (var j = 0; j < siastatsGeoloc.length; j++) { // For each geolocation in list
            if (hostdb[i].publickey.key == siastatsGeoloc[j].pubkey) {
                // Match, update hostdb entry
                matchBool = true
                hostdb[i].lon = siastatsGeoloc[j].lon
                hostdb[i].lat = siastatsGeoloc[j].lat
                hostdb[i].countryName = siastatsGeoloc[j].countryName
                hostdb[i].countryCode = siastatsGeoloc[j].countryCode
            }
        }
        if (matchBool == false) {
            // If no match, add to the list
            hostsToGeoloc.push(i)
        }
    }

    console.log("Number of additional hosts to be geolocated: " + hostsToGeoloc.length + "\n")
    if (hostsToGeoloc.length > 0) {
        var i = 0
        requestIP(siastatsFarms, hostdb, hostsToGeoloc, i, siastatsGeoloc)
    } else {
        // No additional host to geolocate, save and proceed to next step
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
    getJSON(ipquery).then(function(ipAPI) {
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

    }).catch(function(error) {
        // On failed IP request, move to the next IP
        console.log(hostip + " - Failed")
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
    fs.readFile('databases/hosts.json', 'utf8', function (err, data) { if (!err) { 
        oldHosts = JSON.parse(data);

        for (var i = 0; i < hostdb.length; i++) {
            for (var j = 0; j < oldHosts.length; j++) {
                if (hostdb[i].publickey.key == oldHosts[j].publickey.key) { // Match of hosts
                    if (oldHosts[j].onlist == true) {
                        // Add the boolean to the new hostdb
                        hostdb[i].onlist = true
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
            console.log(err)
        })
    })
    .catch((err) => {
        console.log("Error connecting to Sia. Start the Sia app (either daemon or UI) and try again")
        console.log()
    })
}


function contractsIpAssign(siastatsFarms, contracts, siastatsGeoloc) {

    // Assigns IPs to the contracts and determines the hosts that need additional geolocation
    contractsToGeoloc = [] // Entries numbers that need to be geolocated locally by Decentralizer
    for (var i = 0; i < contracts.length; i++) { // For each contract
        var matchBool = false
        for (var j = 0; j < siastatsGeoloc.length; j++) { // For each geolocation in list
            if (contracts[i].hostpublickey.key == siastatsGeoloc[j].pubkey) {
                // Match, update hostdb entry
                matchBool = true
                contracts[i].lon = siastatsGeoloc[j].lon
                contracts[i].lat = siastatsGeoloc[j].lat
                contracts[i].as = siastatsGeoloc[j].as
                contracts[i].countryName = siastatsGeoloc[j].countryName
                contracts[i].countryCode = siastatsGeoloc[j].countryCode
            }
        }
        if (matchBool == false) {
            // If no match, add to the list
            contractsToGeoloc.push(i)
        }
    }

    console.log("Number of additional contracts to be geolocated: " + contractsToGeoloc.length + "\n")
    if (contractsToGeoloc.length > 0) {
        var i = 0
        requestContractIP(siastatsFarms, contracts, contractsToGeoloc, i)
    } else {
        // No additional host to geolocate, save and proceed to next step
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
    getJSON(ipquery).then(function(ipAPI) {
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

    }).catch(function(error) {
        // On failed IP request, move to the next IP
        console.log(hostip + " - Failed")
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
                    pubkey: hostsGroups[j][k].hostpublickey.key
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
                pubkey: hostsGroups[j][0].hostpublickey.key
            }
            // Pushing it to the element 0 of farmList, the "Other hosts"
            farmList[0].hosts.push(hostEntry)
        }
    }

    siastatsProcess(farmList, contracts, siastatsFarms)
}


function siastatsProcess(farmList, contracts, siastatsFarms) {
    // This function compares our farmList with the list of siastats farms, to add the remaining farm-positive contracts to farmList

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
                                        siastatsFlag: true // Add the flag to the latest host of that farm (the one we just pushed)
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
    fs.writeFileSync('databases/farms.json', JSON.stringify(farmList))

    showFarms(farmList)
}


function showFarms(farmList) {
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


function openSettingsFile() {
    // Timestamp
    var timestamp = Date.now()

    // Opening settings file
    fs.readFile('databases/settings.json', 'utf8', function (err, data) { if (!err) { 
        var settings = JSON.parse(data)
        settings.lastsync = timestamp
        userGeolocation(settings)
    } else {
        // Initialize a settings file here
        settings = {
            userLon: null,
            userLat: null,
            lastsync: timestamp,
            listMode: "disable"
        }
        userGeolocation(settings)
    }});
}

function userGeolocation(settings) {
    var ipquery = "http://ip-api.com/json/"
    http.get(ipquery).on('response', function (response) {
        var body4 = '';
        var i4 = 0;
        response.on('data', function (chunk4) {
            i4++;
            body4 += chunk4;
        });
        response.on('end', function () {
            var ipAPI = JSON.parse(body4)
            settings.userLon = parseFloat(ipAPI.lon)
            settings.userLat = parseFloat(ipAPI.lat)

            fs.writeFileSync('databases/settings.json', JSON.stringify(settings))
        })
        response.on('error', function (chunk5) {
            // Failed user geolocation
            console.log("Error - failed to assess user geolocation")
            fs.writeFileSync('databases/settings.json', JSON.stringify(settings))
        });
    })
}



/////////////////////////////////////////////////////
// CONTRACT REMOVAL

function removeContract(argument2) {
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
        }});

    } else {
        // Error
        console.log("Invalid syntax")
        help()
    }
}



function cancelContract(contractNum, contractsToRemove, attempt) {
    // Iterates on contractsToRemove canceling the contract
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
        data = [["Contract #", "IP", "Value", "Data", "Is a farm","Alerts"]]

            var listNumber = 1
            // First those in farms, to keep compatibility of contract#
            for (var i = 1; i < farmList.length; i++) { // Each farm
                if (farmList[i].hosts.length > 0) { // For not displaying the not geolocated if there is no host in this category
                    for (var j = 0; j < farmList[i].hosts.length; j++) { // Each host
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
                            "*", 
                            alert
                        ])
                        listNumber++
                    }
                }
            }

            // Next the no-farms
            for (var j = 0; j < farmList[0].hosts.length; j++) { // Each host
                data.push([
                    listNumber, 
                    farmList[0].hosts[j].ip, 
                    farmList[0].hosts[j].cost + "SC", 
                    farmList[0].hosts[j].data + "GB",
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

