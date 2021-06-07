import React from 'react';
import { Button, Container } from '@material-ui/core';
import { useDispatch, useSelector } from 'react-redux';
import { ACTIONS } from '../redux';
import config from './config/testData.json';

const airlineAddress0 = config.airlines[0].address;
const flight0 = config.airlines[0].flights[0].flight;
const timestamp0 = config.airlines[0].flights[0].timestamp;

export default function Oracles(props: any) {
  const flightSuretyApp = useSelector((state) => state.flightSuretyApp);
  const dispatch = useDispatch();

  return (
    <Container>
      {flightSuretyApp ? (
        <Button
          onClick={async () => {
            dispatch({ type: ACTIONS.TX_ON });
            try {
              await flightSuretyApp.fetchFlightStatus(airlineAddress0, flight0, timestamp0);
            } catch (e) {
              console.log('fetchFlightStatus', e);
            } finally {
              dispatch({ type: ACTIONS.TX_OFF });
            }
          }}
        >
          Fetch Flight Status
        </Button>
      ) : (
        <div>not connected...</div>
      )}
    </Container>
  );
}
