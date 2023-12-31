import React, { HTMLAttributes, useContext, useEffect, useRef, useState } from 'react';
import { PersonFillGear } from 'react-bootstrap-icons';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Navbar.scss';
import { ChatContextValue } from '../../models/ChatContextValue';
import ChatContext from '../../context/ChatContext';
import { io } from 'socket.io-client';

export const Navbar: React.FC<HTMLAttributes<HTMLDivElement>> = () => {
  let location = useLocation();
  const navigate = useNavigate();
  const context = useContext(ChatContext) as ChatContextValue;
  let { users } = context;

  // States
  const [username, setUsername] = useState("");

  // Refs
  const socket = useRef<any>();

  // Hooks
  useEffect(() => {
    // Initialization
    if (sessionStorage.getItem("token")) {
      socket.current = io(String(process.env.REACT_APP_HOST_URL));
    }
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (sessionStorage.getItem("token")) {
      let loggedInUser = sessionStorage.getItem("loginUser");
      if (loggedInUser) {
        const email = JSON.parse(loggedInUser).name;
        setUsername(email);
      }
    }
    // eslint-disable-next-line
  }, [users]);

  // Functions
  const handleLogout = () => {
    if (sessionStorage.getItem("token")) {
      let loggedInUser = sessionStorage.getItem("loginUser");
      if (loggedInUser) {
        const email = JSON.parse(loggedInUser).email;
        const res = { to_email: email, isOnline: false };
        socket?.current?.emit("user_logged_out", res);
        sessionStorage.clear();
        navigate("/login");
      }
    }
  };

  return (
    <>
      <nav className="navbar navbar-expand-lg bg-body-tertiary bg-dark navbar-dark">
        <div className="container-fluid">
          <Link className="navbar-brand" to="/home">iChat</Link>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarSupportedContent">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              {/* <li className="nav-item">
                <Link className={`nav-link ${location.pathname === "/home" ? "active" : ""}`} aria-current="page" to="/home">Home</Link>
              </li> */}
            </ul>
            {sessionStorage.getItem("token") ?
              <div>
                <a className="menu navbar-menu" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                  <PersonFillGear color='white' size={25} />
                </a>
                {username && <span className='user-name-field'>Welcome <span className='user-name'><b>{username}</b></span></span>}
                <ul className="dropdown-menu navbar-dropdown-menu">
                  <li className='dropdown-item-li'><a className="dropdown-item" onClick={handleLogout}>Logout</a></li>
                </ul>
              </div> : ""}
          </div>
        </div>
      </nav>
    </>
  );
}
