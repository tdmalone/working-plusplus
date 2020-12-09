import React, { useState } from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import { createBrowserHistory } from "history";
import queryString from 'query-string';

import './App.css';

import NavBar from './components/NavBar';
import Chart from './components/Chart';
import KarmaFeed from './components/KarmaFeed';
import UserProfile from './components/UserProfile';

const history = createBrowserHistory();

function App() {

  const [searchTerm, setSearchTerm] = useState('');
  const [newQuery, setNewQuery] = useState(history.location.search);

  const parsedQuery = queryString.parse(history.location.search);

  const changeParams = channelId => {

    history.push({
      pathname: history.location.pathname,
      search: '?token=' + parsedQuery.token + '&ts=' + parsedQuery.ts + '&botUser=' + parsedQuery.botUser + '&channel=' + channelId
    });

    setNewQuery(history.location.search);

  }

  return (
    <Router history={history}>
      <NavBar search={searchTerm} newQuery={newQuery} history={history} onChange={value => setSearchTerm(value)} onClick={value => setSearchTerm(value)} />
      <Switch>
        	<Route exact path="/" render={ props => (<Chart {...props} search={searchTerm} onClick={value => setSearchTerm(value)} />) } />
          <Route exact path="/feed" render={ props => (<KarmaFeed {...props} search={searchTerm} onClick={value => setSearchTerm(value)} />) } />
          <Route path="/user/:user">
            <UserProfile search={searchTerm} />
          </Route>
      </Switch>
    </Router>
  );
}

export default App;
