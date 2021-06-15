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
  TableRow,
  TextField
} from '@material-ui/core';
import { useDispatch, useSelector } from 'react-redux';
import { ACTIONS, ReduxState } from '../redux';
import { addressFormatter, catchResult } from './utis';
import moment from 'moment';
import BigNumber from 'bignumber.js';

type Flight = { airline: string; flight: string; timestamp: BigNumber };

export default function BuyInsurance(props: any) {
  const web3 = useSelector((state: any) => state.web3);
  const flightSuretyApp = useSelector((state: ReduxState) => state.flightSuretyApp);
  const flightSuretyData = useSelector((state: ReduxState) => state.flightSuretyData);
  const dispatch = useDispatch();
  const [flights, setFlights] = useState<Flight[]>([]);
  const [amountEth, setAmountEth] = useState<number>(0.0);

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

      <TextField
        required
        value={amountEth}
        onChange={(e: any) => setAmountEth(e.target.value)}
        id="standard-required"
        label="Insurance Premium (ETH)"
        defaultValue="0"
      />

      <TableContainer component={Paper}>
        <Table className={'flights'} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Arline</TableCell>
              <TableCell>Flight Name</TableCell>
              <TableCell align="right">Timestamp</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {flights.map((flight, index) => (
              <TableRow key={index}>
                <TableCell component="th" scope="row">
                  {addressFormatter(flight.airline)}
                </TableCell>
                <TableCell>{flight.flight}</TableCell>
                <TableCell align="right">
                  {moment('20210101', 'YYYYMMDD').add(flight.timestamp.toNumber(), 'days').format('YYYY-MM-DD')}
                </TableCell>
                <TableCell align="right">
                  <Button
                    variant="contained"
                    onClick={async () => {
                      try {
                        dispatch({ type: ACTIONS.TX_ON });
                        let amountWei = web3.utils.toWei(amountEth, 'ether');
                        let res: any = await catchResult(() =>
                          flightSuretyApp.buyInsurance(flight.airline, flight.flight, flight.timestamp, {
                            from: metaMask.address,
                            value: amountWei,
                            gas: 3000000
                          })
                        );
                        alert('buyInsurance ' + res);
                      } catch (e) {
                        alert(e);
                      } finally {
                        dispatch({ type: ACTIONS.TX_OFF });
                      }
                    }}
                  >
                    Buy Insurance
                  </Button>

                  <Button
                    variant="contained"
                    onClick={async () => {
                      try {
                        dispatch({ type: ACTIONS.TX_ON });
                        let res: any = await catchResult(() =>
                          flightSuretyApp.fetchFlightStatus(flight.airline, flight.flight, flight.timestamp, {
                            from: metaMask.address
                          })
                        );
                        alert('fetchFlightStatus ' + res);
                      } catch (e) {
                        alert(e);
                      } finally {
                        dispatch({ type: ACTIONS.TX_OFF });
                      }
                    }}
                  >
                    Fetch flight info...
                  </Button>

                  <Button
                    variant="contained"
                    onClick={async () => {
                      try {
                        dispatch({ type: ACTIONS.TX_ON });
                        let { status, amount }: any = await flightSuretyData.insureeStatus(
                          flight.airline,
                          flight.flight,
                          flight.timestamp,
                          metaMask.address
                        );
                        alert(
                          'Insuree Status: ' +
                            status.toString() +
                            ' amount: ' +
                            web3.utils.fromWei(amount, 'ether') +
                            ' ETH'
                        );
                      } catch (e) {
                        alert(e.message);
                      } finally {
                        dispatch({ type: ACTIONS.TX_OFF });
                      }
                    }}
                  >
                    Insuree Status
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}
