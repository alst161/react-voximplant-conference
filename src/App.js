import React from 'react';
import {BrowserRouter,Route,Switch} from 'react-router-dom'
import VideoCall from './VideoCall'
import './App.css';

function App() {
  return (
    <div className="App">
      <a href="/client">Клиент</a><br/>
      <a href="/spec">Спец</a>
      <BrowserRouter>
        <Switch>
          <Route path="/client" component={() => <VideoCall login="client" caller="spec" />}/>
          <Route path="/spec" component={() => <VideoCall login="spec" caller="client" />}/>
        </Switch>
      </BrowserRouter>
    </div>
  );
}

export default App;
