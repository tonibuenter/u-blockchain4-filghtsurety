const FlightSuretyApp = artifacts.require('FlightSuretyApp');
const FlightSuretyData = artifacts.require('FlightSuretyData');
const fs = require('fs');
const deployment8548 = require('../config/deployment8548.json');

const rootConfig = require('../config/rootConfig85.json');

module.exports = async function (deployer) {
  addresses = Object.keys(deployment8548.addresses);

  await deployer.deploy(FlightSuretyData);
  await deployer.deploy(FlightSuretyApp, FlightSuretyData.address);

  console.log('FlightSuretyApp.address:', FlightSuretyApp.address);
  console.log('flightSuretyData.address:', FlightSuretyData.address);

  rootConfig.addresses = addresses;
  rootConfig.defaultAccount = addresses[0];

  for (let i = 0; i < rootConfig.airlines.length; i++) {
    rootConfig.airlines[i].address = addresses[rootConfig.airlines[i].address];
  }

  let oracleAddresses = [];
  for (let index of rootConfig.oracleAddresses) {
    oracleAddresses.push(addresses[index]);
  }
  rootConfig.oracleAddresses = oracleAddresses;

  let json = {
    ...rootConfig,
    flightSuretyApp_address: FlightSuretyApp.address,
    flightSuretyData_address: FlightSuretyData.address,
    migratedTimestamp: new Date().toString()
  };
  let blockchainData = JSON.stringify(json, null, '\t');
  fs.writeFileSync(__dirname + '/../config/blockchainData.json', blockchainData, 'utf-8');
  fs.writeFileSync(__dirname + '/../dapp/src/dapp/config/blockchainData.json', blockchainData, 'utf-8');
  console.log('blockchainData.json:', blockchainData);
};
