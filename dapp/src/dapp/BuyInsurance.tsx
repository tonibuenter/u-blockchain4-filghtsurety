import React, { useEffect, useState } from 'react';
import {
  Button,
  Container,
  Input,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@material-ui/core';
import { useDispatch, useSelector } from 'react-redux';
import { ACTIONS, ReduxState } from '../redux';
import { catchResult } from './utis';

import BigNumber from 'bignumber.js';

type Flight = { airline: string; flight: string; timestamp: BigNumber };

export default function BuyInsurance(props: any) {
  const web3 = useSelector((state: any) => state.web3);
  const flightSuretyApp = useSelector((state: ReduxState) => state.flightSuretyApp);
  const flightSuretyData = useSelector((state: ReduxState) => state.flightSuretyData);
  const dispatch = useDispatch();
  const [flights, setFlights] = useState<Flight[]>([]);
  const [amountWai, setAmountWai] = useState<string>('0');

  const metaMask = useSelector((state: ReduxState) => state.metaMask);

  useEffect(() => {
    let asyncRun = async () => {
      let flights: Flight[] = [];
      try {
        dispatch({ type: ACTIONS.TX_ON });
        let numberOfFlights = (await flightSuretyData.getNumberOfFlights()).toNumber();
        for (let i = 0; i < numberOfFlights; i++) {
          let { airline, flight, timestamp } = await flightSuretyData.getFlightByIndex(i);
          flights.push({ airline, flight, timestamp });
        }
      } catch (e) {
        alert(e.message);
      } finally {
        dispatch({ type: ACTIONS.TX_OFF });
      }
      setFlights(flights);
    };

    asyncRun();
  }, [dispatch, flightSuretyData]);

  return (
    <Container>
      <h2>Buy Insurance!</h2>

      <TableContainer component={Paper}>
        <Table className={'flights'} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Arline</TableCell>
              <TableCell>Flight Name</TableCell>
              <TableCell align="right">Timestamp</TableCell>
              <TableCell>
                <Input
                  placeholder={'Amount in ETH'}
                  value={'' + web3.utils.fromWei(amountWai, 'ether')}
                  onChange={(e: any) => setAmountWai('' + web3.utils.toWei(e.target.value, 'ether'))}
                />
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {flights.map((flight, index) => (
              <TableRow key={index}>
                <TableCell component="th" scope="row">
                  {flight.airline}
                </TableCell>
                <TableCell>{flight.flight}</TableCell>
                <TableCell align="right">{flight.timestamp.toNumber()}</TableCell>
                <TableCell align="right">
                  {
                    <Button
                      onClick={async () => {
                        dispatch({ type: ACTIONS.TX_ON });
                        let res: any = await catchResult(() =>
                          flightSuretyApp.buyInsurance(flight.airline, flight.flight, flight.timestamp, {
                            from: metaMask.address,
                            value: amountWai
                          })
                        );
                        alert('buyInsurance ' + res);
                      }}
                    >
                      Buy Insurance
                    </Button>
                  }
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}
