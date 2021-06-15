const { initBlockchainData } = require('../src/common');
const { catchResult } = require('../src/truffle-utils');

contract('Oracles', async (accounts) => {
  const TEST_ORACLES_COUNT = 5;
  var bd;
  var web3;
  var oracleAddresses = [];
  before('setup contract', async () => {
    bd = await initBlockchainData();
    web3 = bd.web3;

    for (let i = 10; i < bd.addresses.length && i - 10 < TEST_ORACLES_COUNT; i++) {
      oracleAddresses.push(bd.addresses[i]);
    }
  });

  it('can register oracles', async () => {
    // ARRANGE
    let fee = await bd.flightSuretyApp.REGISTRATION_FEE.call();

    // ACT
    for (let a of oracleAddresses) {
      let res = await catchResult(() => bd.flightSuretyApp.registerOracle({ from: a, value: fee }));
      console.log('res:', res);
      assert.equal(
        res.startsWith('OK') || 'ORACLE_ALREADY_REGISTERED' === res,
        true,
        `Oracle registration not successful with ${a}`
      );
      let result = await bd.flightSuretyApp.getMyIndexes.call({ from: a });
      console.log(`Oracle Registered: ${result[0]}, ${result[1]}, ${result[2]}`);
    }
  });

  it('can request flight status', async () => {
    // ARRANGE
    let flight = 'ND1309'; // Course number
    let timestamp = Math.floor(Date.now() / 1000);

    // Submit a request for oracles to get status information for a flight
    await bd.flightSuretyApp.fetchFlightStatus(bd.addresses[0], flight, timestamp);
    // ACT

    for (let a of oracleAddresses) {
      // Get oracle information
      let oracleIndexes = await bd.flightSuretyApp.getMyIndexes.call({ from: a });
      for (let idx = 0; idx < 3; idx++) {
        // Submit a response...it will only be accepted if there is an Index match
        let res = await catchResult(() =>
          bd.flightSuretyApp.submitOracleResponse(
            oracleIndexes[idx],
            bd.addresses[0],
            flight,
            timestamp,
            bd.flightStatusCode.STATUS_CODE_ON_TIME,
            { from: a }
          )
        );
        console.log('submitOracleResponse:', res);
        assert.equal(
          res.startsWith('OK') || 'INDEX_DOES_NOT_MATCH_ORACLE_REQUEST' === res || 'FLIGHT_KEY_DOES_NO_MATCH' === res,
          true,
          'Unexpected answer!'
        );
      }
    }
  });
});
