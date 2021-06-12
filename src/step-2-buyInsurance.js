const { catchResult } = require('./truffle-utils');
const { initBlockchainData, initConsoleEvents, printAirlines } = require('./common');

async_run();

async function async_run() {
  let bd, flightSuretyApp, flightSuretyData, web3;
  try {
    bd = await initBlockchainData();
    web3 = bd.web3;
    flightSuretyApp = bd.flightSuretyApp;
    flightSuretyData = bd.flightSuretyData;

    let airline0 = bd.airlines[0];
    let flight0 = airline0.flights[0];
    let insureeAddress = bd.addresses[6];

    let res = await catchResult(() =>
      flightSuretyApp.sendToDataContract({ from: insureeAddress, value: web3.utils.toWei('0.001', 'ether') })
    );
    console.log('sendToDataContract:', res);

    let isFlightRegistered = await flightSuretyApp.isFlightRegistered(
      airline0.address,
      flight0.flight,
      flight0.timestamp
    );
    console.log('isFlightRegistered:', isFlightRegistered);

    let isInsured = await flightSuretyData.isInsured(
      airline0.address,
      flight0.flight,
      flight0.timestamp,
      insureeAddress
    );
    console.log('isInsured:', isInsured);

    let amountWei = web3.utils.toWei('0.1', 'ether');
    let a0 = await web3.eth.getBalance(insureeAddress);
    console.log('insureeAddress balance:', a0);

    res = await catchResult(() =>
      flightSuretyApp.buyInsurance(airline0.address, flight0.flight, flight0.timestamp, {
        from: insureeAddress,
        value: amountWei
      })
    );
    console.log('buyInsurance:', res);

    let a1 = await web3.eth.getBalance(insureeAddress);
    console.log('buyInsurance balance:', a1);
    console.log('diff:', a0 - a1);
    process.exit(0);
  } catch (e) {
    console.error('async_run', e);
    process.exit(1);
  } finally {
    console.log('async_run DONE');
  }
}
