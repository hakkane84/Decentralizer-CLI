# Decentralizer
Renter's tool for detecting and eliminating centralization in Sia contracts. "Vaccinates" against sybil attacks.

https://keops.cc/decentralizer

Ready-to-use binaries for Windows, MacOS and Linux can be downloaded from LINK

This command line tool identifies farms of Sia hosts by geolocation and allows the renter to cancel the contracts formed witrh these hosts. Centralization of hosts is problematic, as it implicates that redundant copies of the files are being stored in the same location (defeating the purpose of the redundancy) and exposes the renter to malicious hosts performing a sybil attack by denying acccess to files after controling a number of hosts large enough. This is why it is so important to identify these singular entities and avoid renewing file contracts with them.

Once these singular entities ("farms") are identified by Decentralizer and presented to the user, the user can decide to eliminate manually whichever host he decides or to let Decentralizer to remove all but one of the contracts formed with each Farm.

## Usage of the binaries:

* 1 - Open Sia. Version 1.3.4 or above is required (for RC versions, RC3 or above)
* 2 - Open a command line interface of your OS on the folder where the downloaded binary file is located
* 3 - Type `./decentralizer scan`. After the analysis, a numbered list of the detect hosts belonging to farms will be shown
* 4a- Type `./decentralizer remove auto` to allow the app to automatically cancel contracts with centralized hosts. Only the contract with the host holding more of your data of each farm will be kept. 
* 4b- Alternatively, type `./decentralizer remove x` where `x` is the number inside brackets of the previously generated list. This will cancel the contract only with the specified host

Some time after canceling contracts, your Sia client will form contracts with new hosts to replace the removed ones, as long as your wallet is unlocked. Some time after replacing contracts (this can be accelerated restarting Sia), 

## Usage of the non-compiled script


## Dependancies of the non-compiled script:

In order to use the node.js script contained in this repository, the following dependencies are required:

* node.js

* Sia.js



