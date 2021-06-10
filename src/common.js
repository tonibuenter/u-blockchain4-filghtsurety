const Web3 = require('web3');
const contract = require('truffle-contract');
const fsAppJson = require('../build/contracts/FlightSuretyApp.json');
const fsDataJson = require('../build/contracts/FlightSuretyData.json');
const { catchResult } = require('./truffle-utils');
const bd = require('../config/blockchainData.json');

module.exports = { initBlockchainData, initConsoleEvents, initOracleRequest, printAirlines };

async function initBlockchainData() {
  const faApp = contract(fsAppJson);
  const faData = contract(fsDataJson);

  const provider = new Web3.providers.WebsocketProvider(bd.providerUrl);

  const web3 = new Web3();
  web3.eth.defaultAccount = bd.defaultAccount;
  web3.setProvider(provider);

  faApp.setProvider(provider);
  faApp.defaults({ from: bd.defaultAccount });

  faData.setProvider(provider);
  faData.defaults({ from: bd.defaultAccount });

  let flightSuretyApp = await faApp.deployed();
  let flightSuretyData = await faData.deployed();

  await flightSuretyApp.setDataContract(flightSuretyData.address);
  await flightSuretyData.authorizeCaller(flightSuretyApp.address);

  return { ...bd, flightSuretyApp, flightSuretyData, web3 };
}

function initOracleRequest(flightSuretyApp, callback) {
  const processEvent =
    callback ||
    ((event) =>
      console.log(
        '>>>OracleRequest:',
        event.returnValues.index,
        event.returnValues.airline,
        event.returnValues.flight,
        event.returnValues.timestamp
      ));
  flightSuretyApp.OracleRequest().on('data', processEvent);
  flightSuretyApp.OracleRequest().on('once', processEvent);
}

function initConsoleEvents(utils, callback) {
  const processEvent =
    callback ||
    ((event) => {
      console.log('>>>origin:', event.returnValues.origin);
      console.log('>>>level:', event.returnValues.level);
      console.log('>>>info:', event.returnValues.info);
    });
  utils.Console().on('data', processEvent);
  utils.Console().on('once', processEvent);
}

async function printAirlines(flightSuretyApp, flightSuretyData) {
  console.log('*** _printAirlines -start- ***');
  for (let airline of bd.airlines) {
    console.log('***', airline.name, '***');
    let res = await flightSuretyApp.isRegistered(airline.address);
    console.log('isRegistered:', res);
    res = await catchResult(() => flightSuretyApp.registrationStatus(airline.address));
    console.log('registrationStatus:', res);
    res = await catchResult(() => flightSuretyData.votingResults(airline.address));
    console.log('votingResults:', res);
    res = await catchResult(() => flightSuretyData.getBallotSize(airline.address));
    console.log('getBallotSize:', res);
  }
  console.log('*** _printAirlines -end- ***');
}
