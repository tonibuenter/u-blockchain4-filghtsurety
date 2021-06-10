module.exports = { catchResult, formatReceit };

async function catchResult(bfun, mode) {
  try {
    let res = await bfun();
    return formatReceit(res, mode);
  } catch (e) {
    return e.reason || e.message || 'FAILED';
  }
}

async function formatReceit(receipt, mode) {
  try {
    if (mode === 'pure') {
      return receipt;
    }
    if (receipt.tx) {
      // if (receipt.logs) {
      //   for (let log of receipt.logs) {
      //     console.log('>>>EVENT', log.event);
      //   }
      // }
      return 'OK tx: ' + addressFormatter(receipt.tx);
    } else if (receipt.toString && typeof receipt === 'object') {
      return JSON.stringify(receipt);
    } else if (receipt.toString) {
      return receipt.toString();
    } else {
      return receipt;
    }
  } catch (e) {
    return e.reason || e.message || 'FAILED';
  }
}

async function _run0() {
  const faApp = contract(fsAppJson);

  try {
    faApp.setProvider(provider);
    let instance0 = await faApp.new({ from: testData.defaultAccount });
    console.log('instance0.address:', instance0.address);
    let instance1 = await faApp.new({ from: testData.defaultAccount });
    console.log('instance1.address:', instance1.address);
  } catch (e) {
    console.error('_run0', e);
  } finally {
    console.log('_run0 DONE');
  }
}

function addressFormatter(address) {
  return address.substring(0, 6) + '...' + address.substring(address.length - 4);
}
