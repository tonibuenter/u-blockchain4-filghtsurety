const { catchResult } = require('./truffle-utils');
const { initBlockchainData, initOracleRequest } = require('./common');

async_run();

async function async_run() {
  try {
    let bd = await initBlockchainData();
    let flightSuretyApp = bd.flightSuretyApp;
    initOracleRequest(flightSuretyApp);

    let address0 = bd.addresses[0];
    let airline0 = bd.airlines[0];
    let flight0 = airline0.flights[0];

    let res = await catchResult(() =>
      flightSuretyApp.fetchFlightStatus(airline0.address, flight0.flight, flight0.timestamp, { from: address0 })
    );
    console.log('fetchFlightStatus:', res);

    // await _printAirlines();
    process.exit(0);
  } catch (e) {
    console.error('async_run', e);
    process.exit(1);
  } finally {
    console.log('async_run DONE');
  }
}
