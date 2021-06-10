const { catchResult } = require('./truffle-utils');
const { initBlockchainData, initConsoleEvents, printAirlines } = require('./common');

async_run();

async function async_run() {
  let bd, flightSuretyApp, flightSuretyData;
  try {
    bd = await initBlockchainData();
    flightSuretyApp = bd.flightSuretyApp;
    flightSuretyData = bd.flightSuretyData;
    initConsoleEvents(flightSuretyData);

    let address0 = bd.addresses[0];
    let airline0 = bd.airlines[0];
    let flight0 = airline0.flights[0];

    console.log('bd.defaultAccount    :', bd.defaultAccount);
    console.log('flightSuretyApp.address        :', flightSuretyApp.address);
    console.log('flightSuretyData.address       :', flightSuretyData.address);
    console.log('flightSuretyApp data contract  :', await flightSuretyApp.getDataContract());
    console.log('flightSuretyData contract owner:', await flightSuretyData.getContractOwner());

    res = await catchResult(() =>
      flightSuretyApp.registerFlight(flight0.flight, flight0.timestamp, { from: airline0.address })
    );

    console.log('registerFlight:', res);
    res = await flightSuretyApp.isFlightRegistered(airline0.address, flight0.flight, flight0.timestamp);

    console.log('isFlightRegistered:', res);
  } catch (e) {
    console.error('async_run', e);
  } finally {
    console.log('async_run DONE');
  }
}
