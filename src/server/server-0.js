const express = require('express');
const contract = require('truffle-contract');
const { catchResult, formatReceit } = require('../truffle-utils');
const bd = require('../../config/blockchainData.json');
const Web3 = require('web3');

const provider = new Web3.providers.WebsocketProvider(bd.providerUrl);
const fsAppJson = require('../../build/contracts/FlightSuretyApp.json');
const fsDataJson = require('../../build/contracts/FlightSuretyData.json');

const web3 = new Web3();
web3.eth.defaultAccount = bd.defaultAccount;
web3.setProvider(provider);

const TEST_ORACLES_COUNT = 3;

const ORACLES = [];

const app = express();
app.get('/api', (req, res) => {
  res.send({
    message: 'An API for use with your Dapp!'
  });
});

initAll();

async function initAll() {
  await init_contracts_and_events();
  await register_oracles();
}

async function register_oracles() {
  let flightSuretyApp = getFlightSuretyApp();
  if (flightSuretyApp) {
    try {
      let fee = await flightSuretyApp.REGISTRATION_FEE();
      console.log('REGISTRATION_FEE:', fee);
      // ACT
      for (let address of bd.oracleAddresses) {
        let result = catchResult(() =>
          flightSuretyApp.methods.registerOracle({
            from: address,
            value: fee,
            gas: 3000000
          })
        );
        console.log('registerOracle:', result);

        result = catchResult(() => flightSuretyApp.isOracleRegistered({ from: address }));
        console.log('isOracleRegistered:', result);

        result = catchResult(() => flightSuretyApp.getMyIndexes({ from: address }));
        console.log(`Oracle Registered: ${result[0]}, ${result[1]}, ${result[2]}`);
        for (let i = 0; i < 3; i++) {
          ORACLES[i] = ORACLES[i] || [];
          ORACLES[i].push({ address, indexes: result });
        }
      }
    } catch (e) {
      console.error(e);
    }
  } else {
    console.warn('flightSuretyApp not available');
  }
}

var deployedApp, deployedData;

function getFlightSuretyApp() {
  return deployedApp;
}

function getFlightSuretyData() {
  return deployedData;
}

async function init_contracts_and_events() {
  const faApp = contract(fsAppJson);
  const faData = contract(fsDataJson);
  deployedApp, deployedData;

  try {
    faApp.setProvider(provider);
    faApp.defaults({ from: bd.defaultAccount });

    faData.setProvider(provider);
    faData.defaults({ from: bd.defaultAccount });

    deployedApp = await faApp.deployed();
    deployedData = await faData.deployed();

    deployedApp.OracleRequest().on('data', (event) => {
      processOracleRequest(event);
    });
    deployedApp.OracleRequest().on('once', (event) => {
      processOracleRequest(event);
    });
  } catch (e) {
    console.error(e);
  }
}

async function processOracleRequest(event) {
  if (error) {
    console.log(error);
    return;
  }
  console.log(event);
  if (event.index) {
    const list = ORACLES[event.index];
    for (let acc of list) {
      const randomStatus = Math.floor(Math.random() * 6) * 10;
      const flightSuretyApp = getFlightSuretyApp();
      if (flightSuretyApp) {
        let result = catchResult(() =>
          flightSuretyApp.submitOracleResponse(event.index, event.airline, event.flight, event.timestamp, randomStatus)
        );
        console.log('submitOracleResponse:', result);
      }
    }
  }
}
