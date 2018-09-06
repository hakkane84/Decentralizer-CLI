![logo](https://github.com/hakkane84/Decentralizer/blob/master/logo.png)
# Decentralizer
Renter's tool for detecting and eliminating centralization in Sia contracts. "Vaccinates" against sybil attacks.

Ready-to-use binaries for Windows, MacOS and Linux can be downloaded here: https://github.com/hakkane84/Decentralizer/releases

This command line tool identifies farms of Sia hosts by geolocation and allows the renter to cancel the contracts formed with these hosts. Centralization of hosts is problematic, as it implicates that redundant copies of the files are being stored in the same location by presumably the same operator (defeating the purpose of the redundancy). It also exposes the renter to malicious hosts performing a sybil attack by denying acccess to files after controling a number of hosts large enough. This is why it is so important to identify these singular entities and avoid renewing file contracts with them.

Once these singular entities ("farms") are identified by Decentralizer and presented to the user, the user can decide to cancel the contract with whichever host he decides, or to let Decentralizer remove all but one of the contracts formed with each centralized entity.

For safety, hosts whose geolocation can't be assessed (very uncommon) are considered part of a farm.

## Usage of the binaries:

* 1 - Open Sia. Version 1.3.4 or above is required (for RC versions, RC3 or above).
* 2 - Open a command line interface of your OS on the folder where you downloaded the binary.
* 3 - Type `./decentralizer scan`. After the analysis, a numbered list of the detected hosts belonging to farms will be shown.
* 4a- Type `./decentralizer remove auto` to allow the app to automatically cancel contracts with centralized hosts. Only the contract with the host holding more of your data of each farm will be kept. 
* 4b- Alternatively, type `./decentralizer remove x` where `x` is the host number indicated inside brackets on the previously generated list. This will cancel the contract only with the specified host.

After canceling contracts, your Sia client will form replacement contracts with new hosts, as long as your wallet is unlocked. Some time after creating these new contracts (this can be accelerated by restarting Sia), Sia's file repair capabilities will upload the pieces of files to the new hosts. Take in mind that the **file repair will icur on Siacoin expenses**: new contracts will be formed, data will be uploaded to the replacement hosts and if you don't have the files locally anymore, the files will be downloaded first from the rest of available hosts (incurring in download expenses).

Canceling contracts with more than 15-20 hosts in one single operation is not recommended unless you keep a local copy of all the files. Otherwise, cancel first a few contracts, allow file repair to take the redundancy back to 3x and then cancel a second batch of contracts.

These binaries were compiled using `pkg` (https://github.com/zeit/pkg)

![screenshot](https://github.com/hakkane84/Decentralizer/blob/master/screenshot.jpg)

## Usage of the non-compiled script

* Install node.js
* Use the same commands mentioned above, as for example `node decentralizer.js remove auto`
* An additional command is available: `test x`, which will remove `x` random contracts from your list. It is meant exclusively for developers testing Sia's file repair

## Dependencies of the non-compiled script

In order to use the node.js script contained in this repository, the following dependencies are required:

* Sia.js
* babel-runtime

## Donations

Siacoin: bde3467039a6d9a563224330ff7578a027205f1f2738e1e0daf134d8ded1878cf5870c41927d




