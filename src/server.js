const express = require('express');

const { catchResult } = require('./truffle-utils');
const { initBlockchainData, initOracleRequest } = require('./common');

const ORACLES = [];
const NR_OF_ORACLES = 19;

asyncRun();

async function asyncRun() {
  const bd = await initBlockchainData();
  let flightSuretyApp, web3;

  try {
    flightSuretyApp = bd.flightSuretyApp;
    web3 = bd.web3;
    await register_oracles();
    await initExpress();
  } catch (e) {
    console.error('asyncRun', e);
  } finally {
    console.log('asyncRun DONE');
  }

  async function initExpress() {
    const expressApp = express();
    expressApp.get('/api', async (req, res) => {
      let action = req.query.action;
      if (action === 'triggerOracle') {
        // nothing todo
      }
      res.send({
        message: 'An API for use with your Dapp!'
      });
    });

    expressApp.listen(bd.serverPort || 3030, () => {
      console.log(`Example app listening at http://localhost:${bd.serverPort || 3030}`);
    });
  }

  async function register_oracles() {
    let fee = await flightSuretyApp.REGISTRATION_FEE();
    console.log('REGISTRATION_FEE:', fee.toString());
    // ACT

    for (let i = 0; i < NR_OF_ORACLES; i++) {
      let oracleAddress = bd.addresses[10 + i];
      if (oracleAddress) {
        console.log(`Try to register address as oracle :${i}.`);
        let result = await catchResult(() =>
          flightSuretyApp.registerOracle({
            from: oracleAddress,
            value: fee,
            gas: 3000000
          })
        );
        console.log('registerOracle:', result);
        result = await flightSuretyApp.isOracleRegistered({ from: oracleAddress });
        console.log('isOracleRegistered:', result);

        try {
          result = await flightSuretyApp.getMyIndexes({ from: oracleAddress });
          if (result) {
            console.log(`getMyIndexes: ${result[0]}, ${result[1]}, ${result[2]}`);
            ORACLES.push({
              oracleAddress,
              indexes: [result[0].toString(), result[1].toString(), result[2].toString()]
            });
          }
        } catch (e) {}
      }
    }
  }

  initOracleRequest(flightSuretyApp, async (event) => {
    let flightStatusCode = bd.flightStatusCode;
    let index = event.returnValues.index;
    let airline = event.returnValues.airline;
    let flight = event.returnValues.flight;
    let timestamp = event.returnValues.timestamp.toString();
    for (let oracle of ORACLES) {
      if (oracle.indexes.includes(index)) {
        let statusCode = randomCode(flightStatusCode);
        console.log(`Try to submitOracleResponse ${flight}, ${timestamp} with statusCode: ${statusCode}.`);
        let res = await catchResult(() =>
          flightSuretyApp.submitOracleResponse(+index, airline, flight, +timestamp, statusCode, {
            from: oracle.oracleAddress
          })
        );
        console.log('submitOracleResponse:', res);
      }
    }
  });

  function randomCode(flightStatusCodes) {
    let values = Object.values(flightStatusCodes);
    let randomIndex = Math.floor(Math.random() * values.length);
    return values[randomIndex];
  }
}
