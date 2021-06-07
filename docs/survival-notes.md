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

## Commands

`truffle compile`

Migrate and deploy on Ganache (with reset)

`truffle migrate --reset`

Start test (with debug option)

`truffle test --debug`

## Deploy SupplyChain Contract to Rikeby

truffle compile

truffle migrate --network rinkeby

## Product Image

An additional parameter

```
curl "https://ipfs.infura.io:5001/api/v0/cat?arg=HASH"
    -X POST 
```

```
curl "https://ipfs.infura.io:5001/api/v0/add?pin=false" 
    -X POST 
    -H "Content-Type: multipart/form-data"     
    -F file=@"tfile.txt"
```

```

uint8 has 8 bits
uint160 has 160 bits
uint and uint256 have 256 bits

address has 20 bytes, that makes - 20 multiply with 8 -160 bits

so address ~ uint160

```

### ganache-cli --db ~/tmp/ganache-cli

ganache-cli --acctKeys ~/_proj/misc/udacity/u-blockchain4-flightsurety/config/deployment8548.json
