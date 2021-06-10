const contract = require('truffle-contract');
const express = require('express');

const { catchResult, formatReceit } = require('./truffle-utils');
const { initBlockchainData, initOracleRequest } = require('./common');

const ORACLES = [];

asyncRun();

async function asyncRun() {
  const bd = await initBlockchainData();
  let flightSuretyApp, flightSuretyData;

  try {
    flightSuretyApp = bd.flightSuretyApp;
    flightSuretyData = bd.flightSuretyData;

    await register_oracles();
    await initExpress();
  } catch (e) {
    console.error('asyncRun', e);
  } finally {
    console.log('asyncRun DONE');
  }

  async function initExpress() {
    const expressApp = express();
    expressApp.get('/api', (req, res) => {
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
    for (let oracleAddress of bd.oracleAddresses) {
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

      result = await flightSuretyApp.getMyIndexes({ from: oracleAddress });
      if (result) {
        console.log(`getMyIndexes: ${result[0]}, ${result[1]}, ${result[2]}`);
        for (let i = 0; i < 3; i++) {
          ORACLES[i] = ORACLES[i] || [];
          ORACLES[i].push({ oracleAddress, indexes: [result[0], result[1], result[2]] });
        }
      }
    }

    initOracleRequest(flightSuretyApp, (event) => {
      console.log('>>>', event.returnValues.flight);
    });
  }
}
