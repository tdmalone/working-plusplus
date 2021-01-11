import React, { useState } from 'react';
import { BrowserRouter as Router, Link, useLocation } from 'react-router-dom';
import logo from '../logo.svg';
import { Collapse, Navbar, NavbarToggler, NavbarBrand, Nav, NavItem } from 'reactstrap';

const NavBar = props => {

  let location = useLocation();
  const urlParams = location.search;

  const [isOpen, setIsOpen] = useState(false);
  const toggle = () => setIsOpen(!isOpen);

  return (
    <Navbar light expand="md">
      <div className="container">
        <NavbarBrand href="/"><img src={logo} alt="Agiledrop" /></NavbarBrand>
        <NavbarToggler onClick={toggle} />
        <Collapse isOpen={isOpen} navbar>
          <Nav className="mr-auto" navbar>
            <NavItem>
              <Link to={"/" + urlParams} onClick={ e => props.onClick('') } className="nav-link">Top Chart</Link>
            </NavItem>
            <NavItem>
              <Link to={"/feed" + urlParams} onClick={ e => props.onClick('') } className="nav-link">Feed</Link>
            </NavItem>
          </Nav>
          
          <input
            className="form-control"
            type="text"
            placeholder="Search"
            aria-label="Search"
            value={props.search}
            onChange={e => props.onChange(e.target.value)}
          />
          
        </Collapse>
      </div>
    </Navbar>
  )
}

export default NavBar;
