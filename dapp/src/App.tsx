import React from 'react';
import './App.css';
import Render01 from './Render01';
import Dapp from './dapp/Dapp';
import { createReduxStore } from './redux';
import { Provider } from 'react-redux';

function App() {
  return (
    <Provider store={createReduxStore()}>
      <div className="App">
        <Dapp data={0} />
      </div>
    </Provider>
  );
}

export default App;
