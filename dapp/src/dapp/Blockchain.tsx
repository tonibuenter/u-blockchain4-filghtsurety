import React, { useEffect, useState } from 'react';
import Container from '@material-ui/core/Container';
import { useDispatch, useSelector } from 'react-redux';
import { ACTIONS, ReduxState } from '../redux';
import { getMetaskAccountID, initWeb3 } from './metaMaskUtils';
import flightSuretyAppJson from './contracts/FlightSuretyApp.json';
import flightSuretyDataJson from './contracts/FlightSuretyData.json';
import { errorLog, addressFormatter } from './utis';
import {
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider
} from '@material-ui/core';
import bd from './config/blockchainData.json';
import './Dapp.css';

const contract = require('@truffle/contract');

type Address = { address: string; name: string; eth: string };

export default function Blockchain() {
  const metaMask = useSelector((state: ReduxState) => state.metaMask);
  const flightSuretyData = useSelector((state: ReduxState) => state.flightSuretyData);
  const flightSuretyApp = useSelector((state: ReduxState) => state.flightSuretyApp);
  const airlineMap = useSelector((state: ReduxState) => state.airlineMap);
  const dispatch = useDispatch();
  const web3 = useSelector((state: any) => state.web3);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const _run = async () => {
      if (!metaMask.address) {
        let { web3Provider, web3 } = await initWeb3();

        dispatch({ type: 'set', payload: { web3 } });

        let metamaskAccountID = await getMetaskAccountID();

        let _flightSuretyApp = contract(flightSuretyAppJson);
        _flightSuretyApp.setProvider(web3Provider);

        let _flightSuretyData = contract(flightSuretyDataJson);
        _flightSuretyData.setProvider(web3Provider);

        try {
          let flightSuretyApp = await _flightSuretyApp.deployed();
          dispatch({ type: ACTIONS.SET_FLIGHT_SURETY_APP, payload: flightSuretyApp });
        } catch (e) {
          errorLog('flightSuretyApp: ' + e.message);
        }

        try {
          let flightSuretyData = await _flightSuretyData.deployed();
          dispatch({ type: ACTIONS.SET_FLIGHT_SURETY_DATA, payload: flightSuretyData });
        } catch (e) {
          errorLog('flightSuretyData: ' + e.message);
        }

        dispatch({ type: ACTIONS.SET_MM, payload: { address: metamaskAccountID, network: '...' } });
      }
    };

    _run();
  }, [dispatch, metaMask]);

  useEffect(() => {
    const _run = async () => {
      let _addresses: Address[] = [];
      _addresses.push({ name: 'metamask', address: metaMask ? metaMask.address : '', eth: '0' });

      _addresses.push({
        name: 'flightSuretyApp',
        address: flightSuretyApp ? flightSuretyApp.address : '',
        eth: '0'
      });
      _addresses.push({
        name: 'flightSuretyData',
        address: flightSuretyData ? flightSuretyData.address : '',
        eth: '0'
      });
      bd.addresses.map((address, i) => {
        _addresses.push({ name: 'a-' + i, address, eth: '0' });
      });
      try {
        dispatch({ type: ACTIONS.TX_ON });
        for (let entry of _addresses) {
          entry.eth = entry.address ? web3.utils.fromWei(await web3.eth.getBalance(entry.address), 'ether') : '-';
        }
      } catch (e) {
        console.error(e);
      } finally {
        dispatch({ type: ACTIONS.TX_OFF });
      }
      setAddresses(_addresses);
    };
    if (web3) {
      _run();
    }
  }, [web3, refresh, dispatch, metaMask.address, metaMask, flightSuretyApp, flightSuretyData]);

  return (
    <Container>
      <h2>
        Addresses{' '}
        <Button variant="contained" color="primary" onClick={() => setRefresh((i) => i + 1)}>
          refresh
        </Button>
      </h2>

      <TableContainer component={Paper}>
        <Table className={'flights'} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Address</TableCell>
              <TableCell>type</TableCell>
              <TableCell align="right">Balance (ETH)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {addresses.map((entry, index) => (
              <TableRow key={index}>
                <TableCell component="th" scope="row">
                  {entry.name}
                </TableCell>
                <TableCell>{addressFormatter(entry.address)}</TableCell>
                <TableCell align="center">{airlineMap ? (airlineMap[entry.address] ? 'isAirline' : '') : ''}</TableCell>
                <TableCell align="right">{entry.eth}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}
