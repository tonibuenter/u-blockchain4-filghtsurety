import React, { useEffect, useState } from 'react';
import Container from '@material-ui/core/Container';
import { useDispatch, useSelector } from 'react-redux';
import { ACTIONS, ReduxState } from '../redux';
import { getMetaskAccountID, initWeb3 } from './metaMaskUtils';
import flightSuretyAppJson from './contracts/FlightSuretyApp.json';
import flightSuretyDataJson from './contracts/FlightSuretyData.json';
import { errorLog } from './utis';
import { Button } from '@material-ui/core';
import bd from './config/blockchainData.json';
import './Dapp.css';
const contract = require('@truffle/contract');

type Address = { address: string; name: string; eth: string };

export default function Blockchain() {
  const metaMask = useSelector((state: ReduxState) => state.metaMask);
  const flightSuretyData = useSelector((state: ReduxState) => state.flightSuretyData);
  const flightSuretyApp = useSelector((state: ReduxState) => state.flightSuretyApp);
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

      _addresses.push({ name: 'metamask', address: metaMask ? metaMask.address : '...', eth: '0' });
      _addresses.push({
        name: 'flightSuretyApp',
        address: flightSuretyApp ? flightSuretyApp.address : '...',
        eth: '0'
      });
      _addresses.push({
        name: 'flightSuretyData',
        address: flightSuretyData ? flightSuretyData.address : '...',
        eth: '0'
      });
      bd.addresses.map((address, i) => {
        _addresses.push({ name: 'a-' + i, address, eth: '0' });
      });
      try {
        dispatch({ type: ACTIONS.TX_ON });
        for (let entry of _addresses) {
          entry.eth = web3.utils.fromWei(await web3.eth.getBalance(entry.address), 'ether');
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
      <h2>Contracts</h2>

      <div>Network</div>
      <div>{metaMask.network}</div>
      <div>FLIGHT_SURETY_APP</div>
      <div>{flightSuretyApp ? flightSuretyApp.address : 'Contract flightSuretyApp not available'}</div>
      <div>FLIGHT_SURETY_DATA</div>
      <div>{flightSuretyData ? flightSuretyData.address : 'Contract flightSuretyData not available'}</div>

      <div>
        {/*<Button*/}
        {/*  variant="contained"*/}
        {/*  color="primary"*/}
        {/*  onClick={async () => {*/}
        {/*    try {*/}
        {/*      dispatch({ type: ACTIONS.TX_ON });*/}
        {/*      let b;*/}
        {/*      console.log('def account balance:', (b = await web3.eth.getBalance(bd.addresses[5])));*/}
        {/*      let fromAddress = bd.addresses[5];*/}
        {/*      let toAddress = bd.addresses[1];*/}
        {/*      debugger;*/}
        {/*      await web3.eth.sendTransaction({*/}
        {/*        to: toAddress,*/}
        {/*        from: fromAddress,*/}
        {/*        value: web3.utils.toWei('0.5', 'ether')*/}
        {/*      });*/}
        {/*      setRefresh((i) => i + 1);*/}
        {/*    } catch (e) {*/}
        {/*      alert(e.message);*/}
        {/*      console.error(e);*/}
        {/*    } finally {*/}
        {/*      dispatch({ type: ACTIONS.TX_OFF });*/}
        {/*    }*/}
        {/*  }}*/}
        {/*>*/}
        {/*  Add 10Eth to MM Address*/}
        {/*</Button>*/}
      </div>
      <h2>All Addresses</h2>
      <table className={'dapp address-table'}>
        {addresses.map((entry) => (
          <tr>
            <td>{entry.name}</td>
            <td>{entry.address}</td>
            <td>{entry.eth}</td>
          </tr>
        ))}
      </table>
      <div>
        <Button variant="contained" color="primary" onClick={() => setRefresh((i) => i + 1)}>
          refresh
        </Button>
      </div>
    </Container>
  );
}
