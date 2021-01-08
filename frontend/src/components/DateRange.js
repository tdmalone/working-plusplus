import React, { useState } from 'react';
import queryString from 'query-string';
import { DateRangePicker, defaultStaticRanges, createStaticRanges } from 'react-date-range';
import { fromUnixTime, getUnixTime, endOfDay } from 'date-fns';
import { enGB } from 'date-fns/locale'
import 'react-date-range/dist/styles.css'; // main style file
import 'react-date-range/dist/theme/default.css'; // theme css file

import {
  ButtonGroup,
  ButtonDropdown,
  DropdownMenu,
  DropdownItem,
  DropdownToggle
} from 'reactstrap';
 
const DateRange = props => {

  const parsedQuery = queryString.parse(props.query);

  const [state, setState] = useState([
    {
      startDate: (props.query.length === 0) ? getUnixTime(0) : fromUnixTime(parsedQuery.startDate),
      endDate: (props.query.length === 0) ? endOfDay(new Date()) : fromUnixTime(parsedQuery.endDate),
      key: 'selection'
    }
  ]);

  const [dropdownOpen, setOpen] = useState(false);
  const toggleDropDown = () => setOpen(!dropdownOpen);

  const [dropdownOpen2, setOpen2] = useState(false);
  const toggleDropDown2 = () => setOpen2(!dropdownOpen2);
  
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
            <ButtonDropdown isOpen={dropdownOpen} toggle={toggleDropDown}>
              <DropdownToggle caret>
                Dates
              </DropdownToggle>
              <DropdownMenu right>
                  <DateRangePicker
                    onChange={ 
                      item => { 
                        setState([item.selection]);
                        props.onStartDateClick(getUnixTime(item.selection.startDate));
                        props.onEndDateClick(getUnixTime(item.selection.endDate));
                        props.onSearchClick('');
                      }
                    }
                    showSelectionPreview={true}
                    moveRangeOnFirstSelection={false}
                    months={1}
                    ranges={state}
                    direction="horizontal"
                    locale={enGB}
                    weekStartsOn={1}
                    staticRanges={[
                      ...defaultStaticRanges,
                      ...createStaticRanges([
                        {
                          label: 'Begining of Time',
                          range: () => ({
                            startDate: fromUnixTime(0),
                            endDate: endOfDay(new Date())
                          })
                        }
                      ])
                    ]}
                  />
              </DropdownMenu>
            </ButtonDropdown>
            <ButtonDropdown isOpen={dropdownOpen2} toggle={toggleDropDown2}>
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

export default DateRange;