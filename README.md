![logo](https://github.com/hakkane84/Decentralizer/blob/master/full_logo.png)
# Decentralizer

Contracts micro-managing and unsafe hosts protection for Sia (GUI)

Website: https://keops.cc/decentralizer

A tool for Sia renters that allows:

* a) Micro-managing and data visualization about the formed contracts.
* b) Creating filters of hosts, according to geolocation, Sia version, pricing and/or manual selection.
* c) Detection of hosting farms and unsafe hosts, allowing cancelling contracts with them and/or filter them out. "Farms" represent multiple hosts sharing geolocation, most pprobably being controlled by the same opeprator. Centralization of hosts is problematic, as it implicates that redundant copies of the files are being stored in the same location (what defeats the purpose of the redundancy). It also exposes the renter to malicious hosts performing a sybil attack by denying acccess to files after controling a large enough number of hosts.

Decentralizer connects to SiaStats.info and downloads a database of hosting farms. In addition to pure geolocation, SiaStats tracks hosts over time and employs additional algorithms, what allows discovering farms even if the farm operator changes the physical location of the hosts, uses VPNs or intentionally tries to block SiaStats at a network level. Thanks to the use of these databases from SiaStats, unsafe hosts (i.e., hosts that are known to be performing a Sybil attack or provoke damage or any kind), will be shown with an alert message, allowing the user to avoid them. You can learn more about it at https://siastats.info/hosting_farms. In case SiaStats is unavailable (for example during to a DDoS attack to its servers), a local copy of this database is used (`farms_definition.json`). This file can be updated manually: ask in the Sia official Discord in case you require an up-to-date database file.

Ready-to-use binaries for Windows, MacOS and Linux can be downloaded here: https://github.com/hakkane84/Decentralizer-GUI/releases

**Users preferring a graphical interface can use instead Decentralizer-GUI, which brings the same features in an easy and intuitive to use app: https://github.com/hakkane84/Decentralizer-GUI**

## Usage of the binaries:

* 1 - Open Sia. Version 1.4.0 or above is required for the full feature set.
* 2 - Open a command line interface of your OS on the folder where you downloaded the binary.
* *On Linux, you'll need to make the binary executable with `sudo chmod +x decentralizer`*

Decentralizer commands:
* `./decentralizer help`: Shows the list of all possible commands with explanations
* `./decentralizer scan`: Downloads databases from SiaStats and alanyzes hosts and contracts. After the analysis, a numbered list of the detected hosts belonging to farms will be shown. Dangerous hosts will be identified with a `[*]` and an alert message.
* `./decentralizer show farms`: Shows again the list of farms
* `./decentralizer show contracts`: Shows the full list of contracts, belonging or not to farms. The Contract-ID number allows to individually cancel them
* `./decentralizer remove auto`: Allows the app to automatically cancel contracts with centralized hosts. Only the contract with the host holding more of your data of each farm will be kept. 
* `./decentralizer remove x` where `x` is the host number (or Contract-ID number) indicated on the previously generated farms and contract lists. This will cancel the contract only with the specified host.

After canceling contracts, your Sia client will form replacement contracts with new hosts, as long as your wallet is unlocked. Some time after creating these new contracts (this can be accelerated by restarting Sia), Sia's file repair capabilities will upload the pieces of files to the new hosts. If file redundancy does not start recovering a few minutes after removing contracts then restart Sia. Keep in mind that the **file repair will incur Siacoin expenses**: new contracts will be formed, data will be uploaded to the replacement hosts and if you don't have the files locally anymore, the files will be downloaded first from the rest of available hosts (incurring download expenses).

Canceling contracts with more than 15-20 hosts in one single operation is not recommended unless you keep a local copy of all the files. Otherwise, cancel a few contracts, allow file repair to take the redundancy back to 3x and then cancel a second batch of contracts.

These binaries were compiled using `pkg` (https://github.com/zeit/pkg)

![screenshot](https://github.com/hakkane84/Decentralizer/blob/master/screenshot.jpg)

## Usage of the non-compiled script

* Install node.js
* `npm install` to install all the dependencies
* Use the same commands mentioned above, as for example `node decentralizer.js remove auto`


## Compiling binaries

* Install node.js
* `npm install` to install all the dependencies
* Install `pkg`: `npm install -g pkg`
* Run `pkg ./` to create binaries for the 3 main OS

## Acknowledgements

I want to thank [tbenz9](https://github.com/tbenz9) for his code contributions

## Donations

Siacoin: `bde3467039a6d9a563224330ff7578a027205f1f2738e1e0daf134d8ded1878cf5870c41927d`




