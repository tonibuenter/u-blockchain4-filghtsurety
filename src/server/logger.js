const FlightSuretyApp = require('../../build/contracts/FlightSuretyApp.json');
const testData = require('../../config/testData.json');
const Web3 = require('web3');
const express = require('express');

const web3 = new Web3();
web3.eth.defaultAccount = testData.defaultAccount;
web3.setProvider(new web3.providers.WebsocketProvider(testData.providerUrl));

let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, testData.appAddress);

flightSuretyApp.events.AppConsole(
  {
    fromBlock: 0
  },
  async function (error, event) {
    if (error) {
      console.log(error);
      return;
    }
    console.log(event.returnValues[0], event.returnValues[1]);
  }
);

const app = express();
