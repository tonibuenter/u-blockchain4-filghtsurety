const { initBlockchainData, initConsoleEvents } = require('../src/common');
const { catchResult } = require('../src/truffle-utils');
const { printAirlines } = require('../src/flight-surety-utils');

contract('Flight Surety Tests', async (addresses) => {
  var bd;
  var flightSuretyData;
  var flightSuretyApp;
  var firstAirline;
  var secondAirline;
  var airline3;
  var airline4;
  var web3;
  var amountWei;

  before('setup contract', async () => {
    // config = await initTest(addresses);

    bd = await initBlockchainData();
    flightSuretyApp = bd.flightSuretyApp;
    flightSuretyData = bd.flightSuretyData;
    web3 = bd.web3;
    amountWei = web3.utils.toWei('10', 'ether');
    initConsoleEvents(flightSuretyData);

    flightSuretyData = bd.flightSuretyData;
    flightSuretyApp = bd.flightSuretyApp;
    firstAirline = bd.airlines[0];
    secondAirline = bd.airlines[1];
    airline3 = bd.airlines[2];
    airline4 = bd.airlines[3];

    console.log('flightSuretyData.address:', flightSuretyData.address);
    console.log('flightSuretyApp.address:', flightSuretyApp.address);

    try {
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
      await flightSuretyApp.setOperational(false, { from: bd.addresses[5] });
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

  it('T-05 (airline) fund airline 0', async () => {
    let res = await flightSuretyData.isFunded(bd.airlines[0].address);
    assert.equal(res, false, '0 is funded!');
    res = await catchResult(() =>
      flightSuretyData.fund({
        from: bd.airlines[0].address,
        value: amountWei,
        gas: 3000000
      })
    );
    res = await flightSuretyData.isFunded(bd.airlines[0].address);
    assert.equal(res, true, '0 is not funded!');
  });

  it(`T-06 (airlines) register airlines 1,2,3,4`, async function () {
    let res;
    for (let i = 1; i < 5; i++) {
      res = await catchResult(() => flightSuretyApp.registerAirline(bd.airlines[i].address, bd.airlines[i].name), {
        from: bd.airlines[0].address
      });
      console.log('res:', res);
    }
    res = await flightSuretyData.numberOfAirlines();
    assert.equal(res, 5, 'Unknown number of airlines');
  });

  it(`T-07 (airline) fund airlines 1,2,3`, async function () {
    let res;
    for (let i = 1; i < 4; i++) {
      res = await catchResult(() => flightSuretyData.fund({ from: bd.airlines[i].address, value: amountWei }));
      console.log(res);
    }
    for (let i = 1; i < 4; i++) {
      res = await flightSuretyData.isFunded(bd.airlines[i].address);
      assert.equal(res, true, 'Is not funded! index: ' + i);
    }
  });

  it('T-08 (airline) vote on airline 4', async () => {
    let red,
      candidate = bd.airlines[4];

    let voter1 = bd.airlines[1];
    let voter2 = bd.airlines[2];

    res = await catchResult(() => flightSuretyApp.voteOnAirline(candidate.address, 1, { from: voter1.address }));
    console.log('voteOnAirline:', res);

    res = await catchResult(() => flightSuretyApp.voteOnAirline(candidate.address, 1, { from: voter2.address }));
    console.log('voteOnAirline:', res);

    res = await catchResult(() => flightSuretyData.fund({ from: candidate.address, value: amountWei }));
    console.log(res);

    res = await flightSuretyData.isFunded(candidate.address);
    assert.equal(res, true, 'Candidate is not funded! index: ');
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
    assert.equal(nrOfAirlines.toString(), '5', 'Nr of airlines');
  });

  it('T-10 (airline) consensus threshold and voting', async () => {
    // ARRANGE
    let consensusThreshold = -1;

    // ACT
    try {
      consensusThreshold = await flightSuretyData.getConsensusThreshold();
    } catch (e) {
      console.error(e.message);
    }

    // ASSERT
    assert.equal(consensusThreshold.toString(), '4', 'Consensus Threshold');
  });

  it('T-11 (customer) register all flights', async () => {
    let res;
    for (let airline of bd.airlines) {
      for (let flight of airline.flights) {
        res = await catchResult(() =>
          flightSuretyApp.registerFlight(flight.flight, flight.timestamp, { from: airline.address })
        );
        res = await flightSuretyApp.isFlightRegistered(airline.address, flight.flight, flight.timestamp);
        assert.equal(res, true, 'Could not register flight ' + flight.flight + ' of ' + airline.name);
      }
    }
  });

  it('T-12 (oracle trigger) buy insurance', async () => {
    let airline0 = bd.airlines[0];
    let flight0 = bd.airlines[0].flights[0];
    let insureeAddress = bd.addresses[7];

    let res;
    let amountEth = '0.5';
    let amountWei = web3.utils.toWei(amountEth, 'ether');
    res = await catchResult(() =>
      flightSuretyApp.buyInsurance(airline0.address, flight0.flight, flight0.timestamp, {
        from: insureeAddress,
        value: amountWei,
        gas: 3000000
      })
    );

    let isInsured = await flightSuretyData.isInsured(
      airline0.address,
      flight0.flight,
      flight0.timestamp,
      insureeAddress
    );
    assert.equal(isInsured, true, 'Could not buy insurance for: ' + flight0.flight);

    let a0 = await web3.eth.getBalance(insureeAddress);
    assert.equal(+a0 > 0, true, 'Unexpected amount.');
  });

  it('T-13 (oracle) trigger Oracle', async () => {
    const airlineAddress0 = bd.airlines[0].address;
    const flight0 = bd.airlines[0].flights[0].flight;
    const timestamp0 = bd.airlines[0].flights[0].timestamp;

    let res = await catchResult(() =>
      flightSuretyApp.fetchFlightStatus(airlineAddress0, flight0, timestamp0, {
        from: bd.defaultAccount,
        gas: 3000000
      })
    );
    assert.equal(res.startsWith('OK'), true, 'fetchFlightStatus not working!');
  });
});
