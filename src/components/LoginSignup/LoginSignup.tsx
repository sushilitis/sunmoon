import React, { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from "react-router-dom";
import "./LoginSignup.scss"
import ChatContext from '../../context/ChatContext';
import { ChatContextValue } from '../../models/ChatContextValue';
import { io } from 'socket.io-client';

const LoginSignup = () => {
  // Variables
  let hostURL: any = process.env.REACT_APP_HOST_URL;
  const context = useContext(ChatContext) as ChatContextValue;
  let { getUsers } = context;
  const navigate = useNavigate();

  // States
  const [creds, setCreds] = useState({ lemail: "", lpassword: "" });
  const [user, setUser] = useState({ sname: "", semail: "", spassword: "" });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const [loginErrorMsg, setLoginErrorMsg] = useState("");
  const [pic, setPic] = useState();

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

  // Functions
  const handleSignUpClick = () => {
    const container = document.getElementById('login-signup-container');
    if (container) {
      container.classList.add('right-panel-active');
    }
  };

  const handleSignInClick = () => {
    const container = document.getElementById('login-signup-container');
    if (container) {
      container.classList.remove('right-panel-active');
    }
  };

  const handleLoginSubmit = async (e: any) => {
    e.preventDefault();
    if (!creds.lpassword || !creds.lemail) return;
    const response = await fetch(`${hostURL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email: (creds.lemail).toLocaleLowerCase(), password: creds.lpassword })
    });
    const json = await response.json();
    if (json.success) {
      sessionStorage.setItem("token", json.authToken);
      const { _id, name, email, pic, date } = json.loggedInUser;
      const user = { _id: _id, "name": name, "email": email, "pic": pic, "date": date };
      sessionStorage.setItem("loginUser", JSON.stringify(user));
      socket?.current?.emit("setup", email);
      getUsers?.();
      navigate("/home");
    } else if (json.error) {
      setLoginErrorMsg(json.error);
    }
  };

  const handleSignupSubmit = async (e: any) => {
    e.preventDefault();
    if (!user.spassword || !user.sname || !user.semail || !confirmPassword || !passwordsMatch) return;
    const newUser = { name: user.sname, email: (user.semail).toLocaleLowerCase(), password: user.spassword, pic: pic };
    const response = await fetch(`${hostURL}/api/auth/createuser`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(newUser)
    });
    const json = await response.json();
    if (json.success) {
      navigate("/home");
    } else {
      alert("Invalid credentials");
    }
  };

  const onLoginChange = (e: any) => {
    setCreds({ ...creds, [e.target.name]: e.target.value });
    setLoginErrorMsg("");
  };

  const onSignupChange = (e: any) => {
    setUser({ ...user, [e.target.name]: e.target.value });
    setPasswordsMatch(user.spassword === confirmPassword);
  };

  const handleConfirmPasswordChange = (e: any) => {
    setConfirmPassword(e.target.value);
    setPasswordsMatch(e.target.value === user.spassword);
  };

  const postPicDetails = (pics: any) => {
    if (pics.type === "image/jpeg" || pics.type === "image/png") {
      const data = new FormData();
      data.append("file", pics);
      data.append("upload_preset", "iChat-app");
      data.append("cloud_name", "basicalycoder");
      fetch("https://api.cloudinary.com/v1_1/basicalycoder/image/upload", {
        method: "post",
        body: data,
      })
        .then((res) => res.json())
        .then((data) => {
          let picURL = data.url.toString();
          const firstHttpIndex = picURL.indexOf("http:");
          if (firstHttpIndex !== -1) {
            picURL = picURL.slice(0, firstHttpIndex) + "https:" + picURL.slice(firstHttpIndex + 5);
          }
          setPic(picURL);
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      alert("Please Select an Image!");
    }
  };

  return (
    <div>
      <div className="login-signup-component">
        <div className="container" id="login-signup-container">
          <div className="form-container sign-up-container">
            <form onSubmit={handleSignupSubmit}>
              <h1>Create Account</h1>
              {/* <div className="social-container">
                <a className="social"><i className="fab fa-facebook-f"></i></a>
                <a className="social"><i className="fab fa-google-plus-g"></i></a>
                <a className="social"><i className="fab fa-linkedin-in"></i></a>
              </div>*/}
              <input type="text" id='sname' name='sname' value={user.sname} onChange={onSignupChange} placeholder="Name" />
              <input type="email" id='semail' name='semail' value={user.semail} onChange={onSignupChange} placeholder="Email" />
              <input type="password" id='spassword' name='spassword' value={user.spassword} onChange={onSignupChange} placeholder="Password" />
              <input type="password" id='scpassword' name='scpassword' value={confirmPassword} onChange={handleConfirmPasswordChange} placeholder="Confirm Password" />
              <input type="file" accept="image/*" onChange={(e) => e?.target?.files ? postPicDetails(e.target.files[0]) : null} />
              {!passwordsMatch && confirmPassword?.length > 0 && <span className="error">Passwords do not match</span>}
              <button id='sign-up' className='sign-up-btn' disabled={!user.spassword || !user.sname || !user.semail || !confirmPassword || !passwordsMatch} type='submit'>Sign Up</button>
            </form>
          </div>
          <div className="form-container sign-in-container">
            <form onSubmit={handleLoginSubmit}>
              <h1>Sign in</h1>
              {/* <div className="social-container">
                <a href="#" className="social"><i className="fab fa-facebook-f"></i></a>
                <a href="#" className="social"><i className="fab fa-google-plus-g"></i></a>
                <a href="#" className="social"><i className="fab fa-linkedin-in"></i></a>
              </div>*/}
              <input type="email" id='lemail' name='lemail' value={creds.lemail} onChange={onLoginChange} placeholder="Email" />
              <input type="password" id='lpassword' name='lpassword' value={creds.lpassword} onChange={onLoginChange} placeholder="Password" />
              {/* <a href="#">Forgot your password?</a> */}
              {loginErrorMsg && loginErrorMsg.length > 0 && <p className="error">{loginErrorMsg}</p>}
              <button id='sign-in' className='sign-in-btn' disabled={!creds.lpassword || !creds.lemail} type='submit'>Sign In</button>
            </form>
          </div>
          <div className="overlay-container">
            <div className="overlay">
              <div className="overlay-panel overlay-left">
                <h1>Welcome Back!</h1>
                <p>To keep connected with us please login with your personal info</p>
                <button className="ghost" id="signIn" onClick={handleSignInClick}>Sign In</button>
              </div>
              <div className="overlay-panel overlay-right">
                <h1>Hello, Friend!</h1>
                <p>Enter your personal details and start journey with us</p>
                <button className="ghost" id="signUp" onClick={handleSignUpClick}>Sign Up</button>
              </div>
            </div>
          </div>
        </div>

        {/* <div className="footer">
                <b>	Follow me on </b>
                <div className="icons">
                    <a href="https://github.com/kvaibhav01" target="_blank" className="social"><i className="fab fa-github"></i></a>
                    <a href="https://www.instagram.com/vaibhavkhulbe143/" target="_blank" className="social"><i className="fab fa-instagram"></i></a>
                    <a href="https://medium.com/@vaibhavkhulbe" target="_blank" className="social"><i className="fab fa-medium"></i></a>
                    <a href="https://twitter.com/vaibhav_khulbe" target="_blank" className="social"><i className="fab fa-twitter-square"></i></a>
                    <a href="https://linkedin.com/in/vaibhav-khulbe/" target="_blank" className="social"><i className="fab fa-linkedin"></i></a>
                </div>
            </div> */}
      </div>
    </div>
  )
}

export default LoginSignup;