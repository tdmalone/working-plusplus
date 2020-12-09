import React, { useState } from 'react';
import moment from 'moment';
import {
  Button,
  ButtonGroup,
  ButtonDropdown,
  DropdownMenu,
  DropdownItem,
  DropdownToggle
} from 'reactstrap';

const DateFilter = props => {

  const today = moment().unix();
  const [isActive, setIsActive] = useState('allTime');

  const filterDates = (active = 'allTime') => {

  if (active === 'allTime') {

      setIsActive(active);
      props.onStartDateClick(moment(0).unix());
      props.onEndDateClick(moment().unix());
      props.onSearchClick('');
      props.onFilterClick(0);
      
    } else if (active === 'lastMonth') {

      setIsActive(active);
      props.onStartDateClick(moment.unix( today ).subtract(1,'months').startOf('month').unix());
      props.onEndDateClick(moment.unix( today ).subtract(1,'months').endOf('month').unix());
      props.onSearchClick('');
      props.onFilterClick(0);

    } else if (active === 'lastWeek') {

      setIsActive(active);
      props.onStartDateClick(moment.unix( today ).subtract(1,'week').startOf('week').add(1, 'day').unix());
      props.onEndDateClick(moment.unix( today ).subtract(1,'week').endOf('week').add(1, 'day').unix());
      props.onSearchClick('');
      props.onFilterClick(0);

    } else if (active === 'thisMonth') {

      setIsActive(active);
      props.onStartDateClick(moment.unix( today ).startOf('month').unix());
      props.onEndDateClick(moment.unix( today ).unix());
      props.onSearchClick('');
      props.onFilterClick(0);

    } else if (active === 'thisWeek') {

      setIsActive(active);
      props.onStartDateClick(moment.unix( today ).startOf('week').add(1, 'day').unix());
      props.onEndDateClick(moment.unix( today ).endOf('week').add(1, 'day').unix());
      props.onSearchClick('');
      props.onFilterClick(0);

    }
    
  }

  const [dropdownOpen, setOpen] = useState(false);
  const toggleDropDown = () => setOpen(!dropdownOpen);

  return (
    <div className="container">
     <div className="row mt-5">
        <div className="col">
          <h3 className="mb-0">
            { (props.channel === 'all') ? 'All Channels' : null }
            {props.listChannels ? (props.listChannels.map(el => {
              if (el.channel_id === props.channel) 
                return '#' + el.channel_name
              else
                return null
            })) : null }
          </h3>
        </div>
        <div className="col-8 text-right">
          <ButtonGroup>
            <Button className={`${isActive === 'thisWeek' ? 'active ' : ''}btn btn-light`} onClick={e => { filterDates('thisWeek'); } }>This Week</Button>
            <Button className={`${isActive === 'thisMonth' ? 'active ' : ''}btn btn-light`} onClick={e => { filterDates('thisMonth'); } }>This Month</Button>
            <Button className={`${isActive === 'lastWeek' ? 'active ' : ''}btn btn-light`} onClick={e => { filterDates('lastWeek'); } }>Last Week</Button>
            <Button className={`${isActive === 'lastMonth' ? 'active ' : ''}btn btn-light`} onClick={e => { filterDates('lastMonth'); } }>Last Month</Button>
            <Button className={`${isActive === 'allTime' ? 'active ' : ''}btn btn-light`} onClick={e => { filterDates('allTime'); } }>All Time</Button>
            <ButtonDropdown isOpen={dropdownOpen} toggle={toggleDropDown}>
              <DropdownToggle caret>
                Channels
              </DropdownToggle>
              <DropdownMenu>
                {props.listChannels ? <DropdownItem onClick={ e => { props.onChannelClick('all'); props.onSearchClick(''); props.onFilterClick(0); } }>All Channels</DropdownItem> : null}
                {props.listChannels ? (props.listChannels.map((el, index) => (
                  <DropdownItem key={index} onClick={e => { props.onChannelClick(el.channel_id); props.onSearchClick(''); props.onFilterClick(0); }}>#{el.channel_name}</DropdownItem>
                  )
                )) : <DropdownItem>No Channels</DropdownItem>}
              </DropdownMenu>
            </ButtonDropdown>
          </ButtonGroup>
        </div>
      </div>
    </div>
  )

}

export default DateFilter;