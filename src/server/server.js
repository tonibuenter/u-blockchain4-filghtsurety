const contract = require('truffle-contract');
const express = require('express');

const { catchResult, formatReceit } = require('../truffle-utils');
const bd = require('../../config/blockchainData.json');
const Web3 = require('web3');

const provider = new Web3.providers.WebsocketProvider(bd.providerUrl);
const fsAppJson = require('../../build/contracts/FlightSuretyApp.json');
const fsDataJson = require('../../build/contracts/FlightSuretyData.json');

const web3 = new Web3();
web3.eth.defaultAccount = bd.defaultAccount;
web3.setProvider(provider);

const ORACLES = [];

_main();

async function _main() {
  const faApp = contract(fsAppJson);
  const faData = contract(fsDataJson);
  let deployedApp, deployedData;

  try {
    faApp.setProvider(provider);
    faApp.defaults({ from: bd.defaultAccount });

    faData.setProvider(provider);
    faData.defaults({ from: bd.defaultAccount });

    deployedApp = await faApp.deployed();
    deployedData = await faData.deployed();

    await register_oracles();
    initExpress();

    console.log('REGISTRATION_FEE  :', await deployedApp.REGISTRATION_FEE());
  } catch (e) {
    console.error('_main', e);
  } finally {
    console.log('_main DONE');
  }

  function initExpress() {
    const expressApp = express();
    expressApp.get('/api', (req, res) => {
      res.send({
        message: 'An API for use with your Dapp!'
      });
    });
  }

  async function register_oracles() {
    if (deployedApp) {
      try {
        let fee = await deployedApp.REGISTRATION_FEE();
        console.log('REGISTRATION_FEE:', fee.toString());
        // ACT
        for (let oracleAddress of bd.oracleAddresses) {
          let result = await catchResult(() =>
            deployedApp.registerOracle({
              from: oracleAddress,
              value: fee,
              gas: 3000000
            })
          );
          console.log('registerOracle:', result);

          result = await deployedApp.isOracleRegistered({ from: oracleAddress });
          console.log('isOracleRegistered:', result);

          result = await deployedApp.getMyIndexes({ from: oracleAddress });
          if (result) {
            console.log(`getMyIndexes: ${result[0]}, ${result[1]}, ${result[2]}`);
            for (let i = 0; i < 3; i++) {
              ORACLES[i] = ORACLES[i] || [];
              ORACLES[i].push({ oracleAddress, indexes: [result[0], result[1], result[2]] });
            }
          }
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      console.warn('deployedApp not available');
    }
  }
}
