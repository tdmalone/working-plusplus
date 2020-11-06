import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import ReactPaginate from "react-paginate";
import { Input } from "reactstrap";
import { PieChart, Pie, Legend, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Sector, Cell } from 'recharts';

import { BiArrowFromRight, BiArrowFromLeft } from "react-icons/bi";

const UserProfile = (props) => {
  let location = useLocation();
  const user_username = location.pathname.split("/")[2];

  const apiURL = process.env.REACT_APP_API_URL;

  const getUserURL = apiURL + "/userprofile" + location.search;
  const [getUser, setGetUser] = useState();

  const channelsURL = apiURL + "/channels" + location.search;
  const [listChannels, setListChannels] = useState();

  const [selectedChannel, setSelectedChannel] = useState("all");
  const [fromTo, setFromTo] = useState("all");

  const [pagination, setPagination] = useState({
    pageCount: 0,
    offset: 0,
    perPage: 10,
    currentPage: 0,
  });

  const [paginationSearch, setPaginationSearch] = useState(
    pagination.currentPage
  );

  const handlePageClick = async (e) => {
    const selectedPage = e.selected;
    const offset = selectedPage * pagination.perPage;

    setPagination((prevState) => {
      return {
        ...prevState,
        offset: offset,
        currentPage: selectedPage,
      };
    });

    setPaginationSearch(pagination.currentPage);
  };

  useEffect(() => {
    const userProfile = async () => {
      let page;
      const itemsPerPage = pagination.perPage;
      const searchString = props.search;

      if (searchString) {
        page = 1;
        handlePageClick({ selected: 0 });
        setPaginationSearch(pagination.currentPage);
      } else {
        page = pagination.currentPage + 1;
        setPaginationSearch(pagination.currentPage);
      }

      await axios
        .get(getUserURL, {
          params: {
            username: user_username,
            fromTo: fromTo,
            channelProfile: selectedChannel,
            itemsPerPage: itemsPerPage,
            page: page,
            searchString: searchString,
          },
        })
        .then((res) => {
          setGetUser(res.data);

          setPagination((prevState) => {
            return {
              ...prevState,
              pageCount: Math.ceil(res.data.count / pagination.perPage),
            };
          });
        })
        .catch((err) => console.error(err.message));
    };
    userProfile();

    const getChannels = async () => {
      await axios
        .get(channelsURL)
        .then((res) => {
          setListChannels(res.data);
        })
        .catch((err) => console.error(err.message));
    };
    getChannels();
  }, [pagination.currentPage, location.search, selectedChannel, fromTo]);

  console.log(getUser);

  const KarmaChart = () => {

    const data01 = getUser && getUser.karmaDivided.map(el => { return el });

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    const RADIAN = Math.PI / 180;
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
      const x = cx + radius * Math.cos(-midAngle * RADIAN);
      const y = cy + radius * Math.sin(-midAngle * RADIAN);

      return (
        <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
          {`${(percent * 100).toFixed(0)}%`}
        </text>
      );
    };

    const CustomTooltip = ({ active, payload }) => {
      if (active) {
        return (
          <div className="shadow p-3 mb-5 bg-white rounded">
            {`${payload[0].name} : ${payload[0].value} Karma Points`}
          </div>
        );
      }
    
      return null;
    };

    return (
      <PieChart width={300} height={200}>
        <Pie
          dataKey="value"
          isAnimationActive={false}
          data={data01}
          cx={80}
          cy={80}
          outerRadius={80}
          fill="#8884d8"
          labelLine={false}
          label={renderCustomizedLabel}
        >
          { data01.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />) }
        </Pie>
        <Tooltip content={<CustomTooltip />} />
      </PieChart>
    );
  }
    

  return (
    <>
      {getUser === undefined || listChannels === undefined ? (
        <div className="row mt-5">
          <div className="col text-center">
            <svg
              width="50"
              height="50"
              viewBox="0 0 135 135"
              xmlns="http://www.w3.org/2000/svg"
              fill="#000"
            >
              <path d="M67.447 58c5.523 0 10-4.477 10-10s-4.477-10-10-10-10 4.477-10 10 4.477 10 10 10zm9.448 9.447c0 5.523 4.477 10 10 10 5.522 0 10-4.477 10-10s-4.478-10-10-10c-5.523 0-10 4.477-10 10zm-9.448 9.448c-5.523 0-10 4.477-10 10 0 5.522 4.477 10 10 10s10-4.478 10-10c0-5.523-4.477-10-10-10zM58 67.447c0-5.523-4.477-10-10-10s-10 4.477-10 10 4.477 10 10 10 10-4.477 10-10z">
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0 67 67"
                  to="-360 67 67"
                  dur="2.5s"
                  repeatCount="indefinite"
                />
              </path>
              <path d="M28.19 40.31c6.627 0 12-5.374 12-12 0-6.628-5.373-12-12-12-6.628 0-12 5.372-12 12 0 6.626 5.372 12 12 12zm30.72-19.825c4.686 4.687 12.284 4.687 16.97 0 4.686-4.686 4.686-12.284 0-16.97-4.686-4.687-12.284-4.687-16.97 0-4.687 4.686-4.687 12.284 0 16.97zm35.74 7.705c0 6.627 5.37 12 12 12 6.626 0 12-5.373 12-12 0-6.628-5.374-12-12-12-6.63 0-12 5.372-12 12zm19.822 30.72c-4.686 4.686-4.686 12.284 0 16.97 4.687 4.686 12.285 4.686 16.97 0 4.687-4.686 4.687-12.284 0-16.97-4.685-4.687-12.283-4.687-16.97 0zm-7.704 35.74c-6.627 0-12 5.37-12 12 0 6.626 5.373 12 12 12s12-5.374 12-12c0-6.63-5.373-12-12-12zm-30.72 19.822c-4.686-4.686-12.284-4.686-16.97 0-4.686 4.687-4.686 12.285 0 16.97 4.686 4.687 12.284 4.687 16.97 0 4.687-4.685 4.687-12.283 0-16.97zm-35.74-7.704c0-6.627-5.372-12-12-12-6.626 0-12 5.373-12 12s5.374 12 12 12c6.628 0 12-5.373 12-12zm-19.823-30.72c4.687-4.686 4.687-12.284 0-16.97-4.686-4.686-12.284-4.686-16.97 0-4.687 4.686-4.687 12.284 0 16.97 4.686 4.687 12.284 4.687 16.97 0z">
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0 67 67"
                  to="360 67 67"
                  dur="8s"
                  repeatCount="indefinite"
                />
              </path>
            </svg>
          </div>
        </div>
      ) : (
        <div className="container">
          <div className="row mt-5">
            <div className="col">
              <div className="row">
                <div className="col-6">
                  <h3>
                    {getUser === undefined || getUser.length === 0
                      ? null
                      : getUser.nameSurname}
                  </h3>
                </div>
                <div className="col-3">
                  <Input
                      type="select"
                      name="select"
                      id="exampleSelect"
                      value={selectedChannel}
                      onChange={(e) => setSelectedChannel(e.target.value)}
                    >
                      {listChannels ? (
                        <option value={"all"}>All Channels</option>
                      ) : null}
                      {listChannels ? (
                        listChannels.map((el, index) => (
                          <option key={index} value={el.channel_id}>
                            #{el.channel_name}
                          </option>
                        ))
                      ) : (
                        <option>No Channels</option>
                      )}
                    </Input>
                </div>
                <div className="col-3">
                  <Input
                      type="select"
                      name="select"
                      id="exampleSelect"
                      value={fromTo}
                      onChange={(e) => setFromTo(e.target.value)}
                    >
                    <option value={"all"}>All Karma Points</option>
                    <option value={"from"}>Karma Points Received</option>
                    <option value={"to"}>Karma Points Sent</option>
                  </Input>
                </div>
              </div>
              <div className="row mt-5">
                <div className="col-3"></div>
                <div className="col-2">
                    <div className="score-item">
                      Rank
                      <br />
                      <h3>{getUser === undefined ? null : getUser.userRank}</h3>
                    </div>
                  </div>
                  <div className="col-2">
                    <div className="score-item">
                      Karma Received
                      <br />
                      <h3>{getUser === undefined ? null : getUser.allKarma}</h3>
                    </div>
                  </div>
                  <div className="col-2">
                    <div className="score-item">
                      Karma Sent
                      <br />
                      <h3>{getUser === undefined ? null : getUser.karmaGiven}</h3>
                    </div>
                  </div>
                  <div className="col-3"></div>
              </div>
              <div className="row mt-5">
                <div className="col">
                  <KarmaChart />
                </div>
              </div>
            </div>
          </div>

          {getUser.feed.length === 0 ? (
            <div className="row mt-5">
              <div className="col text-center mt-5">
                <h3>No Results</h3>
              </div>
            </div>
          ) : (
            <>
              <div className="row mt-5">
                <div className="col">
                  <table className="table table-borderless table-striped">
                    <thead>
                      <tr>
                        <th scope="col" className="text-left flex">
                          <div className="fromto-title">
                            <BiArrowFromRight
                              className="BiArrow BiArrow--From"
                              title="Karma Points You Received"
                            />{" "}
                            From
                          </div>
                          <div className="fromto-title">
                            <BiArrowFromLeft
                              className="BiArrow BiArrow--To"
                              title="Karma Points You Sent"
                            />{" "}
                            To
                          </div>
                        </th>
                        <th scope="col" className="text-left">
                          Description
                        </th>
                        <th scope="col" className="text-left">
                          Channel
                        </th>
                        <th scope="col" className="text-left">
                          Timestamp
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {getUser &&
                        getUser.feed.map((el, index) => (
                          <tr key={index}>
                            <td className="text-left">
                              {el.fromUser === getUser.nameSurname ? (
                                <div className="flex">
                                  <BiArrowFromLeft
                                    className="BiArrow BiArrow--To BiArrow--mr"
                                    title="Karma Points You Sent"
                                  />{" "}
                                  {el.toUser}
                                </div>
                              ) : (
                                <div className="flex">
                                  <BiArrowFromRight
                                    className="BiArrow BiArrow--From BiArrow--mr"
                                    title="Karma Points You Received"
                                  />{" "}
                                  {el.fromUser}
                                </div>
                              )}
                            </td>
                            <td className="text-left description">
                              {el.description}
                            </td>
                            <td className="text-left">#{el.channel_name}</td>
                            <td className="text-left">
                              {new Date(el.timestamp).toLocaleDateString(
                                "en-gb"
                              ) +
                                " - " +
                                new Date(el.timestamp).toLocaleTimeString(
                                  "en-gb"
                                )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="row mt-5 mb-5">
                <div className="col">
                  <ReactPaginate
                    previousLabel={"PREV"}
                    nextLabel={"NEXT"}
                    breakLabel={"..."}
                    breakClassName={"break-me"}
                    pageCount={pagination.pageCount}
                    marginPagesDisplayed={2}
                    pageRangeDisplayed={2}
                    onPageChange={handlePageClick}
                    containerClassName={"pagination justify-content-center"}
                    subContainerClassName={"pages pagination"}
                    activeClassName={"active"}
                    pageClassName={"page-item"}
                    pageLinkClassName={"page-link"}
                    previousClassName={"page-item"}
                    nextClassName={"page-item"}
                    previousLinkClassName={"page-link"}
                    nextLinkClassName={"page-link"}
                    forcePage={paginationSearch}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default UserProfile;
