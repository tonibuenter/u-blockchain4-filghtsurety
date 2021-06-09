const { initTest } = require('../config/testConfig.js');
const { catchResult } = require('../src/truffle-utils');

contract('Flight Surety Tests', async (addresses) => {
  var config;
  var flightSuretyData;
  var flightSuretyApp;
  var firstAirline;
  var secondAirline;
  var airline3;
  var airline4;

  before('setup contract', async () => {
    config = await initTest(addresses);

    flightSuretyData = config.flightSuretyData;
    flightSuretyApp = config.flightSuretyApp;
    firstAirline = config.airlines[0];
    secondAirline = config.airlines[1];
    airline3 = config.airlines[2];
    airline4 = config.airlines[3];

    console.log('flightSuretyData.address:', flightSuretyData.address);
    console.log('flightSuretyApp.address:', flightSuretyApp.address);

    try {
      await flightSuretyApp.setDataContract(flightSuretyData.address);
      await flightSuretyData.authorizeCaller(flightSuretyApp.address);

      let res = await flightSuretyApp.isAirline(firstAirline.address);
      console.log('flightSuretyApp.isAirline:', res);
      res = await flightSuretyApp.registerAirline(firstAirline.address, firstAirline.name);
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
      await flightSuretyApp.setOperational(false, { from: config.addresses[5] });
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
      await flightSuretyApp.registerAirline(address(0), 'Zero Airline');
    } catch (e) {
      operational_on = false;
    }
    assert.equal(operational_on, false, 'Access not blocked for requireIsOperational');
    await flightSuretyApp.setOperational(true);
  });

  it('T-05 (airline) cannot register an Airline using registerAirline()', async () => {
    // ARRANGE

    // ACT

    let result = await catchResult(() => flightSuretyApp.registerAirline(secondAirline.address, secondAirline.name));
    console.log('Result: ', result);

    result = await flightSuretyApp.isAirline(secondAirline.address);

    // ASSERT
    assert.equal(result, true, "Airline should not be able to register another airline if it hasn't provided funding");
  });

  it(`T-07 (logic) check airline registration`, async function () {
    await flightSuretyApp.setOperational(true);

    let res = true;
    try {
      res = await flightSuretyApp.isRegistered(secondAirline.address);
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
      await flightSuretyApp.registerAirline(airline3.address, airline3.name, { from: firstAirline.address });
      await flightSuretyApp.registerAirline(airline4.address, airline4.name, { from: airline3.address });
      await dumpAirlines(flightSuretyData);
    } catch (e) {}
    let result = await flightSuretyData.isAirline(airline4.address);

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
    let result = await catchResult(() => flightSuretyApp.voteOnAirline(airline4.address, firstAirline.address, 1));
    console.log('result:', result);

    result = await catchResult(() =>
      flightSuretyApp.voteOnAirline(airline4.address, secondAirline.address, 1, { from: secondAirline.address })
    );
    console.log('result:', result);

    let res = await flightSuretyData.getAirlineByIndex(3);
    assert.equal('2', res.airlineStatus.toString(), 'Airline4 is not on status 2');
    await dumpAirlines(flightSuretyData);
  });
});

async function dumpAirlines(flightSuretyData) {
  let nrOfAirlines = await flightSuretyData.numberOfAirlines();
  for (let i = 0; i < nrOfAirlines; i++) {
    try {
      let airline = await flightSuretyData.getAirlineByIndex(i);
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
