import React, { useEffect, useState } from 'react';
import Container from '@material-ui/core/Container';

import { useDispatch, useSelector } from 'react-redux';
import { ACTIONS, ReduxState } from '../redux';
import { Airline } from './types';

export default function Airlines() {
  const flightSuretyData = useSelector((state: ReduxState) => state.flightSuretyData);
  const flightSuretyApp = useSelector((state: ReduxState) => state.flightSuretyApp);
  const dispatch = useDispatch();

  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    const _run = async () => {
      if (flightSuretyData) {
        let airlines: Airline[] = [];
        try {
          dispatch({ type: ACTIONS.TX_ON });
          let nrOfAirlines = await flightSuretyData.numberOfAirlines();
          for (let i = 0; i < nrOfAirlines; i++) {
            try {
              let airline: Airline = await flightSuretyData.getAirlineByIndex(i);
              let voteApproval = await flightSuretyData.votingResultsByIndex(i);

              airline = { ...airline, ...voteApproval };
              airlines.push(airline);
            } catch (e) {
              setMessages((list) => [e.message, ...list]);
            }
          }
        } catch (e) {
          console.error(e);
        } finally {
          dispatch({ type: ACTIONS.TX_OFF });
        }
        setAirlines(airlines);
      } else {
        console.warn('no flightSuretyData');
      }
    };

    _run();
  }, [dispatch, flightSuretyData]);

  return (
    <Container>
      <h2>Airlines</h2>
      <div>
        {airlines.map((airline) => (
          <div>
            <div>{airline.airlineName}</div>
            <div>{airline.airlineAddress}</div>
            <div>{airline.airlineStatus.toString()}</div>
          </div>
        ))}
      </div>
      <hr />
      <h2>Messages</h2>
      <div className={'messsages'}>
        <pre>{messages.map((m) => m + '\n')}</pre>
      </div>
    </Container>
  );
}
