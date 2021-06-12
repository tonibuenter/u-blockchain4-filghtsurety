import { createStore } from 'redux';
import { MetaMask } from './types';

export const ACTIONS = {
  SET_MM: 'SET_MM',
  TX_ON: 'TX_ON',
  TX_OFF: 'TX_OFF',
  SET_FLIGHT_SURETY_APP: 'SET_FLIGHT_SURETY_APP',
  SET_FLIGHT_SURETY_DATA: 'SET_FLIGHT_SURETY_DATA'
};

export type ReduxState = {
  metaMask: MetaMask;
  tx: boolean;
  flightSuretyApp: any;
  flightSuretyData: any;
  airlineMap: any;
};

const initialState = (): ReduxState => ({
  metaMask: { network: 'not-connected', address: '' },
  tx: false,
  flightSuretyApp: null,
  flightSuretyData: null,
  airlineMap: {}
});

export let store: any;

export function createReduxStore() {
  store = createStore(reducer0);
  return store;
}

function reducer0(state = initialState(), action: any) {
  switch (action.type) {
    case ACTIONS.SET_MM: {
      const { network, address } = action.payload;
      const metaMask = { network, address };
      return {
        ...state,
        metaMask
      };
    }
    case ACTIONS.TX_ON: {
      return {
        ...state,
        tx: true
      };
    }
    case ACTIONS.TX_OFF: {
      return {
        ...state,
        tx: false
      };
    }
    case ACTIONS.SET_FLIGHT_SURETY_APP: {
      return {
        ...state,
        flightSuretyApp: action.payload
      };
    }
    case ACTIONS.SET_FLIGHT_SURETY_DATA: {
      return {
        ...state,
        flightSuretyData: action.payload
      };
    }
    case 'set': {
      return {
        ...state,
        ...action.payload
      };
    }
    default:
      return state;
  }
}
