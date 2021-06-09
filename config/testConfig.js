const FlightSuretyApp = artifacts.require('FlightSuretyApp');
const FlightSuretyData = artifacts.require('FlightSuretyData');
const BigNumber = require('bignumber.js');

const testData = require('./blockchainData.json');

async function initTest(addresses) {
  // read the currently deployed (???) contract
  let flightSuretyData = await FlightSuretyData.deployed();
  let flightSuretyApp = await FlightSuretyApp.deployed();

  await flightSuretyApp.setDataContract(flightSuretyData.address);
  await flightSuretyData.authorizeCaller(flightSuretyApp.address);

  // setup events

  return {
    ...testData,
    weiMultiple: new BigNumber(10).pow(18),
    flightSuretyData,
    flightSuretyApp,
    appAddress: flightSuretyApp.address,
    dataAddress: flightSuretyData.address
  };
}

module.exports = {
  initTest
};
