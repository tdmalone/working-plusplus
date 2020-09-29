import React from 'react'
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import './App.css';

import Chart from './components/Chart';

function App() {
  return (
    <Router>
      <Switch>
      	<Route path="/" component={Chart} />
      </Switch>
    </Router>
  );
}

export default App;
