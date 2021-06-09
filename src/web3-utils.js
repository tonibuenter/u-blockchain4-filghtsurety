function web2EventListeners(defaultAccount, dataAddress, appAddress, providerUrl) {
  const FlightSuretyData = require('../build/contracts/FlightSuretyData.json');
  const FlightSuretyApp = require('../build/contracts/FlightSuretyApp.json');
  const Web3 = require('web3');

  const web3 = new Web3();
  web3.setProvider(new web3.providers.WebsocketProvider(providerUrl));
  web3.eth.defaultAccount = defaultAccount;

  let flightSuretyData = new web3.eth.Contract(FlightSuretyData.abi, dataAddress);
  let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, appAddress);

  // flightSuretyData.events.Console({ fromBlock: 0 }, function (error, event) {
  //   if (error) console.error(error);
  //
  //   if (event.event === 'DataConsole') {
  //     console.log(
  //       'DataConsole',
  //       event.returnValues.level,
  //       event.returnValues.info,
  //       event.returnValues.int0,
  //       event.returnValues.int1,
  //       event.returnValues.int2
  //     );
  //   }
  // });

  flightSuretyApp.events.AppConsole({ fromBlock: 0 }, function (error, event) {
    if (error) console.log(error);
    if (event.event === 'AppConsole') {
      console.log('AppConsole', event.returnValues.level, event.returnValues.info);
    }
  });
}

const Web3 = require('web3');
const web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider('http://localhost:7545'));
const receipt2 = await web3.eth.getTransactionReceipt(receipt.tx);

function processReceipt(receipt) {
  const { logs } = receipt;
  for (let log of logs) {
    console.info('event:', log.event);
  }
}
