# FlightSurety

FlightSurety is a sample application project for Udacity's Blockchain course.

## Prepare and Run

Go to the project directory...

###Start ganache-cli with predefined accounts. 

For metamask use 
`0x3661B6fC9490ad5Aea8B1491A2A6E95266E73fB6`

`./run-ganache-cli-test.sh`

###Deploy contracts and accounts

`truffle migrate --reset; ./prepare-dapp.sh`

###Init airline and flight data

`cd src; node init-airline-and-flights.js`

###Start server

`npm run server`

###Start Dapp

`npm run dapp`

will be available on

`http://localhost:8000`

###Run Tests

All

`truffle test`

Sinlge ones

`truffle test ./test/flightSurety.js`

`truffle test ./test/oracles.js`

##Config files

### Template for addresses, airlines and flights

./config/rootConfig85.json


### Addresses generated from `ganache-cli`

./config/deployment8548.json

### Generated addresses, airline and flights data by `2_deploy_contracts.js`

./config/blockchainData.json

## Resources

* [How does Ethereum work anyway?](https://medium.com/@preethikasireddy/how-does-ethereum-work-anyway-22d1df506369)
* [BIP39 Mnemonic Generator](https://iancoleman.io/bip39/)
* [Truffle Framework](http://truffleframework.com/)
* [Ganache Local Blockchain](http://truffleframework.com/ganache/)
* [Remix Solidity IDE](https://remix.ethereum.org/)
* [Solidity Language Reference](http://solidity.readthedocs.io/en/v0.4.24/)
* [Ethereum Blockchain Explorer](https://etherscan.io/)
* [Web3Js Reference](https://github.com/ethereum/wiki/wiki/JavaScript-API)
* Course code exercises: https://github.com/udacity/BCND-C6-Exercises

