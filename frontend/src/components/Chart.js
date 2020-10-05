import React, { useState, useEffect } from 'react';
import axios from 'axios';
import logo from '../logo.svg';

const Chart = (props) => {

  const apiURL = 'https://daa8abd61b18.eu.ngrok.io/leaderboard' + props.location.search;
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const getChart = async() => {
      await axios.get(apiURL)
        .then(res => {
          setUsers(res.data);
        })
        .catch(err => console.error(err.message))
    }
    getChart();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = e => {
    setSearchTerm(e.target.value);
  };

  const results = !searchTerm ? users : users.filter(user =>
    user.item.toLowerCase().includes(searchTerm.toLocaleLowerCase())
  );

  return(
    <div className="container">
      <div className="row">

        <div className="col-sm mb-5 text-left logo-wrapper">
          <img src={logo} alt="Agiledrop" />
        </div>

        <div className="col-sm mb-5 text-right input-wrapper">
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={handleChange}
          />
        </div>
      
        <div className="col-md-6 offset-md-3">
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
                        <th className="text-left" scope="row">{user.rank}</th>
                      }
                    <td className="text-center">{user.item}</td>
                    <td className="text-right">{user.score}</td>
                  </tr>
                ))) : null }
              </tbody>
            </table>
            </div>
        </div>

      </div>
    </div>
  )
}

export default Chart;