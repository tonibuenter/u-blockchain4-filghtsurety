const contract = require('truffle-contract');
const { catchReason, formatReceit } = require('./truffle-utils');
const testData = require('../../config/testData.json');
const Web3 = require('web3');

const provider = new Web3.providers.WebsocketProvider(testData.providerUrl);
const fsAppJson = require('../../build/contracts/FlightSuretyApp.json');
const fsDataJson = require('../../build/contracts/FlightSuretyData.json');

const AIRLINE_ALREADY_REGISTERED = 'AIRLINE_ALREADY_REGISTERED';

const assert = require('chai');

const web3 = new Web3();
web3.eth.defaultAccount = testData.defaultAccount;
web3.setProvider(provider);

_main();

async function _run0() {
  const faApp = contract(fsAppJson);

  try {
    faApp.setProvider(provider);
    let instance0 = await faApp.new({ from: testData.defaultAccount });
    console.log('instance0.address:', instance0.address);
    let instance1 = await faApp.new({ from: testData.defaultAccount });
    console.log('instance1.address:', instance1.address);
  } catch (e) {
    console.error('_run0', e);
  } finally {
    console.log('_run0 DONE');
  }
}

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

    deployedData.Console().on('data', (event) => {
      console.log('>>>origin:', event.returnValues.origin);
      console.log('>>>level:', event.returnValues.level);
      console.log('>>>info:', event.returnValues.info);
    });
    deployedData.Console().on('once', (event) => {
      console.log('>>>origin:', event.returnValues.origin);
      console.log('>>>level:', event.returnValues.level);
      console.log('>>>info:', event.returnValues.info);
    });
    await deployedApp.setDataContract(deployedData.address);
    await deployedData.authorizeCaller(deployedApp.address);
    console.log('testData.defaultAccount    :', testData.defaultAccount);
    console.log('deployedApp.address        :', deployedApp.address);
    console.log('deployedData.address       :', deployedData.address);
    console.log('deployedApp data contract  :', await deployedApp.getDataContract());
    console.log('deployedData contract owner:', await deployedData.getContractOwner());

    await _registerAirline(testData.airlines[0]);
    await _registerAirline(testData.airlines[1]);
    await _registerAirline(testData.airlines[2]);
    await _registerAirline(testData.airlines[3]);
    await _voteOnAirline();

    return;

    await _printAirlines();
    //

    await _registerAirline(testData.airlines[3]);

    await _registerAirlines();
    await _printAirlines();
    await _printAirlines();
    await _printContractDetails();

    //

    await _printAirlines();

    await _printAirlines();

    await _printAirlines();
  } catch (e) {
    console.error('_main', e);
  } finally {
    console.log('_main DONE');
  }

  async function _printContractDetails() {
    let b, b1;
    console.log('def account balance:', (b = await web3.eth.getBalance(testData.defaultAccount)));
    console.log('deployedApp balance:', await web3.eth.getBalance(deployedData.address));
    let amountWei = web3.utils.toWei('0.001', 'ether');
    let res = await catchReason(() => deployedData.fund({ value: amountWei }));
    console.log('deployedApp fund:', res);
    console.log('def account balance:', (b1 = await web3.eth.getBalance(testData.defaultAccount)));
    var BN = web3.utils.BN;
    b = new BN(b);
    b1 = new BN(b1);
    console.log('difference:', web3.utils.fromWei(b.sub(b1), 'ether'));
  }

  async function _printAirlines() {
    console.log('*** _printAirlines -start- ***');
    for (let airline of testData.airlines) {
      console.log('***', airline.name, '***');
      let res = await deployedApp.isRegistered(airline.address);
      console.log('isRegistered:', res);
      res = await catchReason(() => deployedApp.registrationStatus(airline.address));
      console.log('registrationStatus:', res);
      res = await catchReason(() => deployedData.votingResults(airline.address));
      console.log('votingResults:', res);
      res = await catchReason(() => deployedData.getBallotSize(airline.address));
      console.log('getBallotSize:', res);
    }
    console.log('*** _printAirlines -end- ***');
  }

  async function _registerAirlines() {
    for (let airline of testData.airlines) {
      await _registerAirline(airline);
      // console.log('***', airline.name, '***');
      // let reason = await catchReason(() => deployedApp.registerAirline(airline.address, airline.name));
      // console.log('registerAirline:', reason);
    }
  }

  async function _registerAirline(airline) {
    console.log('***', airline.name, '***');
    let reason = await catchReason(() => deployedApp.registerAirline(airline.address, airline.name));
    console.log('registerAirline:', reason);
  }

  async function _voteOnAirline() {
    const candidate = testData.airlines[3];
    console.log('*** VOTE ON Candidate:', candidate.name, '***');
    let res = await deployedApp.registrationStatus(candidate.address);
    console.log('registrationStatus:', res.toString());

    let voter = testData.airlines[0];
    console.log('*** VOTER:', voter.name, '***');
    res = await deployedApp.registrationStatus(voter.address, { from: voter.address });
    console.log('registrationStatus (voter):', res.toString());

    let reason = await catchReason(() => deployedApp.voteOnAirline(candidate.address, voter.address, 1));
    console.log('voteOnAirline reason:', reason);
  }
}
