const Web3 = require('web3');
var web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:7545'));

console.log(web3.eth.accounts[0]); // should print 10 accounts but its error like eth is undefined
