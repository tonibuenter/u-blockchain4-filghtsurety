


### Versions / Documentation

|Component|Description|
|---|---|
web3 | https://web3js.readthedocs.io/en/v1.3.4/
solidity |https://docs.soliditylang.org/en/v0.6.0/
payable addresses|https://ethereum.stackexchange.com/questions/64108/whats-the-difference-between-address-and-address-payable



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
