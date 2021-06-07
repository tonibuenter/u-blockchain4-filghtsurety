import React, { useEffect } from 'react';
import Container from '@material-ui/core/Container';

import { useDispatch, useSelector } from 'react-redux';
import { ACTIONS, ReduxState } from '../redux';
import { getMetaskAccountID, initWeb3 } from './metaMaskUtils';
import flightSuretyAppJson from './contracts/FlightSuretyApp.json';
import flightSuretyDataJson from './contracts/FlightSuretyData.json';

const contract = require('@truffle/contract');

export default function Blockchain() {
  const metaMask = useSelector((state: ReduxState) => state.metaMask);
  const flightSuretyData = useSelector((state: ReduxState) => state.flightSuretyData);
  const flightSuretyApp = useSelector((state: ReduxState) => state.flightSuretyApp);
  const dispatch = useDispatch();

  useEffect(() => {
    const _run = async () => {
      if (!metaMask.address) {
        let { web3Provider, web3 } = await initWeb3();
        let metamaskAccountID = await getMetaskAccountID();

        let _flightSuretyApp = contract(flightSuretyAppJson);
        _flightSuretyApp.setProvider(web3Provider);
        let _flightSuretyData = contract(flightSuretyDataJson);
        _flightSuretyData.setProvider(web3Provider);

        let deployed = await _flightSuretyApp.deployed();

        dispatch({ type: ACTIONS.SET_FLIGHT_SURETY_APP, payload: deployed });
        dispatch({ type: ACTIONS.SET_FLIGHT_SURETY_DATA, payload: await _flightSuretyData.deployed() });
        debugger;
        dispatch({ type: ACTIONS.SET_MM, payload: { address: metamaskAccountID, network: '...' } });
        //alert('MM DONE');
      }
    };

    _run();
  }, [dispatch, metaMask]);

  return (
    <Container>
      <div>Address</div>
      <div>{metaMask.address || 'no-address'}</div>
      <div>Network</div>
      <div>{metaMask.network}</div>
      <div>FLIGHT_SURETY_APP</div>
      <div>{flightSuretyApp ? flightSuretyApp.address : 'Contract flightSuretyApp not available'}</div>
      <div>FLIGHT_SURETY_DATA</div>
      <div>{flightSuretyData ? flightSuretyData.address : 'Contract flightSuretyData not available'}</div>
    </Container>
  );
}
