const FlightSuretyApp = require('../../build/contracts/FlightSuretyApp.json');
const config = require('./config.json');
const Web3 = require('web3');
const express = require('express');

const web3 = new Web3();
web3.setProvider(new web3.providers.WebsocketProvider('ws://localhost:7545'));
web3.eth.defaultAccount = '0x03BA45b5b17B9e731395bcD625834B6Ef1A17560';

let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);

flightSuretyApp.events.OracleRequest(
  {
    fromBlock: 0
  },
  function (error, event) {
    if (error) console.log(error);
    console.log(event);
  }
);

const app = express();
app.get('/api', (req, res) => {
  res.send({
    message: 'An API for use with your Dapp!'
  });
});
