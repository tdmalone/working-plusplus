import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Switch, Route, Link, useParams, useLocation } from "react-router-dom";
import axios from 'axios';

const UserProfile = props => {

  let location = useLocation();
  const user_username = location.pathname.split('/')[2];

  const apiURL = process.env.REACT_APP_API_URL;
  const getUserURL = apiURL + '/userprofile' + location.search;
  const [getUser, setGetUser] = useState();

  useEffect(() => {

    const userProfile = async() => {
      await axios.get(getUserURL, {params: {username: user_username}})
        .then(res => {
          setGetUser(res.data);
        })
        .catch(err => console.error(err.message))
    }
    userProfile();

  }, []);

  return (
    <div className="container">
      <div className="row mt-5">
        <div className="col">
          <h3>{(getUser === undefined || getUser.length === 0) ? null : getUser[0].user_name}</h3>
        </div>
      </div>
    </div>
  )
}

export default UserProfile;
