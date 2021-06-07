var HDWalletProvider = require('truffle-hdwallet-provider');
var mnemonic = 'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat';

module.exports = {
  networks: {
    development: {
      host: '127.0.0.1',
      port: 8545,
      network_id: '*' // Match any network id
    },
    development85: {
      provider: function () {
        return new HDWalletProvider(mnemonic, 'http://127.0.0.1:8545/', 0, 50);
      },
      network_id: '*',
      gas: 9999999
    }
  },
  rinkeby: {
    host: 'localhost', // Localhost (default: none)
    provider: function () {
      return new HDWalletProvider(config.privateKey, 'https://rinkeby.infura.io/v3/' + config.projectId);
    },
    network_id: 4,
    gas: 6700000,
    gasPrice: 10000000000
  },
  compilers: {
    solc: {
      // version: "^0.4.24"
      version: '^0.6.0'
    }
  }
};
