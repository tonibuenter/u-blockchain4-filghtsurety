import $ from 'jquery';

export function infoLog(txt) {
  $('#log-data').prepend($('<div>').text(txt));
}

export function errorLog(txt) {
  $('#log-data').prepend($('<div>').addClass('error').text(txt));
}

export function successLog(txt) {
  $('#log-data').prepend($('<div>').addClass('success').text(txt));
}

export async function catchResult(bfun, mode) {
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

export function addressFormatter(address) {
  return address ? address.substring(0, 6) + '...' + address.substring(address.length - 4) : '';
}
