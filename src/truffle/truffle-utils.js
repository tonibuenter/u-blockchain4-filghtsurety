async function catchReason(bfun) {
  try {
    return formatReceit(await bfun());
  } catch (e) {
    return e.reason || e.message || 'FAILED';
  }
}

async function formatReceit(receipt) {
  try {
    if (receipt.tx) {
      // if (receipt.logs) {
      //   for (let log of receipt.logs) {
      //     console.log('>>>EVENT', log.event);
      //   }
      // }
      return 'OK tx: ' + '...' + receipt.tx.substring(receipt.tx.length - 4);
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

module.exports = { catchReason, formatReceit };
