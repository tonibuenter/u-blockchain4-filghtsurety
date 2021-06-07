const FlightSuretyApp = require('../../build/contracts/FlightSuretyApp.json');
const testData = require('../../config/testData.json');
const Web3 = require('web3');
const express = require('express');

const web3 = new Web3();
web3.eth.defaultAccount = testData.defaultAccount;
web3.setProvider(new web3.providers.WebsocketProvider(testData.providerUrl));

const TEST_ORACLES_COUNT = 3;

const ORACLES = [];

let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, testData.appAddress);

flightSuretyApp.events.OracleRequest(
  {
    fromBlock: 0
  },
  async function (error, event) {
    if (error) {
      console.log(error);
      return;
    }
    console.log(event);
    if (event.index) {
      const list = ORACLES[event.index];
      for (let acc of list) {
        const randomStatus = Math.floor(Math.random() * 6) * 10;
        await flightSuretyApp.methods
          .submitOracleResponse(event.index, event.airline, event.flight, event.timestamp, randomStatus)
          .sent();
      }
    }
  }
);

flightSuretyApp.events.AppConsole(
  {
    fromBlock: 0
  },
  async function (error, event) {
    if (error) {
      console.log(error);
      return;
    }
    console.log(event.returnValues.info);
  }
);

// Oracle registration

registerOracles();

const app = express();
app.get('/api', (req, res) => {
  res.send({
    message: 'An API for use with your Dapp!'
  });
});

async function registerOracles() {
  try {
    let fee = await flightSuretyApp.methods.REGISTRATION_FEE().call();
    console.log('REGISTRATION_FEE:', fee);
    // ACT
    for (let address of testData.oracleAddresses) {
      let receipt = await flightSuretyApp.methods.registerOracle().send({ from: address, value: fee, gas: 3000000 });
      let reg = await flightSuretyApp.methods.isOracleRegistered().call();
      let result = await flightSuretyApp.methods.getMyIndexes().call({ from: address });
      console.log(`Oracle Registered: ${result[0]}, ${result[1]}, ${result[2]}`);
      for (let i = 0; i < 3; i++) {
        ORACLES[i] = ORACLES[i] || [];
        ORACLES[i].push(address);
      }
    }
  } catch (e) {
    console.error(e);
  }
}
