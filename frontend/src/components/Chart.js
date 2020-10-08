import React, { useState, useEffect } from 'react';
import axios from 'axios';
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

  // id | user_receive | user_give | timestamp | channel
  const [users, setUsers] = useState([
    {id: 3, user_receive: "Klemen Brodej", user_give: "Martin Kenjic", timestamp: "1600527600", channel: "#dev" },
    {id: 4, user_receive: "Bostjan Kovac", user_give: "Martin Kenjic", timestamp: "1600527600", channel: "#dev" },
    {id: 5, user_receive: "Klemen Brodej", user_give: "Martin Kenjic", timestamp: "1600527600", channel: "#dev" },
    {id: 6, user_receive: "Bostjan Kovac", user_give: "Martin Kenjic", timestamp: "1601337600", channel: "#dev" },
    {id: 7, user_receive: "Klemen Brodej", user_give: "Martin Kenjic", timestamp: "1600527600", channel: "#dev" },
    {id: 8, user_receive: "Klemen Brodej", user_give: "Martin Kenjic", timestamp: "1600527600", channel: "#dev" },
    {id: 9, user_receive: "Klemen Brodej", user_give: "Martin Kenjic", timestamp: "1600527600", channel: "#dev" },
    {id: 10, user_receive: "Klemen Brodej", user_give: "Martin Kenjic", timestamp: "1601337600", channel: "#dev" },
    {id: 11, user_receive: "Janez Novak", user_give: "Martin Kenjic", timestamp: "1601337600", channel: "#dev" },
    {id: 12, user_receive: "Janez Novak", user_give: "Martin Kenjic", timestamp: "1601337600", channel: "#dev" },
    {id: 13, user_receive: "Janez Novak", user_give: "Martin Kenjic", timestamp: "1600527600", channel: "#dev" },
    {id: 14, user_receive: "Lena Gregorcic", user_give: "Martin Kenjic", timestamp: "1601596800", channel: "#dev" },
    {id: 15, user_receive: "Lena Gregorcic", user_give: "Martin Kenjic", timestamp: "1601596800", channel: "#dev" },
    {id: 14, user_receive: "Lena Gregorcic", user_give: "Martin Kenjic", timestamp: "1601596800", channel: "#dev" },
    {id: 16, user_receive: "Lena Gregorcic", user_give: "Martin Kenjic", timestamp: "1601596800", channel: "#dev" },
    {id: 17, user_receive: "John Smith", user_give: "Martin Kenjic", timestamp: "1601596800", channel: "#random" },
    {id: 18, user_receive: "John Smith", user_give: "Martin Kenjic", timestamp: "1601596800", channel: "#random" },
    {id: 19, user_receive: "John Smith", user_give: "Martin Kenjic", timestamp: "1601596800", channel: "#random" },
    {id: 20, user_receive: "John Smith", user_give: "Martin Kenjic", timestamp: "1601596800", channel: "#random" },
  ]);

  // const apiURL = 'https://04933df8c7b9.eu.ngrok.io/leaderboard' + props.location.search;

  // useEffect(() => {
  //   const getChart = async() => {
  //     await axios.get(apiURL)
  //       .then(res => {
  //         setUsers(res.data);
  //       })
  //       .catch(err => console.error(err.message))
  //   }
  //   getChart();

  //   // eslint-disable-next-line
  // }, []);

  const inRange = (mapArray, range = 'allTime', channel) => {
    const date = new Date();
    let ranks = {};
    let first;
    let last;

    if (range === 'allTime') {
      first = new Date(0).getTime() / 1000;
      last = new Date().getTime() / 1000;
    } else if (range === 'lastMonth') {
      first = new Date(date.getFullYear(), date.getMonth()-1, 1).getTime() / 1000;
      last = new Date(date.getFullYear(), date.getMonth(), 0).getTime() / 1000;
    } else if (range === 'lastWeek') {
      const firstDay = date.getDate() - date.getDay() - 7 + 1;
      const lastDay = firstDay + 7;
      first = new Date( date.getFullYear(), date.getMonth(), firstDay ).getTime() / 1000;
      last = new Date( date.getFullYear(), date.getMonth(), lastDay ).getTime() / 1000;
    } else if (range === 'thisMonth') {
      first = new Date(date.getFullYear(), date.getMonth(), 1).getTime() / 1000;
      last = new Date().getTime() / 1000;
    } else if (range === 'thisWeek') {
      const firstDay = date.getDate() - date.getDay() + 1;
      first = new Date( date.getFullYear(), date.getMonth(), firstDay ).getTime() / 1000;
      last = new Date().getTime() / 1000;
    }
    
    const results = mapArray.filter(user => {
      if(user.timestamp >= first && user.timestamp <= last) {
          if(user.channel === channel) {
            return user;
          }
        }
    })

    results.forEach(el => {
      ranks[el.user_receive] = (ranks[el.user_receive] || 0) + 1;
    })

    let rangeresult = Object.keys(ranks).map(e => ({user_receive: e, score: ranks[e]}));

    rangeresult.sort((a, b) => {
      return b.score - a.score;
    });

    rangeresult.forEach((item, i) => {
      item.rank = i + 1;
    });

    return rangeresult;

  }


  const channels = users.map(el => {
    return el.channel;
  })
  const distinctChannels = [ ...new Set(channels) ];

  const [searchTerm, setSearchTerm] = useState('');
  const [isActive, setIsActive] = useState('allTime');

  const [filterChannel, setFilterChannel] = useState('#dev');
  const [range, setRange] = useState(inRange(users, isActive, filterChannel));

  const handleChange = e => setSearchTerm(e.target.value);

  const filterDates = (dates, channel) => {
    setRange(inRange(users, dates, channel));
    setIsActive(dates);
    setSearchTerm('');
  }

  const results = !searchTerm ? range : range.filter(user =>
    user.user_receive.toLowerCase().includes(searchTerm.toLocaleLowerCase())
  );

  const pluralize = (count, noun, suffix = 's') => `${count} ${noun}${count !== 1 ? suffix : ''}`;

  const [isOpen, setIsOpen] = useState(false);
  const toggle = () => setIsOpen(!isOpen);

  const [dropdownOpen, setOpen] = useState(false);
  const toggleDropDown = () => setOpen(!dropdownOpen);

  return(
    <>
    <Navbar light expand="md">
      <div className="container">
        <NavbarBrand href="/"><img src={logo} alt="Agiledrop" /></NavbarBrand>
        <NavbarToggler onClick={toggle} />
        <Collapse isOpen={isOpen} navbar>
          <Nav className="mr-auto" navbar>

            <ButtonGroup>
              <Button className={`${isActive === 'thisWeek' ? 'active' : ''} btn btn-light`} onClick={() => filterDates('thisWeek', filterChannel)}>This Week</Button>
              <Button className={`${isActive === 'thisMonth' ? 'active' : ''} btn btn-light`} onClick={() => filterDates('thisMonth', filterChannel)}>This Month</Button>
              <Button className={`${isActive === 'lastWeek' ? 'active' : ''} btn btn-light`} onClick={() => filterDates('lastWeek', filterChannel)}>Last Week</Button>
              <Button className={`${isActive === 'lastMonth' ? 'active' : ''} btn btn-light`} onClick={() => filterDates('lastMonth', filterChannel)}>Last Month</Button>
              <Button className={`${isActive === 'allTime' ? 'active' : ''} btn btn-light`} onClick={() => filterDates('allTime', filterChannel)}>All Time</Button>
              <ButtonDropdown isOpen={dropdownOpen} toggle={toggleDropDown}>
                <DropdownToggle caret>
                  Channels
                </DropdownToggle>
                <DropdownMenu>
                  {distinctChannels ? (distinctChannels.map((el, index) => (
                    <DropdownItem key={index} onClick={() => { setFilterChannel(el); filterDates(isActive, el) }}>{el}</DropdownItem>
                    )
                  )) : null}
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
            {range ? (range.slice(0, 3).map(user => (
                <div className={`${user.rank === 1 ? 'first' : user.rank === 2 ? 'second' : user.rank === 3 ? 'third' : ''} card text-center`} key={user.rank}>
                    { user.rank === 1 ? <div className="podium"><span role="img" aria-label="1">🥇</span></div> :
                      user.rank === 2 ? <div className="podium"><span role="img" aria-label="2">🥈</span></div> :
                      user.rank === 3 ? <div className="podium"><span role="img" aria-label="3">🥉</span></div> :
                      null
                    }
                    <h4>{user.user_receive}</h4>
                    <div className="card-footer score">
                      {pluralize(user.score, 'Point')}
                    </div>
                </div>
              ))) : null }
          </div>
        </div>
        </div>
        {(results === undefined || results.length === 0) ?
        
        <div className="row mt-5">
          <div className="col text-center">
            <h1>No karma given yet!</h1>
            <p>Be the first to give some karma points on slack.</p>
          </div>
        </div>

        :
        
        <div className="row mt-5">
        <div className="col-6">
          <h3 className="pb-3">Karma List</h3>
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
               {(results.map(user => (
                  <tr key={user.rank}>
                    <th className="text-left" scope="row">{user.rank}</th>
                    <td className="text-center">{user.user_receive}</td>
                    <td className="text-right">{pluralize(user.score, 'Point')}</td>
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