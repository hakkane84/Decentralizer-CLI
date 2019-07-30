![logo](https://github.com/hakkane84/Decentralizer/blob/master/full_logo.png)
# Decentralizer

Contracts micro-managing and unsafe hosts protection for Sia (CLI)

Website: https://keops.cc/decentralizer

A tool for Sia renters that allows:

* a) Micro-managing and data visualization about the formed contracts.
* b) Creating filters of hosts, according to geolocation, Sia version, pricing and/or manual selection.
* c) Detection of hosting farms and unsafe hosts, allowing cancelling contracts with them and/or filter them out. "Farms" represent multiple hosts sharing geolocation, most pprobably being controlled by the same opeprator. Centralization of hosts is problematic, as it implicates that redundant copies of the files are being stored in the same location (what defeats the purpose of the redundancy). It also exposes the renter to malicious hosts performing a sybil attack by denying acccess to files after controling a large enough number of hosts.

Decentralizer connects to SiaStats.info and downloads a database of hosting farms. In addition to pure geolocation, SiaStats tracks hosts over time and employs additional algorithms, what allows discovering farms even if the farm operator changes the physical location of the hosts, uses VPNs or intentionally tries to block SiaStats at a network level. Thanks to the use of these databases from SiaStats, unsafe hosts (i.e., hosts that are known to be performing a Sybil attack or provoke damage or any kind), will be shown with an alert message, allowing the user to avoid them. You can learn more about it at https://siastats.info/hosting_farms. In case SiaStats is unavailable (for example during to a DDoS attack to its servers), a local copy of this database is used (`farms_definition.json`). This file can be updated manually: ask in the Sia official Discord in case you require an up-to-date database file.

Ready-to-use binaries for Windows, MacOS and Linux can be downloaded here: https://github.com/hakkane84/Decentralizer-GUI/releases

**Users preferring a graphical interface can use instead Decentralizer-GUI, which brings the same features in an easy and intuitive to use app: https://github.com/hakkane84/Decentralizer-GUI**

The databases of hosts, contracts and the user-built Filter can be easily re-used in a different machine (even if it is using Decentralizer-GUI) by copying the `databases` folder.

## Usage of the binaries:

* 1 - Open Sia. Version 1.4.0 or above is required for the full feature set (the Hosts Filter is only available in this version and onwards).
* 2 - Open a command line interface of your OS on the folder where you downloaded the binary.
* *On Linux, you'll need to make the binary executable with `sudo chmod +x decentralizer`*

![screenshot](https://github.com/hakkane84/Decentralizer/blob/master/screenshot.jpg)

### General commands:
* `./decentralizer help`: Shows the list of all possible commands with explanations
* `./decentralizer scan`: Downloads databases from SiaStats and alanyzes hosts and contracts. After the analysis, a numbered list of the detected hosts belonging to farms will be shown. Dangerous hosts will be identified with an alert message.

### Contracts cancelling commands:
* `./decentralizer view farms`: Shows the list of farms
* `./decentralizer view contracts`: Shows the full list of contracts, belonging or not to farms. The Contract-ID number allows to individually cancel them
* `./decentralizer remove auto`: Allows the app to automatically cancel contracts with centralized hosts. Only the contract with the host holding more of your data of each farm will be kept. 
* `./decentralizer remove x` where `x` is the host number (or Contract-ID number) indicated on the previously generated farms and contract lists. This will cancel the contract only with the specified host.

After canceling contracts, your Sia client will form replacement contracts with new hosts, as long as your wallet is unlocked. Sia will upload the pieces of files to the new hosts. If file redundancy does not start recovering a few minutes after removing contracts then restart Sia. Keep in mind that the **file repair will incur Siacoin expenses**: new contracts will be formed, data will be uploaded to the replacement hosts and if you don't have the files locally anymore, the files will be downloaded first from the rest of available hosts (incurring download expenses).

### Hosts filter commands

* `./decentralize filter help`: Shows a walkthrough guide about setting up a Filter
* `./decentralizer view hosts countries`: Shows the list of country codes of hosts and the number of hosts per country
* `./decentralizer view hosts versions`: Shows the list of version numbers hosts are using
* `./decentralizer view hosts [country code]` Shows the list of hosts in the specified country
* `./decentralizer view hosts orderby [storage/upload/download/collateral/score]`: Shows a list of all the hosts, ordered by the selected parameter. `[score]` will use SiaStats performance scores
* `./decentralizer filter`: Shows your Filter mode (blacklist, whitelist, disable) and the hosts included on it
* `./decentralizer filter add [hostID / country code]`: Adds the desired HostID or all the hosts in a country to the Filter
* `./decentralizer filter add version [version]`: Adds to the filter all the hosts using the selected Sia version (e.g. "1.4.0")
* `./decentralizer filter add score [score]`: Adds to the filter all the hosts with an specific SiaStats performance score (e.g. "9")
* `./decentralizer filter remove [y]`: Removes the host with FilterID 'y' from the Filter (check the ID with 'filter show') 
* `./decentralizer filter remove score [score]`: Removes from the filter any host with the specified SiaStats performance score (e.g. "9")
* `./decentralizer filter mode [disable/whitelist/blacklist]`: Changes the mode of the Filter that will be applied to the list of hosts. In a whitelist, only the selected hosts will be candidates in Sia to form contracts with. In blacklist, the hosts in the Filter will be excluded by Sia.
* `./decentralizer filter clear`: Removes all the hosts from the Filter, and sets its mode to 'disable'")
* `./decentralizer filter farms`: On whitelist, removes the hosts in farms from the Filter. On blacklist, adds them to the Filter. One of the hosts of each farm will be kept aside, in both cases, ensuring the farm can still be used, but no more than one contract will be formed with it.
* `./decentralizer filter apply`: Applies the Filter of hosts and the Filter mode (whitelist/blacklist/disable) to Sia")

For safety reasons, hosts flagged as unsafe by SiaStats can't be included on a whitelist, and will be automatically added on the blacklist mode.

### Debug mode

* Use the flag `-d` or `--debug`. Example: `./decentralizer -d scan`

## Usage of the non-compiled script

* Install node.js
* `npm install` to install all the dependencies
* Use the same commands mentioned above, as for example `node decentralizer.js remove auto`


## Compiling binaries

* Install node.js
* `npm install` to install all the dependencies
* Install `pkg`: `npm install -g pkg`
* Run `pkg ./` to create binaries for the 3 main OS

## Changes log

### v1.1.2

* Fixed a a bug when scanning hosts and contracts but the user has not stablished an allowance yet

### v1.1.1

* Corrected compatibility of the databases format with Decentralizer-GUI (they can be switched back and forth between both versions again)

### v1.1.0

* Added the SiaStats performance scores to every table. Endpoints for adding and removing the hosts of specific scores have been added too
* New filter add command with combinatorial criteria
* New Filter walkthrough guide command: `./decentralizer filter help`
* Added a debug mode (start with the `-d` flag, followed by the command, e.g. `./decentralizer -d scan`)

### v1.0.1

* Corrected a bug by which the list of hosts was not really arranged by the host rank

### v1.0.0

* Full rewrite of the code logic: now geolocation of all the hosts is primarly obtained from SiaStats and additional inquires to geolocation databases is performed locally in absence of data from SiaStats.
* All contracts can be now individually cancelled (not just farms).
* Decentralizer now allows to create and apply a hosts filter to Sia. Build a filter by adding hosts manually, according to their country, Sia version or pricing.
* New databases structure allows easy inter-operability between multiple machines (even those using the GUI version) just by moving the `databases` folder.

### v0.2.0

* Decentralizer connects to SiaStats to obtain additional farms information.
* Unsafe hosts hosts detected and alerted thanks to SiaStats databases.

### v0.1.0

* Initial release.

## License

Decentralizer is an open source project offered under the GNU GPLv3 license. Briefly, it means that if you want to distribute a modified version of this software you need to 1) make your changes open source, 2) keep the GNU GPLv3 license, 3) respect and show the authorship of the code.

The easiest way to comply with this is simply using the cloning button of this repository into your own GitHub repository!

## Acknowledgements

I want to thank [tbenz9](https://github.com/tbenz9) for his code contributions

## Donations

Siacoin: `bde3467039a6d9a563224330ff7578a027205f1f2738e1e0daf134d8ded1878cf5870c41927d`

