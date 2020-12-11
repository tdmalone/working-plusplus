import React, { useCallback, useState, useEffect } from 'react';
import { useHistory } from "react-router-dom";
import axios from 'axios';
import queryString from 'query-string';
import ReactPaginate from 'react-paginate';

import DateFilter from './DateFilter';
import moment from 'moment';

import _ from "lodash";

const KarmaFeed = props => {

  const apiURL = process.env.REACT_APP_API_URL;

  const parsedQuery = queryString.parse(props.location.search);

  const [channel, setChannel] = useState(parsedQuery.channel);
  const [startDate, setStartDate] = useState(parsedQuery.startDate);
  const [endDate, setEndDate] = useState(parsedQuery.endDate);

  const fromUsersURL = apiURL + '/karmafeed?channel=' + channel + '&startDate=' + startDate + '&endDate=' + endDate;
  const [fromUsers, setFromUsers] = useState();

  const channelsURL = apiURL + '/channels?channel=' + channel;
  const [listChannels, setListChannels] = useState();

  const [pagination, setPagination] = useState({
    pageCount: 0,
    offset: 0,
    perPage: 10,
    currentPage: 0
  });

  const handlePageClick = async e => {
    const selectedPage = e.selected;
    const offset = selectedPage * pagination.perPage;

    setPagination(prevState => {
      return {
        ...prevState,
        offset: offset,
        currentPage: selectedPage
      }
    });

  }

  if (channel === undefined || startDate === undefined || endDate === undefined) {
    setChannel('all');
    setStartDate(0);
    setEndDate(moment().unix());
  }
  
  let history = useHistory();
  useEffect(() => {
    history.push('?channel=' + channel + '&startDate=' + startDate + '&endDate=' + endDate)
  }, [channel, startDate, endDate]);

  useEffect(() => {

    const getChannels = async () => {
      await axios
        .get(channelsURL)
        .then((res) => {
          setListChannels(res.data);
        })
        .catch((err) => console.error(err.message));
    };
    getChannels();

  },[channelsURL]);

  const [searchValue, setSearchValue] = useState("");
  const debounce = useCallback(
    _.debounce(_searchVal => {
      handlePageClick({ selected: 0 });
      setSearchValue(_searchVal);
    }, 500),
    []
  );

  useEffect(() => {
    debounce(props.search);
  }, [props.search]);

  useEffect(() => {
    const fromUsers = async() => {

      await axios
        .get(fromUsersURL, {
          params: {
            itemsPerPage: pagination.perPage,
            page: pagination.currentPage + 1,
            searchString: props.search
          }
        })
        .then(res => {
          setFromUsers(res.data.results);

          setPagination(prevState => {
            return {
              ...prevState,
              pageCount: Math.ceil((res.data.count / pagination.perPage)), 
            }
          })
        })
        .catch(err => console.error(err.message))

    }
    fromUsers();

    // eslint-disable-next-line
  }, [fromUsersURL, pagination.currentPage, searchValue, channel]);

  return(
    <>
    <DateFilter 
      listChannels={listChannels} 
      channel={channel} 
      query={props.location.search}
      onChannelClick={ value => setChannel(value) }
      onStartDateClick={ value => setStartDate(value) }
      onEndDateClick={ value => setEndDate(value) }
      onSearchClick={ value => props.onClick(value) }
      onFilterClick={ value => handlePageClick({selected: value}) }
    />
    {(fromUsers === undefined) ?

    <div className="row mt-5">
      <div className="col text-center">
        <svg width="50" height="50" viewBox="0 0 135 135" xmlns="http://www.w3.org/2000/svg" fill="#000">
            <path d="M67.447 58c5.523 0 10-4.477 10-10s-4.477-10-10-10-10 4.477-10 10 4.477 10 10 10zm9.448 9.447c0 5.523 4.477 10 10 10 5.522 0 10-4.477 10-10s-4.478-10-10-10c-5.523 0-10 4.477-10 10zm-9.448 9.448c-5.523 0-10 4.477-10 10 0 5.522 4.477 10 10 10s10-4.478 10-10c0-5.523-4.477-10-10-10zM58 67.447c0-5.523-4.477-10-10-10s-10 4.477-10 10 4.477 10 10 10 10-4.477 10-10z">
                <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="0 67 67"
                    to="-360 67 67"
                    dur="2.5s"
                    repeatCount="indefinite"/>
            </path>
            <path d="M28.19 40.31c6.627 0 12-5.374 12-12 0-6.628-5.373-12-12-12-6.628 0-12 5.372-12 12 0 6.626 5.372 12 12 12zm30.72-19.825c4.686 4.687 12.284 4.687 16.97 0 4.686-4.686 4.686-12.284 0-16.97-4.686-4.687-12.284-4.687-16.97 0-4.687 4.686-4.687 12.284 0 16.97zm35.74 7.705c0 6.627 5.37 12 12 12 6.626 0 12-5.373 12-12 0-6.628-5.374-12-12-12-6.63 0-12 5.372-12 12zm19.822 30.72c-4.686 4.686-4.686 12.284 0 16.97 4.687 4.686 12.285 4.686 16.97 0 4.687-4.686 4.687-12.284 0-16.97-4.685-4.687-12.283-4.687-16.97 0zm-7.704 35.74c-6.627 0-12 5.37-12 12 0 6.626 5.373 12 12 12s12-5.374 12-12c0-6.63-5.373-12-12-12zm-30.72 19.822c-4.686-4.686-12.284-4.686-16.97 0-4.686 4.687-4.686 12.285 0 16.97 4.686 4.687 12.284 4.687 16.97 0 4.687-4.685 4.687-12.283 0-16.97zm-35.74-7.704c0-6.627-5.372-12-12-12-6.626 0-12 5.373-12 12s5.374 12 12 12c6.628 0 12-5.373 12-12zm-19.823-30.72c4.687-4.686 4.687-12.284 0-16.97-4.686-4.686-12.284-4.686-16.97 0-4.687 4.686-4.687 12.284 0 16.97 4.686 4.687 12.284 4.687 16.97 0z">
                <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="0 67 67"
                    to="360 67 67"
                    dur="8s"
                    repeatCount="indefinite"/>
            </path>
        </svg>
      </div>
    </div>

    :

    <div className="container">
    {(fromUsers === undefined || fromUsers.length === 0) ?
      <div className="row mt-5">
        <div className="col text-center mt-5">
          <h3>No Results</h3>
        </div>
      </div>
      :
      <>
      <div className="row mt-5">
        <div className="col">
          <div className="table-responsive">
            <table className="table table-borderless table-striped">
              <thead>
                <tr>
                  <th scope="col" className="text-left">From</th>
                  <th scope="col" className="text-left">To</th>
                  <th scope="col" className="text-left">Description</th>
                  <th scope="col" className="text-left">Channel</th>
                  <th scope="col" className="text-left">Timestamp</th>
                </tr>
              </thead>
              <tbody>
              {(fromUsers && fromUsers.map((el, index) => (
                <tr key={index}>
                  <td className="text-left">{el.fromUser}</td>
                  <td className="text-left">{el.toUser}</td>
                  <td className="text-left description">{el.description}</td>
                  <td className="text-left">#{el.channel_name}</td>
                  <td className="text-left">{(new Date(el.timestamp).toLocaleDateString('en-gb')) + ' - ' + (new Date(el.timestamp).toLocaleTimeString('en-gb'))}</td>
                </tr>
              )))}
              </tbody>
            </table>
          </div>
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
            forcePage={pagination.currentPage} />
        </div>
      </div>
      </>
      }
    </div>
    }
    </>
  )

}

export default KarmaFeed;