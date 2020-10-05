import React, { useState, useEffect } from 'react';
import axios from 'axios';
import logo from '../logo.svg';
import DateRangePicker from '@wojtekmaj/react-daterange-picker'

const Chart = (props) => {

  // const apiURL = 'https://04933df8c7b9.eu.ngrok.io/leaderboard' + props.location.search;

  // id | user_receive | user_give | timestamp | channel
  const [users2, setUsers2] = useState([
    {id: 1, user_receive: "Benjamin Cizej", user_give: "Martin Kenjic",  timestamp: "1597233600", channel: "#general" },
    {id: 2, user_receive: "Benjamin Cizej", user_give: "Martin Kenjic",  timestamp: "1597233600", channel: "#general" },
    {id: 3, user_receive: "Klemen Brodej", user_give: "Martin Kenjic",  timestamp: "1600527600", channel: "#general" },
    {id: 4, user_receive: "Bostjan Kovac", user_give: "Martin Kenjic",  timestamp: "1600527600", channel: "#general" },
    {id: 5, user_receive: "Klemen Brodej", user_give: "Martin Kenjic",  timestamp: "1600527600", channel: "#general" },
    {id: 6, user_receive: "Bostjan Kovac", user_give: "Martin Kenjic",  timestamp: "1600527600", channel: "#general" },
    {id: 7, user_receive: "Klemen Brodej", user_give: "Martin Kenjic",  timestamp: "1600527600", channel: "#general" },
    {id: 8, user_receive: "Klemen Brodej", user_give: "Martin Kenjic",  timestamp: "1600527600", channel: "#general" },
    {id: 9, user_receive: "Klemen Brodej", user_give: "Martin Kenjic",  timestamp: "1600527600", channel: "#general" },
    {id: 10, user_receive: "Klemen Brodej", user_give: "Martin Kenjic",  timestamp: "1600527600", channel: "#general" },
    {id: 11, user_receive: "Janez Novak", user_give: "Martin Kenjic",  timestamp: "1600527600", channel: "#general" },
    {id: 12, user_receive: "Janez Novak", user_give: "Martin Kenjic",  timestamp: "1600527600", channel: "#general" },
    {id: 13, user_receive: "Janez Novak", user_give: "Martin Kenjic",  timestamp: "1600527600", channel: "#general" },
    {id: 14, user_receive: "", user_give: "Martin Kenjic",  timestamp: "1597233600", channel: "#general" },
  ]);

  const [users, setUsers] = useState([
    {rank: 1, item: "Benjamin Cizej", score: "40 points"},
    {rank: 2, item: "Klemen Brodej", score: "30 points"},
    {rank: 3, item: "Martin Kenjic", score: "20 points"},
    {rank: 4, item: "Bostjan Kovac", score: "10 points"},
    {rank: 5, item: "Benjamin Cizej", score: "9 points"},
    {rank: 6, item: "Klemen Brodej", score: "8 points"},
    {rank: 7, item: "Martin Kenjic", score: "7 points"},
    {rank: 8, item: "Bostjan Kovac", score: "6 points"},
  ]);
  const [searchTerm, setSearchTerm] = useState('');

  const unixTime = 1600607620; //Math.floor( Date.now() / 1000 );
  const unixTime2 = 1597233600;
  //const date = new Date(unixTime2 * 1000);

  // prevMonth.setDate(1);
  // prevMonth.setMonth(prevMonth.getMonth()-1);


  //console.log(between(unixTime2, prevMonthFirst, prevMonthLast));

  // useEffect(() => {
  //   const getChart = async() => {
  //     await axios.get(apiURL)
  //       .then(res => {
  //         setUsers(res.data);
  //       })
  //       .catch(err => console.error(err.message))
  //   }
  //   getChart();

  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  const handleChange = e => {
    setSearchTerm(e.target.value);
  };

  const date = new Date();
  const date2 = new Date();

  let firstDay = (date.getDate() - date.getDay() - 7) + 1;
  let lastDay = firstDay + 6;

  let first = new Date(date.setDate(firstDay));
  let last = new Date(date2.setDate(lastDay));

  let first1 = new Date(date.getFullYear(), date.getMonth()-1, 1);

  console.log(firstDay);
  console.log(first1 + '\n' + last);

  const inRange = (mapArray, range = 'month') => {
    const date = new Date();
    const date2 = new Date();

    let first;
    let last;

    if (range === 'month') {
      first = new Date(date.getFullYear(), date.getMonth()-1, 1).getTime() / 1000;
      last = new Date(date.getFullYear(), date.getMonth(), 0).getTime() / 1000;
    } if (range === 'week') {
      let firstDay = (date.getDate() - date.getDay() - 7) + 1;
      let lastDay = firstDay + 6;
      let first = new Date(date.setDate(firstDay)).toUTCString();
      let last = new Date(date2.setDate(lastDay)).toUTCString();
    }
    
    const results = mapArray.filter(user => {
      if(user.timestamp >= first && user.timestamp <= last) {
          return user;
        }
    })

    return results;
  }

  const range = inRange(users2, 'month');
  //console.log(range);

  let ranks = {};

  range.forEach(el => {
      ranks[el.user_receive] = (ranks[el.user_receive] || 0) + 1;
  })

  let rangeresult = Object.keys(ranks).map(e => ({user_receive: e, score: ranks[e]}))

  rangeresult.sort((a, b) => {
    return b.score - a.score;
  });

  rangeresult.forEach((item, i) => {
    item.rank = i + 1;
  });

  console.log(rangeresult);

  // console.log(ranks);

  // const map = range.reduce((acc, e) => acc.set(e.user_receive, (acc.get(e.user_receive) || 0) + 1), new Map());

  // console.log(map);

  // console.info([...map.keys()])
  // console.info([...map.values()])

  // const keys = [...map.keys()];
  // const values = [...map.values()];
  // const merged = keys.reduce((obj, key, index) => ({ ...obj, [key]: values[index] }), {});

  // var array = keys.map((el, i) => {
  //   return [keys[i], values[i]];
  // });


  // console.log(array);
  


  //console.log(ranks);

    // ranks.push({ user_receive: el.user_receive, points: ranks[el.user_receive] = (ranks[el.user_receive] || 0) + 1 });
    // ranks[el.user_receive] = (ranks[el.user_receive] || 0) + 1;
    // if (el.user_receive = el.user_receive) {
    //   console.log(el.user_receive || 0) + 1);
    //   //ranks[el.user_receive] = (ranks[el.user_receive] || 0) + 1;
    // }

  // const countVotes = range.filter(user => {
  //   return user;
  // })
  //console.log(range)
  

  const results = !searchTerm ? rangeresult : rangeresult.filter(user =>
    user.user_receive.toLowerCase().includes(searchTerm.toLocaleLowerCase())
  );

  //console.log(results);

  // const between = (x, min, max) => {
  //   return x >= min && x <= max;
  // }

  // users2.map(user => {
  //   if(between(user.timestamp, prevMonthFirst, prevMonthLast)) {
  //     console.log(user)
  //   }
  // });
  const [value, onChange] = useState([new Date(), new Date()]);
  //console.log(value);

  return(
    <>
      <nav className="navbar navbar-expand-lg navbar-light">
        <div className="container">
          <img src={logo} alt="Agiledrop" />
          <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarSupportedContent">
            <ul className="navbar-nav">
              <li className="nav-item active">
                <a className="nav-link" href="#">Last Month</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#">Last Week</a>
              </li>
            </ul>
            <form className="form-inline my-2 my-lg-0">
              <input
              className="form-control mr-sm-2"
              type="text"
              placeholder="Search"
              aria-label="Search"
              value={searchTerm}
              onChange={handleChange}
            />
            </form>
          </div>
        </div>
      </nav>
      <div className="container mt-5">
        <div className="card">
          <div className="card-body">
            <div className="btn-group" role="group" aria-label="Basic example">
              <button type="button" className="btn btn-secondary">Last Week</button>
              <button type="button" className="btn btn-secondary">Last Month</button>
            </div>
            <div className="table-responsive">
            <table className="table table-borderless table-hover">
              <thead>
                <tr>
                  <th scope="col" className="text-left">Rank</th>
                  <th scope="col" className="text-center">Name</th>
                  <th scope="col" className="text-right">Points</th>
                </tr>
              </thead>
              <tbody>
              {results ? (results.map(user => (
                  <tr key={user.rank}>
                      { user.rank === 1 ? <th className='text-left podium' scope='row'><span role="img" aria-label="1">🥇</span></th> :
                        user.rank === 2 ? <th className="text-left podium" scope="row"><span role="img" aria-label="2">🥈</span></th> :
                        user.rank === 3 ? <th className="text-left podium" scope="row"><span role="img" aria-label="3">🥉</span></th> :
                        <th className="text-left" scope="row">{user.count}</th>
                      }
                    <td className="text-center">{user.user_receive}</td>
                    <td className="text-right">{user.score}</td>
                  </tr>
                ))) : null }
              </tbody>
            </table>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Chart;