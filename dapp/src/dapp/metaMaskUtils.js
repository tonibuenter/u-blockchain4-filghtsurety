import { errorLog, successLog } from './utis';
import Web3 from 'web3';

export async function initWeb3() {
  /// Find or Inject Web3 Provider
  /// Modern dapp browsers...
  let web3Provider, web3;
  if (window.ethereum) {
    web3Provider = window.ethereum;
    try {
      // Request account access
      await window.ethereum.enable();
      successLog('DONE: window.ethereum.enable');
    } catch (error) {
      errorLog('User denied account access');
    }
  }
  // Legacy dapp browsers...
  else if (window.web3) {
    web3Provider = window.web3.currentProvider;
    successLog('DONE: window.web3');
  }
  // If no injected web3 instance is detected, fall back to Ganache
  else {
    web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    successLog('DONE: Fallback to Ganache');
  }
  web3 = new Web3(web3Provider);

  return { web3Provider, web3 };
}

export async function getMetaskAccountID() {
  let metamaskAccountID;
  try {
    const res = await window.ethereum.request({ method: 'eth_accounts' });
    console.log('getMetaskID:', res);
    successLog(`getMetaskID: ${res.join(';')}`);
    metamaskAccountID = res[0];
  } catch (error) {
    console.log('Error:', error);
    errorLog('eth_accounts ' + error.message);
  }
  return metamaskAccountID;
}
