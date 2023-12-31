// import React, { useContext, useEffect, useRef, useState } from 'react';
// import './Home.scss';
// import { useNavigate } from 'react-router-dom';
// import ChatContext from '../../context/ChatContext';
// import { EmojiSmile, Send, ThreeDotsVertical } from 'react-bootstrap-icons';
// import { io } from 'socket.io-client';
// import { ChatContextValue } from '../../models/ChatContextValue';
// import { ChatsForLoggedInUser } from '../../models/ChatsForLoggedInUser';
// import { Users } from '../../models/Users';
// import { ChatMessage } from '../../models/ChatMessage';
// import { DateTimeFormatOptions } from '../../models/DateTimeFormatOptions';
// import { ConvertedDateTime } from '../../models/ConvertedDateTime';
// import EmojiPicker, { EmojiClickData, EmojiStyle } from 'emoji-picker-react';

// const Home = () => {
//   // Variables
//   let hostURL: any = process.env.REACT_APP_HOST_URL;
//   const context = useContext(ChatContext) as ChatContextValue;
//   let { users, chatsForLoggedInUser, availableChats, currChatRef, getUsers, setChatsForLoggedInUser, getCurrChat,
//     getChatsForLoggedInUser, setAvailableChats, updateProfilePic } = context;
//   const navigate = useNavigate();

//   // States
//   const [textValue, setTextValue] = useState("");
//   const [currSelectedUser, setCurrSelectedUser] = useState<ChatsForLoggedInUser>();
//   const [searchText, setSearchText] = useState<string>("");
//   const [findText, setfindText] = useState<string>("Chats");
//   const [availableUsers, setAvailableUsers] = useState<Users[] | []>([]);
//   const [count, setCount] = useState<number>(0);
//   const [typing, setTyping] = useState(false);
//   const [isTyping, setIsTyping] = useState(false);
//   const [selectedEmoji, setSelectedEmoji] = useState<string>("1f60a");
//   const [inputValue, setInputValue] = useState<string>("");
//   const [emojiContainer, setEmojiContainer] = useState<boolean>(false);
//   const [profileView, setProfileView] = useState<boolean>();
//   const [loggedInUser, setLoggedInUser] = useState<ChatsForLoggedInUser>();
//   const [options, setOptions] = useState<string[]>();

//   // Refs
//   const currSelUserRef = useRef<ChatsForLoggedInUser>();
//   const inputTextValRef = useRef<HTMLInputElement>(null);
//   const typingRef = useRef<boolean>(false);
//   const typingTimeoutRef = useRef<any>();
//   const socket = useRef<any>();
//   const logoutBtnRef = useRef<HTMLButtonElement>(null);
//   // Hooks
//   useEffect(() => {
//     // Initialization
//     if (sessionStorage.getItem("token")) {
//       socket.current = io(String(process.env.REACT_APP_HOST_URL));
//       let loggedInUser = sessionStorage.getItem("loginUser");
//       if (loggedInUser) {
//         const email = JSON.parse(loggedInUser).email;
//         setOptions?.(["Profile", "Chats", "Users", "Logout"]);
//         if (email && socket?.current) {
//           socket.current.emit("setup", email);
//         }
//       }
//     }
//     // eslint-disable-next-line
//   }, []);

//   useEffect(() => {
//     const loggedInUserString = sessionStorage.getItem("loginUser");
//     if (loggedInUserString !== null) {
//       setLoggedInUser(JSON.parse(loggedInUserString));
//       if (loggedInUser && users) {
//         users = users.filter((user) => user.email !== loggedInUser.email);
//       }
//     }
//     // eslint-disable-next-line
//   }, []);

//   useEffect(() => {
//     if (sessionStorage.getItem("token") && getChatsForLoggedInUser) {
//       if (!availableChats?.length) {
//         getChatsForLoggedInUser();
//       }
//     } else {
//       navigate("/login");
//     }
//     // eslint-disable-next-line
//   }, []);

//   useEffect(() => {
//     setTimeout(() => {
//       const bodyChatElement = document.querySelector('.body-chat-message-user');
//       if (bodyChatElement) {
//         bodyChatElement.scrollTop = bodyChatElement.scrollHeight;
//       }
//     }, 100);
//     // eslint-disable-next-line
//   }, [currChatRef?.current]);

//   useEffect(() => {
//     socket?.current?.on("receive_notification", (notification: any) => {
//       if (notification && availableChats) {
//         setAvailableChats?.((prevState: ChatsForLoggedInUser[]) => {
//           const updatedChats = prevState.map((chat: ChatsForLoggedInUser) => {
//             if (chat.email === notification.from_email) {
//               return {
//                 ...chat,
//                 latestMsg: notification.latestMsg
//               };
//             }
//             return chat;
//           });
//           const chatExists = updatedChats.some(chat => chat.email === notification.from_email);
//           if (!chatExists) {
//             updatedChats.push({
//               name: notification.from_name,
//               email: notification.from_email,
//               latestMsg: notification.latestMsg
//             });
//           }
//           return updatedChats;
//         });
//       }
//       let currSelUser = sessionStorage.getItem("currentSelectedUser");
//       if (currSelUser) {
//         const user = JSON.parse(currSelUser);
//         if (notification && user?.email === notification.from_email) {
//           const convertedDate: ConvertedDateTime = getCurrTimeAndDate();
//           let chat: ChatMessage = {
//             receiver: {
//               msg: notification.latestMsg,
//               dateTime: convertedDate
//             }
//           };
//           if (currChatRef?.current) {
//             const newCurrChat = [...currChatRef.current, chat];
//             currChatRef.current = newCurrChat;
//           }
//         }
//       }
//     });
//     // eslint-disable-next-line
//   }, []);

//   useEffect(() => {
//     socket?.current?.on("whats_your_status", (res: any) => {
//       const resp = res;
//       resp.isOnline = false;
//       if (sessionStorage.getItem("token") && res) {
//         resp.isOnline = true;
//         socket.current.emit("send_status", resp);
//       }
//     });
//     // eslint-disable-next-line
//   }, []);

//   useEffect(() => {
//     socket?.current?.on("user_online", (res: any) => {
//       if (res?.to_email) {
//         if (currSelUserRef?.current && currSelUserRef?.current?.email === res.to_email) {
//           currSelUserRef.current.online = res.isOnline;
//           setCount((c) => c + 1);
//         }
//         if (currSelectedUser && currSelectedUser.email === res.to_email) {
//           setCurrSelectedUser((prevState: ChatsForLoggedInUser | undefined) => {
//             if (!prevState) {
//               return undefined;
//             }
//             return { ...prevState, online: res.isOnline };
//           });
//         }
//         setAvailableChats?.((prevState: ChatsForLoggedInUser[]) => {
//           const updatedChats = prevState.map((chat: ChatsForLoggedInUser) => {
//             if (chat.email === res.to_email) {
//               return {
//                 ...chat,
//                 online: res.isOnline
//               };
//             }
//             return chat;
//           });
//           return updatedChats;
//         });
//         setAvailableUsers?.((prevState: Users[]) => {
//           const updatedUsers = prevState.map((user: Users) => {
//             if (user.email === res.to_email) {
//               return {
//                 ...user,
//                 online: res.isOnline
//               };
//             }
//             return user;
//           });
//           return updatedUsers;
//         });
//       }
//     });
//     // eslint-disable-next-line
//   }, []);

//   useEffect(() => {
//     socket?.current?.on("user_logged_status", (res: any) => {
//       if (loggedInUser?.email && res?.to_email) {
//         if (loggedInUser.email !== res.to_email) {
//           if (currSelUserRef?.current && currSelUserRef?.current?.email === res.to_email) {
//             currSelUserRef.current.online = res.isOnline;
//             setCount((c) => c + 1);
//           }
//           if (currSelectedUser && currSelectedUser.email === res.to_email) {
//             setCurrSelectedUser((prevState: ChatsForLoggedInUser | undefined) => {
//               if (!prevState) {
//                 return undefined;
//               }
//               return { ...prevState, online: res.isOnline };
//             });
//           }
//           setAvailableChats?.((prevState: ChatsForLoggedInUser[]) => {
//             const updatedChats = prevState.map((chat: ChatsForLoggedInUser) => {
//               if (chat.email === res.to_email) {
//                 return {
//                   ...chat,
//                   online: res.isOnline
//                 };
//               }
//               return chat;
//             });
//             return updatedChats;
//           });
//           setAvailableUsers?.((prevState: Users[]) => {
//             const updatedUsers = prevState.map((user: Users) => {
//               if (user.email === res.to_email) {
//                 return {
//                   ...user,
//                   online: res.isOnline
//                 };
//               }
//               return user;
//             });
//             return updatedUsers;
//           });
//         }
//       }
//     });
//     return () => {
//       socket?.current?.off("user_logged_status");
//     }
//     // eslint-disable-next-line
//   }, []);

//   useEffect(() => {
//     socket?.current?.on("typing", () => {
//       setIsTyping(true);
//       return () => { socket?.current?.off("typing") }
//     });
//     socket?.current?.on("stop_typing", () => {
//       setIsTyping(false);
//       return () => { socket?.current?.off("stop_typing") }
//     });
//     // eslint-disable-next-line
//   }, []);

//   useEffect(() => {
//     const userChats = document.querySelectorAll('.user-chat');
//     if (userChats?.length && currSelectedUser) {
//       userChats.forEach((chat) => {
//         if (chat.getAttribute('data-username') === currSelectedUser?.email) {
//           chat.classList.add("active");
//         } else {
//           chat.classList.remove("active");
//         }
//       });
//       if (inputTextValRef?.current) {
//         inputTextValRef.current.focus();
//       }
//     }
//     // eslint-disable-next-line
//   }, [currSelectedUser]);

//   useEffect(() => {
//     document.body.scrollTop = document.body.scrollHeight;
//     document.documentElement.scrollTop = document.documentElement.scrollHeight;
//     // eslint-disable-next-line
//   }, [emojiContainer]);

//   useEffect(() => {
//     socket?.current?.on("updated_pic", (res: any) => {
//       if (res) {
//         setAvailableChats?.((prevState: ChatsForLoggedInUser[]) => {
//           const updatedChats = prevState.map((chat: ChatsForLoggedInUser) => {
//             if (chat.email === res.email) {
//               return {
//                 ...chat,
//                 pic: res.pic
//               };
//             }
//             return chat;
//           });
//           return updatedChats;
//         });

//         setAvailableUsers?.((prevState: Users[]) => {
//           const updatedUsers = prevState.map((user: Users) => {
//             if (user.email === res.email) {
//               return {
//                 ...user,
//                 pic: res.pic
//               };
//             }
//             return user;
//           });
//           return updatedUsers;
//         });

//         setCurrSelectedUser?.((prevState: any) => {
//           if (prevState?.email === res.email) {
//             return { ...prevState, pic: res.pic };
//           }
//         });
//         setCount((e) => e + 1);
//       }
//     });
//   }, []);

//   // Functions
//   const getCurrTimeAndDate = (): ConvertedDateTime => {
//     const utcDateTime = new Date();

//     utcDateTime.setHours(utcDateTime.getHours());
//     utcDateTime.setMinutes(utcDateTime.getMinutes());

//     // Format the date and time
//     const options: DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
//     const formattedDate = utcDateTime.toLocaleDateString('en-US', options);
//     const formattedTime = utcDateTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

//     return {
//       date: formattedDate,
//       time: `${formattedTime}`
//     };
//   };

//   const handleOnSendMsg = async (e: any = null) => {
//     setEmojiContainer(false);
//     const authToken = sessionStorage.getItem("token");
//     if (authToken && currSelectedUser?.email) {
//       if (!typingRef?.current) {
//         if (typingTimeoutRef.current) {
//           clearTimeout(typingTimeoutRef.current);
//         }
//         setTyping(true);
//         if (typingRef) {
//           typingRef.current = true;
//         }
//         socket.current.emit("typing", currSelectedUser.email);
//       }
//       // Check if a timeout is already active
//       if (typingTimeoutRef.current) {
//         clearTimeout(typingTimeoutRef.current);
//       }
//       // Set a new timeout
//       typingTimeoutRef.current = setTimeout(() => {
//         socket.current.emit("stop_typing", currSelectedUser.email);
//         setTyping(false);
//         if (typingRef) {
//           typingRef.current = false;
//         }
//       }, 1000);
//     }
//     if (!authToken || (e?.key !== "Enter" && e)) {
//       return;
//     } else if (authToken && loggedInUser?.email && currSelectedUser?.email) {
//       const users = JSON.stringify([loggedInUser, currSelectedUser]);
//       let chatName = `${loggedInUser.email}&${currSelectedUser.email}`;
//       const response = await fetch(`${hostURL}/api/chat/sendMsg`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           "auth-token": authToken
//         },
//         body: JSON.stringify({ chatName: chatName, users: users, latestMsg: textValue })
//       });
//       if (response) {
//         const json = await response.json();
//         if (json) {
//           const notification = {
//             from_name: loggedInUser.name, to_email: currSelectedUser.email,
//             from_email: loggedInUser.email, latestMsg: textValue
//           };
//           socket.current.emit("send_user_notification", notification);

//           if (loggedInUser?.email && currSelectedUser?.email) {
//             const loginEmail = loggedInUser.email;
//             const fromToEmail = { from_email: loginEmail, to_email: currSelectedUser.email };
//             socket.current.emit("check_user_online", fromToEmail);
//           }
//           updateCurrChatAfterMsgSent();
//           setChatsForLoggedInUser?.((prevState: ChatsForLoggedInUser[]) => {
//             const updatedChats = prevState.map((chat: ChatsForLoggedInUser) => {
//               if (chat.email === currSelectedUser.email) {
//                 return {
//                   ...chat,
//                   latestMsg: textValue
//                 };
//               }
//               return chat;
//             });
//             const chatExists = updatedChats.some(chat => chat.email === currSelectedUser.email);
//             if (!chatExists) {
//               updatedChats.push({
//                 name: currSelectedUser.name,
//                 email: currSelectedUser.email,
//                 latestMsg: textValue
//               });
//             }
//             setAvailableChats?.(updatedChats);
//             return updatedChats;
//           });
//         }
//       }
//     }
//   };

//   const updateCurrChatAfterMsgSent = async (): Promise<void> => {
//     if (currSelectedUser && textValue) {
//       const convertedDate: ConvertedDateTime = getCurrTimeAndDate();
//       let chat: ChatMessage = {
//         sender: {
//           msg: textValue,
//           dateTime: convertedDate
//         }
//       };
//       if (currChatRef?.current) {
//         currChatRef.current = [...currChatRef.current, chat];
//       }
//       setTextValue("");
//       setfindText("Chats");
//     }
//   };

//   const handleOnUserClick = (user: ChatsForLoggedInUser | Users) => {
//     if (user) {
//       (currChatRef as React.MutableRefObject<ChatMessage[] | []>).current = [];
//       setCurrSelectedUser(user);
//       currSelUserRef.current = user;
//       getCurrChat?.(user.email);
//       setSearchText("");
//       sessionStorage.setItem("currentSelectedUser", JSON.stringify(user));
//       setTimeout(() => {
//         if (chatsForLoggedInUser?.length && searchText?.length) {
//           setAvailableChats?.(chatsForLoggedInUser.filter((chat) => chat.name.includes(searchText)));
//         }
//         if (loggedInUser) {
//           const fromToEmail = { from_email: loggedInUser.email, to_email: user.email };
//           socket.current.emit("check_user_online", fromToEmail);
//         }
//       }, 10);
//     }
//   };

//   const handleOnNewChatClick = () => {
//     setProfileView(false);
//     if (findText === "Chats") {
//       setfindText("Users");
//       setAvailableUsers?.([]);
//       if (sessionStorage.getItem("token")) {
//         getUsers?.();
//       }
//     } else if (findText === "Users" || findText === "Profile") {
//       setfindText("Chats");
//     }
//   };

//   const handleOnOptionClick = (option: string) => {
//     switch (option) {
//       case "Profile":
//         setProfileView(true);
//         setfindText(option);
//         break;
//       case "Chats":
//         setfindText(option);
//         setProfileView(false);
//         break;
//       case "Users":
//         setfindText(option);
//         setfindText("Users");
//         setAvailableUsers?.([]);
//         if (sessionStorage.getItem("token")) {
//           getUsers?.();
//         }
//         setProfileView(false);
//         break;
//       case "Logout":
//         logoutBtnRef.current?.click();
//         break;
//       default:
//         break;
//     }
//   };

//   const onChange = (e: any) => {
//     setTextValue(e.target.value);
//   };

//   const onSearchTextChange = (e: any) => {
//     if (findText === "Chats") {
//       if (chatsForLoggedInUser) {
//         setAvailableChats?.(chatsForLoggedInUser.filter((chat) => chat.name.toLocaleLowerCase().includes(e.target.value.toLocaleLowerCase())));
//       }
//     } else {
//       if (users && e.target.value) {
//         setAvailableUsers?.(users.filter((chat) => (chat.name.toLocaleLowerCase() !== loggedInUser?.name.toLocaleLowerCase()) && chat.name.toLocaleLowerCase().includes(e.target.value.toLocaleLowerCase())));
//       } else {
//         setAvailableUsers([]);
//       }
//     }
//     setSearchText(e.target.value);
//   };

//   const handleOnEmojiClick = (emojiData: EmojiClickData, event: MouseEvent) => {
//     if (inputTextValRef.current) {
//       // Get the current cursor position
//       const cursorPosition = inputTextValRef.current.selectionStart;

//       // Get the current value of the input
//       const currentValue = inputTextValRef.current.value;

//       // Append the emoji at the desired position
//       if (cursorPosition) {
//         const updatedValue =
//           currentValue.slice(0, cursorPosition) +
//           (emojiData.isCustom ? emojiData.unified : emojiData.emoji) +
//           currentValue.slice(cursorPosition);

//         // Update the textValue state
//         setTextValue(updatedValue);
//         setTimeout(() => {
//           if (inputTextValRef?.current) {
//             const newCursorPosition = cursorPosition + (emojiData.isCustom ? emojiData.unified.length : emojiData.emoji.length);
//             inputTextValRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
//             inputTextValRef.current.focus();
//           }
//         }, 0);
//       } else {
//         setTextValue(String(emojiData.isCustom ? emojiData.unified : emojiData.emoji));
//         inputTextValRef.current.focus();
//       }
//     }
//   };

//   const handleLogout = () => {
//     setProfileView(false);
//     if (sessionStorage.getItem("token")) {
//       let loggedInUser = sessionStorage.getItem("loginUser");
//       if (loggedInUser) {
//         const email = JSON.parse(loggedInUser).email;
//         const res = { to_email: email, isOnline: false };
//         socket?.current?.emit("user_logged_out", res);
//         sessionStorage.clear();
//         navigate("/login");
//       }
//     }
//   };

//   const postPicDetails = (pics: any) => {
//     if (pics && (pics.type === "image/jpeg" || pics.type === "image/png")) {
//       const data = new FormData();
//       data.append("file", pics);
//       data.append("upload_preset", "iChat-app");
//       data.append("cloud_name", "basicalycoder");
//       fetch("https://api.cloudinary.com/v1_1/basicalycoder/image/upload", {
//         method: "post",
//         body: data,
//       })
//         .then((res) => res.json())
//         .then((data) => {
//           let picURL = data.url.toString();
//           if (loggedInUser) {
//             const firstHttpIndex = picURL.indexOf("http:");
//             if (firstHttpIndex !== -1) {
//               picURL = picURL.slice(0, firstHttpIndex) + "https:" + picURL.slice(firstHttpIndex + 5);
//             }
//             loggedInUser.pic = picURL;
//             const data = {
//               email: loggedInUser.email,
//               pic: picURL
//             }
//             socket?.current?.emit("updated_pic", data);
//             if (loggedInUser.pic) {
//               updateProfilePic?.(loggedInUser.pic);
//               setCount((e) => e + 1);
//             }
//           }
//         })
//         .catch((err) => {
//           console.log(err);
//         });
//     } else {
//       alert("Please Select an Image!");
//     }
//   };

//   // Logical part

//   // TSX - DOM
//   return (
//     <div className='home-component'>
//       <div className="content-chat">
//         {/* Left box */}
//         <div className="content-chat-user">

//           <div className="head-search-chat">
//             <a className="menu home-menu" role="button" data-bs-toggle="dropdown" aria-expanded="false"><ThreeDotsVertical color="white" size={25} /></a>
//             <h4 className="text-center">{findText}</h4>
//             <ul className='dropdown-menu home-dropdown-menu'>
//               {options?.length ? options.map((option, i) => {
//                 return (<div key={i}>
//                   {findText !== option ? <li><a className='dropdown-item' onClick={() => handleOnOptionClick(option)}>{option}</a></li> : ""}
//                 </div>)
//               }) : ""}
//             </ul>
//           </div>
//           <div className="search-user">
//             {!profileView && <input id="search-input" type="text" placeholder={findText === "Chats" ? "Search chat..." : "Search user..."} name="search" value={searchText} onChange={onSearchTextChange} className="search" />}
//             <span>
//               <i className="fa-solid fa-magnifying-glass"></i>
//             </span>
//           </div>

//           {!profileView && <div className="list-search-user-chat mt-20">
//             {findText === "Chats" && availableChats && availableChats.length > 0 && availableChats.map((user, index) => {
//               return (
//                 <div key={index} className="user-chat" data-username={user?.email} onClick={() => handleOnUserClick(user)}>
//                   <div className="user-chat-img">
//                     <img src={user?.pic ? user.pic : "/user-profile-default.png"} alt="" />
//                     <div className={`button ${user?.online ? 'online' : 'offline'}`}></div>
//                   </div>

//                   <div className="user-chat-text">
//                     <p className="mt-0 mb-0"><strong>{user?.name}</strong></p>
//                     <small className='latest-msg'>{user?.latestMsg}</small>
//                   </div>
//                 </div>
//               )
//             })}
//             {findText === "Users" && availableUsers.map((user, index) => {
//               return (
//                 <div key={index} className="user-chat" data-username={user.email} onClick={() => handleOnUserClick(user)}>
//                   <div className="user-chat-img">
//                     <img src={user?.pic ? user.pic : "/user-profile-default.png"} alt="" />
//                     <div className={`button ${user?.online ? 'online' : 'offline'}`}></div>
//                   </div>

//                   <div className="user-chat-text">
//                     <p className="mt-0 mb-0"><strong>{user.name}</strong></p>
//                   </div>
//                 </div>
//               )
//             })}
//           </div>}

//           {profileView &&
//             <div className='profile-details'>
//               <img className='profile-pic' src={loggedInUser?.pic ? loggedInUser.pic : "/user-profile-default.png"} alt="" />
//               <p className='login-user-name'>Name: {loggedInUser?.name ? loggedInUser.name : ""}</p>
//               <p className='login-user-email'>Email: {loggedInUser?.email ? loggedInUser.email : ""}</p>
//               <div className='login-user-set-pic'>
//                 <p className='login-user-set-pic-label'>Change profile pic:</p>
//                 <input className='login-user-set-pic-input' type="file" accept="image/*" onChange={(e) => e?.target?.files ? postPicDetails(e.target.files[0]) : null} />
//               </div>
//             </div>}

//         </div>

//         {/* Right box */}
//         {currSelectedUser?.name ?
//           (<>
//             <div className="content-chat-message-user active" data-username="Maria Dennis">
//               <div className="head-chat-message-user">
//                 <img src={currSelectedUser?.pic ? currSelectedUser.pic : "/user-profile-default.png"} alt="" />
//                 <div className="message-user-profile">
//                   <p className="mt-0 mb-0 text-white"><strong>{currSelectedUser?.name}</strong></p>
//                   {!isTyping ? <small className="text-white mt-1"><p className={`button ${currSelUserRef?.current?.online ? 'online' : 'offline'} mt-0 mb-0`}></p>{currSelUserRef?.current?.online ? "Online" : "Offline"}</small>
//                     : <small className="text-white mt-1"><p className={`button ${currSelUserRef?.current?.online ? 'online' : 'offline'} mt-0 mb-0`}></p>Typing...</small>}
//                 </div>
//               </div>
//               <div className="body-chat-message-user">
//                 {loggedInUser && currChatRef?.current?.map((chat, index) => {
//                   return (
//                     <div key={index} className="body-chat-message-user-content">

//                       {chat?.receiver ?
//                         <>
//                           <div className="message-user-left">
//                             <div className="message-user-left-img">
//                               <img src={currSelectedUser?.pic ? currSelectedUser.pic : "/user-profile-default.png"} alt="" />
//                               <p className="mt-0 mb-0"><strong>{currSelectedUser?.name}</strong></p>
//                               <small>{chat.receiver.dateTime.time}</small>
//                             </div>
//                             <div className="message-user-left-text">
//                               <strong>{chat.receiver.msg}</strong>
//                             </div>
//                           </div>
//                         </>
//                         :
//                         null}

//                       {chat?.sender ?
//                         <>
//                           <div className="message-user-right">
//                             <div className="message-user-right-img">
//                               <p className="mt-0 mb-0"><strong>{loggedInUser?.name}</strong></p>
//                               <small>{chat.sender.dateTime.time}</small>
//                               <img src={loggedInUser?.pic ? loggedInUser.pic : "/user-profile-default.png"} alt="" />
//                             </div>
//                             <div className="message-user-right-text">
//                               <strong>{chat.sender.msg}</strong>
//                             </div>
//                           </div>
//                         </>
//                         :
//                         null}
//                     </div>
//                   )
//                 })}
//               </div>
//               <div className="footer-chat-message-user">
//                 <div className="message-user-send">
//                   <span className='emoji-icons' onClick={() => setEmojiContainer((e) => !e)}>
//                     <EmojiSmile size={18} color='gray' />
//                   </span>
//                   <input type="text" placeholder="Message" id='textValue' name='textValue' ref={inputTextValRef} value={textValue} onChange={onChange} onClick={() => setEmojiContainer(false)} onKeyDown={(e) => handleOnSendMsg(e)} />
//                 </div>
//                 <button type="button" id='send-msg' onClick={() => handleOnSendMsg()}>
//                   <Send color="white" size={25} />
//                 </button>
//               </div>
//               {emojiContainer ? <div className="emoji-picker">
//                 <EmojiPicker
//                   onEmojiClick={handleOnEmojiClick}
//                   autoFocusSearch={false}
//                   emojiStyle={EmojiStyle.NATIVE} />
//               </div> : null}
//             </div>
//           </>)
//           :
//           <>
//             <div className="no-chat-available">
//               <h3>No chat available</h3>
//             </div>
//           </>
//         }
//       </div>
//       <button type="button" className="logout-btn" ref={logoutBtnRef} data-bs-toggle="modal" data-bs-target="#exampleModal">Logout</button>
//       <div className="modal fade" id="exampleModal" tabIndex={-1} aria-labelledby="exampleModalLabel" aria-hidden="true">
//         <div className="modal-dialog">
//           <div className="modal-content">
//             <div className="modal-header">
//               <h1 className="modal-title fs-5" id="exampleModalLabel">Logout</h1>
//               <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
//             </div>
//             <div className="modal-body">
//               Are you sure you really want to Logout?
//             </div>
//             <div className="modal-footer">
//               <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
//               <button type="button" className="btn btn-primary" data-bs-dismiss="modal" onClick={() => handleLogout()}>Logout</button>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div >
//   );
// }

// export default Home;
