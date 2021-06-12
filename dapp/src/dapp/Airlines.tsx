import React, { useEffect, useState } from 'react';
import Container from '@material-ui/core/Container';

import { useDispatch, useSelector } from 'react-redux';
import { ACTIONS, ReduxState } from '../redux';
import { Airline } from './types';
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@material-ui/core';
import { addressFormatter } from './utis';

export default function Airlines() {
  const flightSuretyData = useSelector((state: ReduxState) => state.flightSuretyData);
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
          let airlineMap: any = {};
          for (let i = 0; i < nrOfAirlines; i++) {
            try {
              let airline: Airline = await flightSuretyData.getAirlineByIndex(i);
              let voteApproval = await flightSuretyData.votingResultsByIndex(i);

              airline = { ...airline, ...voteApproval };
              airlines.push(airline);
              airlineMap[airline.airlineAddress] = airline;
            } catch (e) {
              setMessages((list) => [e.message, ...list]);
            }
          }
          dispatch({ type: 'set', payload: { airlineMap } });
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

      <TableContainer component={Paper}>
        <Table className={'flights'} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Name of </TableCell>
              <TableCell>Address</TableCell>
              <TableCell align="right">Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {airlines.map((airline, index) => (
              <TableRow key={index}>
                <TableCell component="th" scope="row">
                  {airline.airlineName}
                </TableCell>
                <TableCell>{addressFormatter(airline.airlineAddress)}</TableCell>
                <TableCell align="right">{airline.airlineStatus.toString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <hr />
      <h2>Messages</h2>
      <div className={'messages'}>
        <pre>{messages.map((m) => m + '\n')}</pre>
      </div>
    </Container>
  );
}
