const contract = require('truffle-contract');
const { catchResult, formatReceit } = require('../truffle-utils');
const testData = require('../../config/blockchainData.json');
const Web3 = require('web3');

const provider = new Web3.providers.WebsocketProvider(testData.providerUrl);
const fsAppJson = require('../../build/contracts/FlightSuretyApp.json');
const fsDataJson = require('../../build/contracts/FlightSuretyData.json');

const web3 = new Web3();
web3.eth.defaultAccount = testData.defaultAccount;
web3.setProvider(provider);

_main();

async function _main() {
  const faApp = contract(fsAppJson);
  const faData = contract(fsDataJson);
  let deployedApp, deployedData;

  try {
    faApp.setProvider(provider);
    faApp.defaults({ from: testData.defaultAccount });

    faData.setProvider(provider);
    faData.defaults({ from: testData.defaultAccount });

    deployedApp = await faApp.deployed();
    deployedData = await faData.deployed();

    console.log('testData.defaultAccount    :', testData.defaultAccount);
    console.log('deployedApp.address        :', deployedApp.address);
    console.log('deployedData.address       :', deployedData.address);
    console.log('deployedApp data contract  :', await deployedApp.getDataContract());
    console.log('deployedData contract owner:', await deployedData.getContractOwner());
    await _printAirlines();
  } catch (e) {
    console.error('_main', e);
  } finally {
    console.log('_main DONE');
  }

  async function _printAirlines() {
    console.log('*** _printAirlines -start- ***');
    for (let airline of testData.airlines) {
      console.log('***', airline.name, '***');
      let res = await deployedApp.isRegistered(airline.address);
      console.log('isRegistered:', res);
      res = await catchResult(() => deployedApp.registrationStatus(airline.address));
      console.log('registrationStatus:', res);
      res = await catchResult(() => deployedData.votingResults(airline.address));
      console.log('votingResults:', res);
      res = await catchResult(() => deployedData.getBallotSize(airline.address));
      console.log('getBallotSize:', res);
    }
    console.log('*** _printAirlines -end- ***');
  }
}
