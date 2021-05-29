const FlightSuretyApp = artifacts.require('FlightSuretyApp');
const FlightSuretyData = artifacts.require('FlightSuretyData');
const BigNumber = require('bignumber.js');

const Config = async function (accounts) {
  // These test addresses are useful when you need to add
  // multiple users in test scripts
  let testAddresses = [
    '0x16a5bafDf0A8b1de7fEd211eD081FD3f1E90D143',
    '0xdCBFa0672bd70024B53c7116DE6d1591D14A36e5',
    '0x82155C988f403F29c7C680A07dFdc7B43483AF2E',
    '0x51dD7bA2f46b2000Bea6FA5745E2A38299dFFc9D'
  ];

  let owner = accounts[0];
  let firstAirline = accounts[1];

  let flightSuretyData = await FlightSuretyData.new();
  let flightSuretyApp = await FlightSuretyApp.new(flightSuretyData.address);

  return {
    owner: owner,
    firstAirline: firstAirline,
    weiMultiple: new BigNumber(10).pow(18),
    testAddresses: testAddresses,
    anyAddress: testAddresses[0],
    flightSuretyData: flightSuretyData
    // flightSuretyApp: flightSuretyApp
  };
};

module.exports = {
  Config: Config
};
