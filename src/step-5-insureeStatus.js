const { catchResult } = require('./truffle-utils');
const { initBlockchainData, initOracleRequest } = require('./common');

async_run();

async function async_run() {
  try {
    let bd = await initBlockchainData();

    for (let airline of bd.airlines) {
      for (let flight of airline.flights) {
        console.log(`Flight ${flight.flight}; ${flight.timestamp}`);

        let res = await catchResult(() =>
          bd.flightSuretyData.isInsured(airline.address, flight.flight, flight.timestamp, bd.metamask)
        );
        console.log('isInsured:', res);
        res = await catchResult(() =>
          bd.flightSuretyData.insureeStatus(airline.address, flight.flight, flight.timestamp, bd.metamask)
        );
        let { status, amount } = res;
        if (!status) {
          console.log('insureeStatus:', res);
        } else {
          console.log(`insuree status: ${flight.flight} has status ${status} with amount ${amount}`);
        }
      }
    }

    // await _printAirlines();
    process.exit(0);
  } catch (e) {
    console.error('async_run', e);
    process.exit(1);
  } finally {
    console.log('async_run DONE');
  }
}
