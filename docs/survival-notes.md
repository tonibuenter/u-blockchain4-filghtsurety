# Welcome to FlightSurety



## Environment & Versions / Documentation

|Component|Description|
|---|---|
web3 | ^1.3.6
solidity | ^0.6.0
truffle | ^5.3.6
openzeppelin/contracts | 3.1.0-rc.0

## Documentation

|Topic|Description|
|---|---|
project template | https://github.com/udacity/FlightSurety
web3 | https://web3js.readthedocs.io/en/v1.3.4/
solidity |https://docs.soliditylang.org/en/v0.6.0/
payable addresses|https://ethereum.stackexchange.com/questions/64108/whats-the-difference-between-address-and-address-payable
truffle contract javascript API |https://www.trufflesuite.com/docs/truffle/reference/contract-abstractions|


### Project Template
https://github.com/udacity/FlightSurety

## Commands

`truffle compile`

Migrate and deploy on Ganache (with reset)

`
truffle migrate --reset
`

Start test (with debug option)

`
truffle test --debug
`


### ganache-cli 

A random ganache environment with 30 accounts can be started with

```

ganache-cli \
--accounts 30 \
--acctKeys \
~/_proj/misc/udacity/u-blockchain4-flightsurety/config/deployment8548.json


```

The stable test environment can be started with:
```
./run-ganache-cli-test.sh

```
This re-uses the same accounts.


#### Fix Address 
PK
0x7633c00493dd9f4967cd7c84c040d6cce987f4d14d4dd879eb69f5d664724da1
Address
0xE420b6478F867063AC9F02051C65ae5148eAdc6a



