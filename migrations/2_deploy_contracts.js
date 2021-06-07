const FlightSuretyApp = artifacts.require('FlightSuretyApp');
const FlightSuretyData = artifacts.require('FlightSuretyData');
const fs = require('fs');

const rootConfig = require('../config/rootConfig85.json');
const deployment8548 = require('../config/deployment8548.json');

module.exports = async function (deployer) {
  addresses = Object.keys(deployment8548.addresses);

  await deployer.deploy(FlightSuretyData);

  await deployer.deploy(FlightSuretyApp, FlightSuretyData.address);

  console.log('FlightSuretyApp.address:', FlightSuretyApp.address);
  console.log('flightSuretyData.address:', FlightSuretyData.address);

  // await FlightSuretyApp.setDataContract(FlightSuretyData.address);
  // await FlightSuretyData.authorizeCaller(FlightSuretyApp.address);
  //
  // let res = await FlightSuretyApp.isAirline(firstAirline);
  // console.log('FlightSuretyApp.isAirline:', res);
  // res = await FlightSuretyApp.registerAirline(firstAirline, 'First Airline');
  // console.log('FlightSuretyApp.registerAirline; res.tx:', res.tx);
  // res = await FlightSuretyApp.isAirline(firstAirline);
  // console.log('FlightSuretyApp.isAirline:', res);

  console.log(addresses);

  rootConfig.firstAirline = addresses[rootConfig.firstAirline || 0];
  rootConfig.defaultAccount = addresses[rootConfig.defaultAccount || 0];

  for (let i = 0; i < rootConfig.airlines.length; i++) {
    rootConfig.airlines[i].address = addresses[rootConfig.airlines[i].address];
  }

  let oracleAddresses = [];
  for (let index of rootConfig.oracleAddresses) {
    oracleAddresses.push(addresses[index]);
  }
  rootConfig.oracleAddresses = oracleAddresses;

  let config2 = {
    ...rootConfig,
    appAddress: FlightSuretyApp.address,
    dataAddress: FlightSuretyData.address,
    migratedTimestamp: new Date().toString()
  };
  fs.writeFileSync(__dirname + '/../config/testData.json', JSON.stringify(config2, null, '\t'), 'utf-8');
};
