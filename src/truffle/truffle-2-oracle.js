const contract = require('truffle-contract');
const { catchResult, formatReceit } = require('../truffle-utils');
const { initBlockchainData, initOracleRequest } = require('./common');

const Web3 = require('web3');

const provider = new Web3.providers.WebsocketProvider(testData.providerUrl);
const fsAppJson = require('../../build/contracts/FlightSuretyApp.json');
const fsDataJson = require('../../build/contracts/FlightSuretyData.json');

asyncRun();

async function asyncRun() {
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

    initConsoleEvents(deployedData);
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
    console.error('asyncRun', e);
  } finally {
    console.log('asyncRun DONE');
  }

  async function _printContractDetails() {
    let b, b1;
    console.log('def account balance:', (b = await web3.eth.getBalance(testData.defaultAccount)));
    console.log('deployedApp balance:', await web3.eth.getBalance(deployedData.address));
    let amountWei = web3.utils.toWei('0.001', 'ether');
    let res = await catchResult(() => deployedData.fund({ value: amountWei }));
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
      res = await catchResult(() => deployedApp.registrationStatus(airline.address));
      console.log('registrationStatus:', res);
      res = await catchResult(() => deployedData.votingResults(airline.address));
      console.log('votingResults:', res);
      res = await catchResult(() => deployedData.getBallotSize(airline.address));
      console.log('getBallotSize:', res);
    }
    console.log('*** _printAirlines -end- ***');
  }

  async function _registerAirlines() {
    for (let airline of testData.airlines) {
      await _registerAirline(airline);
      // console.log('***', airline.name, '***');
      // let reason = await catchResult(() => deployedApp.registerAirline(airline.address, airline.name));
      // console.log('registerAirline:', reason);
    }
  }

  async function _registerAirline(airline) {
    console.log('***', airline.name, '***');
    let reason = await catchResult(() => deployedApp.registerAirline(airline.address, airline.name));
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

    let reason = await catchResult(() => deployedApp.voteOnAirline(candidate.address, voter.address, 1));
    console.log('voteOnAirline reason:', reason);
  }
}
