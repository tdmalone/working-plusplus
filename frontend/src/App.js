import React, { useState } from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import './App.css';

import NavBar from './components/NavBar';
import Chart from './components/Chart';
import KarmaFeed from './components/KarmaFeed';

function App() {

  const [searchTerm, setSearchTerm] = useState('');

  return (
    <Router>
      <NavBar search={searchTerm} onChange={value => setSearchTerm(value)} onClick={value => setSearchTerm(value)} />
      <Switch>
        	<Route exact path="/" render={ props => (<Chart {...props} search={searchTerm} onClick={value => setSearchTerm(value)} />) } />
          <Route exact path="/feed" render={ props => (<KarmaFeed {...props} search={searchTerm} onClick={value => setSearchTerm(value)} />) } />
      </Switch>
    </Router>
  );
}

export default App;
