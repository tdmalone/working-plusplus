import React, { useState, useEffect } from 'react';
import { useLocation } from "react-router-dom";
import axios from 'axios';
import ReactPaginate from 'react-paginate';

import { BiArrowFromRight, BiArrowFromLeft } from 'react-icons/bi';

const UserProfile = props => {

  let location = useLocation();
  const user_username = location.pathname.split('/')[2];

  const apiURL = process.env.REACT_APP_API_URL;
  const getUserURL = apiURL + '/userprofile' + location.search;
  const [getUser, setGetUser] = useState();

  const [pagination, setPagination] = useState({
    pageCount: 0,
    offset: 0,
    perPage: 10,
    currentPage: 0
  });

  const [paginationSearch, setPaginationSearch] = useState(pagination.currentPage);

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

    setPaginationSearch(pagination.currentPage);

  }

  useEffect(() => {

    const userProfile = async() => {

      let page;
      const itemsPerPage = pagination.perPage;
      const searchString = props.search;

      if (searchString) {

        page = 1;
        handlePageClick({selected: 0});
        setPaginationSearch(pagination.currentPage);

      } else {

        page = pagination.currentPage + 1;
        setPaginationSearch(pagination.currentPage);

      }

      await axios.get(getUserURL, {params: {username: user_username, fromTo: 'all', itemsPerPage: itemsPerPage, page: page, searchString: searchString}})
      .then(res => {
        setGetUser(res.data);

        setPagination(prevState => {
          return {
            ...prevState,
            pageCount: Math.ceil((res.data.count / pagination.perPage)), 
          }
        })
      })
      .catch(err => console.error(err.message))

    }
    userProfile();

  }, [pagination.currentPage]);

  // console.log(getUser);

  return (
    <div className="container">
      <div className="row mt-5">
        <div className="col">
          <h3>{(getUser === undefined || getUser.length === 0) ? null : getUser.nameSurname}</h3>

          <table className="table table-borderless table-striped">
              <thead>
                <tr>
                  <th scope="col" className="text-left flex"><div className="fromto-title"><BiArrowFromRight className="BiArrow BiArrow--From" title="Karma Points You Received" /> From</div><div className="fromto-title"><BiArrowFromLeft className="BiArrow BiArrow--To" title="Karma Points You Gave" /> To</div></th>
                  <th scope="col" className="text-left">Description</th>
                  <th scope="col" className="text-left">Channel</th>
                  <th scope="col" className="text-left">Timestamp</th>
                </tr>
              </thead>
              <tbody>
              {(getUser && getUser.feed.map((el, index) => (
                <tr key={index}>
                  <td className="text-left">
                    {(el.fromUser === getUser.nameSurname) ? <div className="flex"><BiArrowFromLeft className="BiArrow BiArrow--To BiArrow--mr" title="Karma Points You Gave" /> {el.toUser}</div> : <div className="flex"><BiArrowFromRight className="BiArrow BiArrow--From BiArrow--mr" title="Karma Points You Received" /> {el.fromUser}</div>}
                  </td>
                  <td className="text-left description">{el.description}</td>
                  <td className="text-left">#{el.channel_name}</td>
                  <td className="text-left">{(new Date(el.timestamp).toLocaleDateString('en-gb')) + ' - ' + (new Date(el.timestamp).toLocaleTimeString('en-gb'))}</td>
                </tr>
              )))}
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
            forcePage={paginationSearch} />
        </div>
      </div>
    </div>
  )
}

export default UserProfile;
