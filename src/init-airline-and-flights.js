const { assert } = require('chai');
const { catchResult } = require('./truffle-utils');
const { initBlockchainData, initConsoleEvents } = require('./common');
const { printAirlines } = require('./flight-surety-utils');

async_run();

async function async_run() {
  let bd, flightSuretyApp, flightSuretyData, res;
  try {
    bd = await initBlockchainData();
    flightSuretyApp = bd.flightSuretyApp;
    flightSuretyData = bd.flightSuretyData;
    initConsoleEvents(flightSuretyData);
    web3 = bd.web3;
    console.log('bd.defaultAccount              :', bd.defaultAccount);
    console.log('flightSuretyApp.address        :', flightSuretyApp.address);
    console.log('flightSuretyData.address       :', flightSuretyData.address);
    console.log('flightSuretyApp data contract  :', await flightSuretyApp.getDataContract());
    console.log('flightSuretyData contract owner:', await flightSuretyData.getContractOwner());

    let amountWei = web3.utils.toWei('10', 'ether');

    await printAirlines(flightSuretyData);
    console.log('>>> fund airline 0');

    res = await flightSuretyData.isFunded(bd.airlines[0].address);
    res = await catchResult(() =>
      flightSuretyData.fund({
        from: bd.airlines[0].address,
        value: amountWei,
        gas: 3000000
      })
    );
    res = await flightSuretyData.isFunded(bd.airlines[0].address);
    assert.equal(res, true, '0 is not funded!');

    await printAirlines(flightSuretyData);

    console.log('>>> register airlines 1,2,3,4');

    for (let i = 1; i < 5; i++) {
      res = await catchResult(() => flightSuretyApp.registerAirline(bd.airlines[i].address, bd.airlines[i].name), {
        from: bd.airlines[0].address
      });
      console.log('res:', res);
    }
    res = await flightSuretyData.numberOfAirlines();
    assert.equal(res, 5, 'Unknown number of airlines');

    await printAirlines(flightSuretyData);

    console.log('>>> fund airlines 1,2,3');

    for (let i = 1; i < 4; i++) {
      res = await catchResult(() => flightSuretyData.fund({ from: bd.airlines[i].address, value: amountWei }));
      console.log(res);
    }
    for (let i = 1; i < 4; i++) {
      res = await flightSuretyData.isFunded(bd.airlines[i].address);
      assert.equal(res, true, 'Is not funded! index: ' + i);
    }

    await printAirlines(flightSuretyData);

    console.log('>>> vote on airline 4');

    let candidate = bd.airlines[4];

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

    await printAirlines(flightSuretyData);

    for (let airline of bd.airlines) {
      for (let flight of airline.flights) {
        res = await catchResult(() =>
          flightSuretyApp.registerFlight(flight.flight, flight.timestamp, { from: airline.address })
        );
        res = await flightSuretyApp.isFlightRegistered(airline.address, flight.flight, flight.timestamp);
        assert.equal(res, true, 'Could not register flight ' + flight.flight + ' of ' + airline.name);
      }
    }

    process.exit(0);
  } catch (e) {
    console.error('async_run', e);
    process.exit(1);
  } finally {
    console.log('async_run DONE');
  }
}
