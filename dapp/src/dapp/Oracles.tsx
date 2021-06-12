import React from 'react';
import { Button, Container } from '@material-ui/core';
import { useDispatch, useSelector } from 'react-redux';
import { ACTIONS, ReduxState } from '../redux';
import config from './config/blockchainData.json';
import { catchResult } from './utis';

const airlineAddress0 = config.airlines[0].address;
const flight0 = config.airlines[0].flights[0].flight;
const timestamp0 = config.airlines[0].flights[0].timestamp;

export default function Oracles() {
  const flightSuretyApp = useSelector((state: ReduxState) => state.flightSuretyApp);
  const metaMask = useSelector((state: ReduxState) => state.metaMask);
  const dispatch = useDispatch();

  return (
    <Container>
      {flightSuretyApp ? (
        <Button
          variant="contained"
          color="primary"
          onClick={async () => {
            dispatch({ type: ACTIONS.TX_ON });
            debugger;
            try {
              let res = await catchResult(() =>
                flightSuretyApp.fetchFlightStatus(airlineAddress0, flight0, timestamp0, {
                  from: metaMask.address,
                  gas: 3000000
                })
              );
              alert('res: ' + res);
            } catch (e) {
              console.log('fetchFlightStatus', e);
            } finally {
              dispatch({ type: ACTIONS.TX_OFF });
            }
          }}
        >
          Fetch Flight Status (Generate a request for oracles to fetch flight information)
        </Button>
      ) : (
        <div>not connected...</div>
      )}
    </Container>
  );
}
