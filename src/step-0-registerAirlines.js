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

    console.log('bd.defaultAccount              :', bd.defaultAccount);
    console.log('flightSuretyApp.address        :', flightSuretyApp.address);
    console.log('flightSuretyData.address       :', flightSuretyData.address);
    console.log('flightSuretyApp data contract  :', await flightSuretyApp.getDataContract());
    console.log('flightSuretyData contract owner:', await flightSuretyData.getContractOwner());

    await _registerAirline(bd.airlines[0]);
    await _registerAirline(bd.airlines[1]);
    await _registerAirline(bd.airlines[2]);
    await _registerAirline(bd.airlines[3]);
    await _voteOnAirline();

    await printAirlines(flightSuretyApp, flightSuretyData);
  } catch (e) {
    console.error('async_run', e);
  } finally {
    console.log('async_run DONE');
  }

  async function _registerAirline(airline) {
    console.log('***', airline.name, '***');
    let reason = await catchResult(() => flightSuretyApp.registerAirline(airline.address, airline.name));
    console.log('registerAirline:', reason);
  }

  async function _voteOnAirline() {
    const candidate = bd.airlines[3];
    console.log('*** VOTE ON Candidate:', candidate.name, '***');
    let res = await flightSuretyApp.registrationStatus(candidate.address);
    console.log('registrationStatus:', res.toString());

    let voter = bd.airlines[0];
    console.log('*** VOTER:', voter.name, '***');
    res = await flightSuretyApp.registrationStatus(voter.address, { from: voter.address });
    console.log('registrationStatus (voter):', res.toString());
    let reason = await catchResult(() => flightSuretyApp.voteOnAirline(candidate.address, voter.address, 1));
    console.log('voteOnAirline reason:', reason);

    voter = bd.airlines[1];
    reason = await catchResult(() =>
      flightSuretyApp.voteOnAirline(candidate.address, voter.address, 1, { from: voter.address })
    );
    console.log('voteOnAirline reason:', reason);
  }
}
