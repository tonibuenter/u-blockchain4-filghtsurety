const Test = require('../config/testConfig.js');
const BigNumber = require('bignumber.js');
const { expectEvent } = require('openzeppelin-test-helpers');

contract('Flight Surety Tests', async (accounts) => {
  var config;
  var flightSuretyData;
  var flightSuretyApp;
  var firstAirline;

  before('setup contract', async () => {
    config = await Test.Config(accounts);

    flightSuretyData = config.flightSuretyData;
    flightSuretyApp = config.flightSuretyApp;
    firstAirline = config.firstAirline;

    console.log('flightSuretyData.address:', flightSuretyData.address);
    console.log('flightSuretyApp.address:', flightSuretyApp.address);

    try {
      await flightSuretyApp.setDataContract(flightSuretyData.address);
      await flightSuretyData.authorizeCaller(flightSuretyApp.address);

      let res = await flightSuretyApp.isAirline(firstAirline);
      console.log('flightSuretyApp.isAirline:', res);
      res = await flightSuretyApp.registerAirline(firstAirline, 'First Airline');
      console.log('flightSuretyApp.registerAirline; res.tx:', res.tx);

      console.log('flightSuretyApp:', flightSuretyApp.address);

      await flightSuretyApp.setOperational(true);

      console.log('nr of airlines: ', (await flightSuretyData.numberOfAirlines()).toString());
    } catch (e) {
      console.warn('registerAirline: ', e.message);
    }

    console.log('setup contract DONE');
  });

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

  it(`T-01 (multiparty) has correct initial isOperational() value`, async function () {
    // Get operating status
    let status = await flightSuretyApp.isOperational.call();
    assert.equal(status, true, 'Incorrect initial operating status value');
  });

  it(`T-02 (multiparty) can block access to setOperational() for non-Contract Owner account`, async function () {
    let accessDenied = false;
    try {
      await flightSuretyApp.setOperational(false, { from: config.anyAddress });
    } catch (e) {
      accessDenied = true;
    }
    assert.equal(accessDenied, true, 'Access not restricted to Contract Owner');
  });

  it(`T-03 (multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {
    // Ensure that access is allowed for Contract Owner account
    let accessDenied = false;
    try {
      await flightSuretyApp.setOperational(false);
    } catch (e) {
      accessDenied = true;
    }
    assert.equal(accessDenied, false, 'Access not restricted to Contract Owner');
  });

  it(`T-04 (multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {
    await flightSuretyApp.setOperational(false);

    let operational_on = true;
    try {
      await flightSuretyApp.registerAirline(address(0), 'Test-Name');
    } catch (e) {
      operational_on = false;
    }
    assert.equal(operational_on, false, 'Access not blocked for requireIsOperational');
    await flightSuretyApp.setOperational(true);
  });

  it('T-06 (airline) cannot register an Airline using registerAirline() if it is not funded', async () => {
    // ARRANGE
    let secondAirline = config.secondAirline;

    // ACT
    try {
      await flightSuretyApp.registerAirline(secondAirline, 'Lufthansa', {
        from: config.firstAirline,
        value: 1
      });
    } catch (e) {
      console.warn(e.message);
    }
    let result = await flightSuretyApp.isAirline.call(secondAirline);

    // ASSERT
    assert.equal(result, true, "Airline should not be able to register another airline if it hasn't provided funding");
  });

  it(`T-07 (logic) check airline registration`, async function () {
    await flightSuretyApp.setOperational(true);

    let res = true;
    try {
      res = await flightSuretyApp.isRegistered(config.secondAirline);
    } catch (e) {
      console.log(e.message);
      res = false;
    }
    assert.equal(res, true, 'Airline already registered!');
  });

  it('T-08 (airline) cannot register an Airline using registerAirline() if it is not funded', async () => {
    // ARRANGE

    // ACT
    try {
      await flightSuretyApp.registerAirline(config.airline3, 'Airline3', { from: config.firstAirline });
      await flightSuretyApp.registerAirline(config.airline4, 'Airline4', { from: config.airline3 });
      await dumpAirlines(flightSuretyData);
    } catch (e) {}
    let result = await flightSuretyData.isAirline.call(config.airline4);

    // ASSERT
    assert.equal(result, true, "Airline should not be able to register another airline if it hasn't provided funding");
  });

  it('T-09 (airline) number of airlines', async () => {
    // ARRANGE
    let nrOfAirlines = -1;

    // ACT
    try {
      nrOfAirlines = await flightSuretyData.numberOfAirlines();
    } catch (e) {
      console.error(e.message);
    }

    // ASSERT
    assert.equal(nrOfAirlines.toString(), '4', 'Nr of airlines');
  });

  it('T-10 (airline) consensus threashold', async () => {
    // ARRANGE
    let consensusThreshold = -1;

    // ACT
    try {
      consensusThreshold = await flightSuretyData.getConsensusThreshold();
    } catch (e) {
      console.error(e.message);
    }

    // ASSERT
    assert.equal(consensusThreshold.toString(), '3', 'Consensus Threashold');
  });

  it('T-11 (airline) return all airlines', async () => {
    // ACT
    await dumpAirlines(flightSuretyData);
  });
  it('T-12 (airline) voteOnAirline', async () => {
    // ACT

    await dumpAirlines(flightSuretyData);
    let receipt = await flightSuretyApp.voteOnAirline(config.airline4, 1, { from: config.airline3 });
    // await expectEvent.inTransaction(receipt.tx, flightSuretyData, 'ConsoleEvent', { message: 'A' });

    const Web3 = require('web3');
    const web3 = new Web3();
    web3.setProvider(new web3.providers.HttpProvider('http://localhost:7545'));
    const receipt2 = await web3.eth.getTransactionReceipt(receipt.tx);

    processReceipt(receipt);
    let airline4 = await flightSuretyData.getAirline(3);
    assert.equal(2, airline4.status, 'Airline4 is not on status 2');
    await dumpAirlines(flightSuretyData);
  });
});

async function dumpAirlines(flightSuretyData) {
  let nrOfAirlines = await flightSuretyData.numberOfAirlines();
  for (let i = 0; i < nrOfAirlines; i++) {
    try {
      let airline = await flightSuretyData.getAirline(i);
      let voteApproval = await flightSuretyData.getVotingResults(i);
      console.log('***');
      console.log(i, ' Airline name:', airline.name);
      console.log('Airline status:', airline.status.toString());
      console.log(
        'Airline voters-yes-no-open:',
        voteApproval.voters.toString(),
        voteApproval.yes.toString(),
        voteApproval.no.toString(),
        voteApproval.open.toString()
      );
    } catch (e) {
      console.error(e.message);
    }
  }
}

function processReceipt(receipt) {
  const { logs } = receipt;
  for (let log of logs) {
    console.info('event:', log.event);
  }
}
