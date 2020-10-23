import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import './App.css';

import Chart from './components/Chart';
import KarmaFeed from './components/KarmaFeed';

function App() {
  return (
    <Router>
      <Switch>
      	<Route exact path="/" component={Chart} />
      	<Route exact path="/feed" component={KarmaFeed} />
      </Switch>
    </Router>
  );
}

export default App;
