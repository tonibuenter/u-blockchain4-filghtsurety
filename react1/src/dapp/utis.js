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
