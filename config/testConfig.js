const FlightSuretyApp = artifacts.require('FlightSuretyApp');
const FlightSuretyData = artifacts.require('FlightSuretyData');
const BigNumber = require('bignumber.js');
const testData = require('./testData.json');

const Config = async function () {
  let addresses = testData.addresses;

  // read the currently deployed (???) contract
  let flightSuretyData = await FlightSuretyData.deployed();
  let flightSuretyApp = await FlightSuretyApp.deployed();

  web2EventListeners(addresses[0], flightSuretyData.address, flightSuretyApp.address, testData.providerUrl);

  // setup events

  return {
    owner: addresses[0],
    firstAirline: addresses[1],
    secondAirline: addresses[2],
    airline3: addresses[3],
    airline4: addresses[4],
    anyAddress: addresses[5],
    weiMultiple: new BigNumber(10).pow(18),
    addresses: addresses,
    flightSuretyData: flightSuretyData,
    flightSuretyApp: flightSuretyApp
  };
};

module.exports = {
  Config: Config
};

function web2EventListeners(defaultAccount, dataAddress, appAddress, providerUrl) {
  const FlightSuretyData = require('../build/contracts/FlightSuretyData.json');
  const FlightSuretyApp = require('../build/contracts/FlightSuretyApp.json');
  const Web3 = require('web3');

  const web3 = new Web3();
  web3.setProvider(new web3.providers.WebsocketProvider(providerUrl));
  web3.eth.defaultAccount = defaultAccount;

  let flightSuretyData = new web3.eth.Contract(FlightSuretyData.abi, dataAddress);
  let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, appAddress);

  flightSuretyData.events.DataConsole({ fromBlock: 0 }, function (error, event) {
    if (error) console.error(error);

    if (event.event === 'DataConsole') {
      console.log(
        'DataConsole',
        event.returnValues.level,
        event.returnValues.info,
        event.returnValues.int0,
        event.returnValues.int1,
        event.returnValues.int2
      );
    }
  });

  flightSuretyApp.events.AppConsole({ fromBlock: 0 }, function (error, event) {
    if (error) console.log(error);
    if (event.event === 'AppConsole') {
      console.log('AppConsole', event.returnValues.level, event.returnValues.info);
    }
  });
}
