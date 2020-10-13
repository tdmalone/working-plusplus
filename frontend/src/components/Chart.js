import React, { useState, useEffect } from 'react';
import axios from 'axios';
import queryString from 'query-string';
import moment from 'moment';
import logo from '../logo.svg';
import {
  Collapse,
  Navbar,
  NavbarToggler,
  NavbarBrand,
  Nav,
  Button,
  ButtonGroup,
  ButtonDropdown,
  DropdownMenu,
  DropdownItem,
  DropdownToggle
} from 'reactstrap';

const Chart = (props) => {

  const apiURL = process.env.REACT_APP_API_URL;

  const parsedQuery = queryString.parse(props.location.search);
  const botUser = parsedQuery.botUser;
  const token = parsedQuery.token;
  const ts = parsedQuery.ts;

  const [channel, setChannel] = useState(parsedQuery.channel);
  const [startDate, setStartDate] = useState(moment(0).unix());
  const [endDate, setEndDate] = useState(moment().unix());
  const today = moment().unix();

  // const apiURL = 'https://a564aa475f76.eu.ngrok.io/leaderboard' + props.location.search;
  const leaderboardURL = apiURL + '/leaderboard?token=' + token + '&ts=' + ts + '&botUser=' + botUser + '&channel=' + channel + '&startDate=' + startDate + '&endDate=' + endDate;
  const [users, setUsers] = useState('');

  const channelsURL = apiURL + '/channels?token=' + token + '&ts=' + ts + '&botUser=' + botUser + '&channel=' + channel;
  const [listChannels, setListChannels] = useState('');

  const [isActive, setIsActive] = useState('allTime');

  const filterDates = (active = 'allTime') => {

    if (active === 'allTime') {

      setIsActive(active);
      setStartDate(moment(0).unix());
      setEndDate(moment().unix());
      
    } else if (active === 'lastMonth') {

      setIsActive(active);
      setStartDate(moment.unix( today ).subtract(1,'months').startOf('month').unix());
      setEndDate(moment.unix( today ).subtract(1,'months').endOf('month').unix());

    } else if (active === 'lastWeek') {

      setIsActive(active);
      setStartDate(moment.unix( today ).subtract(1,'week').startOf('week').add(1, 'day').unix());
      setEndDate(moment.unix( today ).subtract(1,'week').endOf('week').add(1, 'day').unix());

    } else if (active === 'thisMonth') {

      setIsActive(active);
      setStartDate(moment.unix( today ).startOf('month').unix());
      setEndDate(moment.unix( today ).unix());

    } else if (active === 'thisWeek') {

      setIsActive(active);
      setStartDate(moment.unix( today ).startOf('week').add(1, 'day').unix());
      setEndDate(moment.unix( today ).endOf('week').add(1, 'day').unix());

    }

    setSearchTerm('');
    
  }

  useEffect(() => {
    const getChart = async() => {
      await axios.get(leaderboardURL)
        .then(res => {
          setUsers(res.data);
        })
        .catch(err => console.error(err.message))
    }
    getChart();

    const getChannels = async() => {
      await axios.get(channelsURL)
        .then(res => {
          setListChannels(res.data);
        })
        .catch(err => console.error(err.message))
    }
    getChannels();

    // eslint-disable-next-line
  }, [leaderboardURL, channelsURL, channel]);

  const [searchTerm, setSearchTerm] = useState('');
  const handleChange = e => setSearchTerm(e.target.value);
  const results = !searchTerm ? users : users.filter(user =>
    user.item.toLowerCase().includes(searchTerm.toLocaleLowerCase())
  );


  const [isOpen, setIsOpen] = useState(false);
  const toggle = () => setIsOpen(!isOpen);

  const [dropdownOpen, setOpen] = useState(false);
  const toggleDropDown = () => setOpen(!dropdownOpen);

  return(
    <>
    <Navbar light expand="md">
      <div className="container">
        <NavbarBrand><img src={logo} alt="Agiledrop" /></NavbarBrand>
        <NavbarToggler onClick={toggle} />
        <Collapse isOpen={isOpen} navbar>
          <Nav className="mr-auto" navbar>

            <ButtonGroup>
              <Button className={`${isActive === 'thisWeek' ? 'active' : ''} btn btn-light`} onClick={() => filterDates('thisWeek')}>This Week</Button>
              <Button className={`${isActive === 'thisMonth' ? 'active' : ''} btn btn-light`} onClick={() => filterDates('thisMonth')}>This Month</Button>
              <Button className={`${isActive === 'lastWeek' ? 'active' : ''} btn btn-light`} onClick={() => filterDates('lastWeek')}>Last Week</Button>
              <Button className={`${isActive === 'lastMonth' ? 'active' : ''} btn btn-light`} onClick={() => filterDates('lastMonth')}>Last Month</Button>
              <Button className={`${isActive === 'allTime' ? 'active' : ''} btn btn-light`} onClick={() => filterDates('allTime')}>All Time</Button>
              <ButtonDropdown isOpen={dropdownOpen} toggle={toggleDropDown}>
                <DropdownToggle caret>
                  Channels
                </DropdownToggle>
                <DropdownMenu>
                  {listChannels ? (listChannels.map((el, index) => (
                    <DropdownItem key={index} onClick={() => setChannel(el.channel_id)}>#{el.channel_name}</DropdownItem>
                    )
                  )) : <DropdownItem>No Channels</DropdownItem>}
                </DropdownMenu>
              </ButtonDropdown>
            </ButtonGroup>

          </Nav>
        </Collapse>
        </div>
      </Navbar>
      <div className="container pt-5 pb-5">
        <div className="row">
        <div className="col">
          <div className="card-deck">
            {users ? (users.slice(0, 3).map((user, index) => (
                <div className={`${user.rank === 1 ? 'first' : user.rank === 2 ? 'second' : user.rank === 3 ? 'third' : ''} card text-center`} key={index}>
                    { user.rank === 1 ? <div className="podium"><span role="img" aria-label="1">🥇</span></div> :
                      user.rank === 2 ? <div className="podium"><span role="img" aria-label="2">🥈</span></div> :
                      user.rank === 3 ? <div className="podium"><span role="img" aria-label="3">🥉</span></div> :
                      null
                    }
                    <h4>{user.item}</h4>
                    <div className="card-footer score">
                      {user.score}
                    </div>
                </div>
              ))) : null }
          </div>
        </div>
        </div>
        {(results === undefined || results.length === 0) ?
        
        <div className="row mt-5">
          <div className="col text-center">
            <p>{listChannels ? (listChannels.map(el => {
              if (el.channel_id === channel) 
                return '#' + el.channel_name
              else
                return null
            })) : null }</p>
            <h1>No karma given yet!</h1>
            <p>Be the first to give some karma points on slack.</p>
          </div>
        </div>

        :
        
        <div className="row mt-5">
        <div className="col-6">
          <h3 className="pb-3">
            {listChannels ? (listChannels.map(el => {
              if (el.channel_id === channel) 
                return '#' + el.channel_name
              else
                return null
            })) : null }
          </h3>
        </div>
        <div className="col-6">
            <input
              className="form-control"
              type="text"
              placeholder="Search"
              aria-label="Search"
              value={searchTerm}
              onChange={handleChange}
            />
        </div>
        <div className="col">
          <div className="table-responsive">
            <table className="table table-borderless table-striped">
              <thead>
                <tr>
                  <th scope="col" className="text-left">Rank</th>
                  <th scope="col" className="text-center">Name</th>
                  <th scope="col" className="text-right">Karma</th>
                </tr>
              </thead>
              <tbody>
               {(results.map((user, index) => (
                  <tr key={index}>
                    <th className="text-left" scope="row">{user.rank}</th>
                    <td className="text-center">{user.item}</td>
                    <td className="text-right">{user.score}</td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </div>
        </div>
        }
      </div>
    </>
  )
}

export default Chart;