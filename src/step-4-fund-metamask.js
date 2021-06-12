const { catchResult } = require('./truffle-utils');
const { initBlockchainData, initOracleRequest } = require('./common');

async_run();

async function async_run() {
  try {
    let bd = await initBlockchainData();
    let web3 = bd.web3;
    let metamask = bd.metamask;
    let defaultAccount = bd.defaultAccount;
    console.log('metamask balance ETH:', web3.utils.fromWei(await web3.eth.getBalance(metamask), 'ether'));

    let res = await catchResult(() =>
      web3.eth.sendTransaction({ to: metamask, from: defaultAccount, value: web3.utils.toWei('0.01', 'ether') })
    );
    console.log('sendTransaction:', res);
    console.log('metamask balance ETH:', web3.utils.fromWei(await web3.eth.getBalance(metamask), 'ether'));

    process.exit(0);
  } catch (e) {
    console.error('async_run', e);
    process.exit(1);
  } finally {
    console.log('async_run DONE');
  }
}
