import React, { useContext, useEffect, useRef, useState } from 'react';
import "./HomeScreen.scss"
import { EmojiSmile, Person, PersonLinesFill, Search, Send } from 'react-bootstrap-icons';
import { IoIosArrowRoundBack } from "react-icons/io";
import { ChatDots } from 'react-bootstrap-icons';
import { LuUser } from "react-icons/lu";
import { MdOutlineEmail } from "react-icons/md";
import { IoCameraReverseOutline } from "react-icons/io5";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { useNavigate } from 'react-router-dom';
import ChatContext from '../../context/ChatContext';
import { io } from 'socket.io-client';
import { ChatContextValue } from '../../models/ChatContextValue';
import { ChatsForLoggedInUser } from '../../models/ChatsForLoggedInUser';
import { Users } from '../../models/Users';
import { ChatMessage } from '../../models/ChatMessage';
import { DateTimeFormatOptions } from '../../models/DateTimeFormatOptions';
import { ConvertedDateTime } from '../../models/ConvertedDateTime';
import EmojiPicker, { EmojiClickData, EmojiStyle } from 'emoji-picker-react';

const HomeScreen = () => {
    // Variables
    let hostURL: any = process.env.REACT_APP_HOST_URL;
    const context = useContext(ChatContext) as ChatContextValue;
    let { users, chatsForLoggedInUser, availableChats, currChatRef, getUsers, setChatsForLoggedInUser, getCurrChat,
        getChatsForLoggedInUser, setAvailableChats, updateProfilePic } = context;
    const navigate = useNavigate();

    // States
    const [textValue, setTextValue] = useState("");
    const [currSelectedUser, setCurrSelectedUser] = useState<ChatsForLoggedInUser>();
    const [searchText, setSearchText] = useState<string>("");
    const [findText, setfindText] = useState<string>("Chats");
    const [availableUsers, setAvailableUsers] = useState<Users[] | []>([]);
    const [count, setCount] = useState<number>(0);
    const [typing, setTyping] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [selectedEmoji, setSelectedEmoji] = useState<string>("1f60a");
    const [inputValue, setInputValue] = useState<string>("");
    const [emojiContainer, setEmojiContainer] = useState<boolean>(false);
    const [profileView, setProfileView] = useState<boolean>();
    const [loggedInUser, setLoggedInUser] = useState<ChatsForLoggedInUser>();
    const [options, setOptions] = useState<string[]>();
    const [loader, setLoader] = useState<boolean>(false);

    // Refs
    const currSelUserRef = useRef<ChatsForLoggedInUser>();
    const inputTextValRef = useRef<HTMLInputElement>(null);
    const typingRef = useRef<boolean>(false);
    const typingTimeoutRef = useRef<any>();
    const socket = useRef<any>();
    const logoutBtnRef = useRef<HTMLButtonElement>(null);
    // Hooks
    useEffect(() => {
        // Initialization
        if (sessionStorage.getItem("token")) {
            socket.current = io(String(process.env.REACT_APP_HOST_URL));
            let loggedInUser = sessionStorage.getItem("loginUser");
            if (loggedInUser) {
                const email = JSON.parse(loggedInUser).email;
                setOptions?.(["Profile", "Chats", "Users", "Logout"]);
                if (email && socket?.current) {
                    socket.current.emit("setup", email);
                }
            }
        }
        // eslint-disable-next-line
    }, []);

    useEffect(() => {
        const loggedInUserString = sessionStorage.getItem("loginUser");
        if (loggedInUserString !== null) {
            setLoggedInUser(JSON.parse(loggedInUserString));
            if (loggedInUser && users) {
                users = users.filter((user) => user.email !== loggedInUser.email);
            }
        }
        // eslint-disable-next-line
    }, []);

    useEffect(() => {
        if (sessionStorage.getItem("token") && getChatsForLoggedInUser) {
            if (!availableChats?.length) {
                getChatsForLoggedInUser();
            }
        } else {
            navigate("/login");
        }
        // eslint-disable-next-line
    }, []);

    useEffect(() => {
        setTimeout(() => {
            const bodyChatElement = document.querySelector('.user-chat--conversation');
            if (bodyChatElement) {
                bodyChatElement.scrollTop = bodyChatElement.scrollHeight;
            }
        }, 100);
        // eslint-disable-next-line
    }, [currChatRef?.current]);

    useEffect(() => {
        socket?.current?.on("receive_notification", (notification: any) => {
            setIsTyping(false);
            if (notification && availableChats) {
                setAvailableChats?.((prevState: ChatsForLoggedInUser[]) => {
                    const updatedChats = prevState.map((chat: ChatsForLoggedInUser) => {
                        if (chat.email === notification.from_email) {
                            return {
                                ...chat,
                                latestMsg: notification.latestMsg
                            };
                        }
                        return chat;
                    });
                    const chatExists = updatedChats.some(chat => chat.email === notification.from_email);
                    if (!chatExists) {
                        updatedChats.push({
                            name: notification.from_name,
                            email: notification.from_email,
                            latestMsg: notification.latestMsg
                        });
                    }
                    return updatedChats;
                });
            }
            let currSelUser = sessionStorage.getItem("currentSelectedUser");
            if (currSelUser) {
                const user = JSON.parse(currSelUser);
                if (notification && user?.email === notification.from_email) {
                    const convertedDate: ConvertedDateTime = getCurrTimeAndDate();
                    let chat: ChatMessage = {
                        receiver: {
                            msg: notification.latestMsg,
                            dateTime: convertedDate
                        }
                    };
                    if (currChatRef?.current) {
                        if (currChatRef?.current[currChatRef?.current.length - 1].receiver?.dateTime.time !== convertedDate.time) {
                            const newCurrChat = [...currChatRef.current, chat];
                            currChatRef.current = newCurrChat;
                        }
                    }
                }
            }
        });
        // eslint-disable-next-line
    }, []);

    useEffect(() => {
        socket?.current?.on("whats_your_status", (res: any) => {
            const resp = res;
            resp.isOnline = false;
            if (sessionStorage.getItem("token") && res) {
                resp.isOnline = true;
                socket.current.emit("send_status", resp);
            }
        });
        // eslint-disable-next-line
    }, []);

    useEffect(() => {
        socket?.current?.on("user_online", (res: any) => {
            if (res?.to_email) {
                if (currSelUserRef?.current && currSelUserRef?.current?.email === res.to_email) {
                    currSelUserRef.current.online = res.isOnline;
                    setCount((c) => c + 1);
                }
                if (currSelectedUser && currSelectedUser.email === res.to_email) {
                    setCurrSelectedUser((prevState: ChatsForLoggedInUser | undefined) => {
                        if (!prevState) {
                            return undefined;
                        }
                        return { ...prevState, online: res.isOnline };
                    });
                }
                setAvailableChats?.((prevState: ChatsForLoggedInUser[]) => {
                    const updatedChats = prevState.map((chat: ChatsForLoggedInUser) => {
                        if (chat.email === res.to_email) {
                            return {
                                ...chat,
                                online: res.isOnline
                            };
                        }
                        return chat;
                    });
                    return updatedChats;
                });
                setAvailableUsers?.((prevState: Users[]) => {
                    const updatedUsers = prevState.map((user: Users) => {
                        if (user.email === res.to_email) {
                            return {
                                ...user,
                                online: res.isOnline
                            };
                        }
                        return user;
                    });
                    return updatedUsers;
                });
            }
        });
        // eslint-disable-next-line
    }, []);

    useEffect(() => {
        socket?.current?.on("user_logged_status", (res: any) => {
            const loggedInUserString = sessionStorage.getItem("loginUser");
            if (loggedInUserString !== null) {
                setLoggedInUser(JSON.parse(loggedInUserString));
            }
            if (loggedInUser?.email && res?.to_email) {
                if (loggedInUser.email !== res.to_email) {
                    if (currSelUserRef?.current && currSelUserRef?.current?.email === res.to_email) {
                        currSelUserRef.current.online = res.isOnline;
                        setCount((c) => c + 1);
                    }
                    if (currSelectedUser && currSelectedUser.email === res.to_email) {
                        setCurrSelectedUser((prevState: ChatsForLoggedInUser | undefined) => {
                            if (!prevState) {
                                return undefined;
                            }
                            return { ...prevState, online: res.isOnline };
                        });
                    }
                    setAvailableChats?.((prevState: ChatsForLoggedInUser[]) => {
                        const updatedChats = prevState.map((chat: ChatsForLoggedInUser) => {
                            if (chat.email === res.to_email) {
                                return {
                                    ...chat,
                                    online: res.isOnline
                                };
                            }
                            return chat;
                        });
                        return updatedChats;
                    });
                    setAvailableUsers?.((prevState: Users[]) => {
                        const updatedUsers = prevState.map((user: Users) => {
                            if (user.email === res.to_email) {
                                return {
                                    ...user,
                                    online: res.isOnline
                                };
                            }
                            return user;
                        });
                        return updatedUsers;
                    });
                }
            }
        });
        return () => {
            socket?.current?.off("user_logged_status");
        }
        // eslint-disable-next-line
    }, [loggedInUser]);

    useEffect(() => {
        socket?.current?.on("typing", () => {
            setIsTyping(true);
            setTimeout(() => {
                const bodyChatElement = document.querySelector('.user-chat--conversation');
                if (bodyChatElement) {
                    bodyChatElement.scrollTop = bodyChatElement.scrollHeight;
                }
            }, 100);
            return () => { socket?.current?.off("typing") }
        });
        socket?.current?.on("stop_typing", () => {
            setIsTyping(false);
            return () => { socket?.current?.off("stop_typing") }
        });
        // eslint-disable-next-line
    }, []);

    useEffect(() => {
        const userChats = document.querySelectorAll('.user-chat');
        if (userChats?.length && currSelectedUser) {
            userChats.forEach((chat) => {
                if (chat.getAttribute('data-username') === currSelectedUser?.email) {
                    chat.classList.add("active");
                } else {
                    chat.classList.remove("active");
                }
            });
            if (inputTextValRef?.current) {
                inputTextValRef.current.focus();
            }
        }
        // eslint-disable-next-line
    }, [currSelectedUser]);

    useEffect(() => {
        document.body.scrollTop = document.body.scrollHeight;
        document.documentElement.scrollTop = document.documentElement.scrollHeight;
        // eslint-disable-next-line
    }, [emojiContainer]);

    useEffect(() => {
        socket?.current?.on("updated_pic", (res: any) => {
            if (res) {
                setAvailableChats?.((prevState: ChatsForLoggedInUser[]) => {
                    const updatedChats = prevState.map((chat: ChatsForLoggedInUser) => {
                        if (chat.email === res.email) {
                            return {
                                ...chat,
                                pic: res.pic
                            };
                        }
                        return chat;
                    });
                    return updatedChats;
                });

                setAvailableUsers?.((prevState: Users[]) => {
                    const updatedUsers = prevState.map((user: Users) => {
                        if (user.email === res.email) {
                            return {
                                ...user,
                                pic: res.pic
                            };
                        }
                        return user;
                    });
                    return updatedUsers;
                });

                setCurrSelectedUser?.((prevState: any) => {
                    if (prevState?.email === res.email) {
                        return { ...prevState, pic: res.pic };
                    }
                });
                setCount((e) => e + 1);
            }
        });
        // eslint-disable-next-line
    }, []);

    useEffect(() => {
        if (isMobile()) {
            leftSection(false); chatSection(true);
        }
        // eslint-disable-next-line
    }, []);

    // Functions
    const getCurrTimeAndDate = (): ConvertedDateTime => {
        const utcDateTime = new Date();

        utcDateTime.setHours(utcDateTime.getHours());
        utcDateTime.setMinutes(utcDateTime.getMinutes());

        // Format the date and time
        const options: DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
        const formattedDate = utcDateTime.toLocaleDateString('en-US', options);
        const formattedTime = utcDateTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });

        return {
            date: formattedDate,
            time: `${formattedTime}`
        };
    };

    const handleOnSendMsg = async (e: any = null) => {
        setEmojiContainer(false);
        const authToken = sessionStorage.getItem("token");
        if (authToken && currSelectedUser?.email) {
            if (!typingRef?.current && textValue?.length > 0) {
                if (typingTimeoutRef.current) {
                    clearTimeout(typingTimeoutRef.current);
                }
                setTyping(true);
                if (typingRef) {
                    typingRef.current = true;
                }
                socket.current.emit("typing", currSelectedUser.email);
            }
            // Check if a timeout is already active
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            // Set a new timeout
            typingTimeoutRef.current = setTimeout(() => {
                socket.current.emit("stop_typing", currSelectedUser.email);
                setTyping(false);
                if (typingRef) {
                    typingRef.current = false;
                }
            }, 2000);
        }
        if (!authToken || (e?.key !== "Enter" && e)) {
            return;
        } else if (authToken && loggedInUser?.email && currSelectedUser?.email) {
            const users = JSON.stringify([loggedInUser, currSelectedUser]);
            let chatName = `${loggedInUser.email}&${currSelectedUser.email}`;
            const response = await fetch(`${hostURL}/api/chat/sendMsg`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "auth-token": authToken
                },
                body: JSON.stringify({ chatName: chatName, users: users, latestMsg: textValue })
            });
            if (response) {
                const json = await response.json();
                if (json) {
                    const notification = {
                        from_name: loggedInUser.name, to_email: currSelectedUser.email,
                        from_email: loggedInUser.email, latestMsg: textValue
                    };
                    socket.current.emit("send_user_notification", notification);

                    if (loggedInUser?.email && currSelectedUser?.email) {
                        const loginEmail = loggedInUser.email;
                        const fromToEmail = { from_email: loginEmail, to_email: currSelectedUser.email };
                        socket.current.emit("check_user_online", fromToEmail);
                    }
                    updateCurrChatAfterMsgSent();
                    setChatsForLoggedInUser?.((prevState: ChatsForLoggedInUser[]) => {
                        const updatedChats = prevState.map((chat: ChatsForLoggedInUser) => {
                            if (chat.email === currSelectedUser.email) {
                                return {
                                    ...chat,
                                    latestMsg: textValue
                                };
                            }
                            return chat;
                        });
                        const chatExists = updatedChats.some(chat => chat.email === currSelectedUser.email);
                        if (!chatExists) {
                            updatedChats.push({
                                name: currSelectedUser.name,
                                email: currSelectedUser.email,
                                latestMsg: textValue
                            });
                        }
                        setAvailableChats?.(updatedChats);
                        return updatedChats;
                    });
                }
            }
        }
    };

    const updateCurrChatAfterMsgSent = async (): Promise<void> => {
        if (currSelectedUser && textValue) {
            const convertedDate: ConvertedDateTime = getCurrTimeAndDate();
            let chat: ChatMessage = {
                sender: {
                    msg: textValue,
                    dateTime: convertedDate
                }
            };
            if (currChatRef?.current) {
                if (currChatRef?.current[currChatRef?.current.length - 1]?.receiver?.dateTime.time !== convertedDate.time) {
                    const newCurrChat = [...currChatRef.current, chat];
                    currChatRef.current = newCurrChat;
                }
            }
            setTextValue("");
            setfindText("Chats");
        }
    };

    const isMobile = () => { return window.innerWidth < 991 };

    const handleOnUserClick = (user: ChatsForLoggedInUser | Users) => {
        if (isMobile()) {
            const sectionUserchat = document.getElementsByClassName("section-userchat");
            if (sectionUserchat?.length) {
                const element = sectionUserchat[0] as HTMLElement;
                if (element) {
                    element.style.display = "flex";
                }
            }
            const sectionChatLeftsidebar = document.getElementsByClassName("section-chat-leftsidebar");
            if (sectionChatLeftsidebar?.length) {
                const element = sectionChatLeftsidebar[0] as HTMLElement;
                if (element) {
                    element.style.display = "none";
                }
            }
        }
        if (user) {
            (currChatRef as React.MutableRefObject<ChatMessage[] | []>).current = [];
            setCurrSelectedUser(user);
            currSelUserRef.current = user;
            getCurrChat?.(user.email);
            setSearchText("");
            sessionStorage.setItem("currentSelectedUser", JSON.stringify(user));
            setTimeout(() => {
                if (chatsForLoggedInUser?.length && searchText?.length) {
                    setAvailableChats?.(chatsForLoggedInUser.filter((chat) => chat.name.includes(searchText)));
                }
                if (loggedInUser) {
                    const fromToEmail = { from_email: loggedInUser.email, to_email: user.email };
                    socket.current.emit("check_user_online", fromToEmail);
                }
            }, 1000);
        }
    };

    const handleOnNewChatClick = () => {
        setProfileView(false);
        if (findText === "Chats") {
            setfindText("Users");
            setAvailableUsers?.([]);
            if (sessionStorage.getItem("token")) {
                getUsers?.();
            }
        } else if (findText === "Users" || findText === "Profile") {
            setfindText("Chats");
        }
    };

    const handleOnOptionClick = (option: string) => {
        if (isMobile()) {
            leftSection(true); chatSection(false);
        }
        switch (option) {
            case "Profile":
                setProfileView(true);
                setfindText(option);
                break;
            case "Chats":
                setfindText(option);
                setProfileView(false);
                if (!availableChats?.length && chatsForLoggedInUser?.length) {
                    setAvailableChats?.(chatsForLoggedInUser);
                }
                break;
            case "Users":
                setfindText(option);
                setfindText("Users");
                setAvailableUsers?.([]);
                if (sessionStorage.getItem("token")) {
                    getUsers?.();
                }
                setProfileView(false);
                break;
            case "Logout":
                logoutBtnRef.current?.click();
                break;
            default:
                break;
        }
    };

    const onChange = (e: any) => {
        setTextValue(e.target.value);
    };

    const onSearchTextChange = (e: any) => {
        if (findText === "Chats") {
            if (chatsForLoggedInUser) {
                setAvailableChats?.(chatsForLoggedInUser.filter((chat) => chat.name.toLocaleLowerCase().includes(e.target.value.toLocaleLowerCase())));
            }
        } else {
            if (users && e.target.value) {
                setAvailableUsers?.(users.filter((chat) => (chat.name.toLocaleLowerCase() !== loggedInUser?.name.toLocaleLowerCase()) && chat.name.toLocaleLowerCase().includes(e.target.value.toLocaleLowerCase())));
            } else {
                setAvailableUsers([]);
            }
        }
        setSearchText(e.target.value);
    };

    const handleOnEmojiClick = (emojiData: EmojiClickData, event: MouseEvent) => {
        if (inputTextValRef.current) {
            // Get the current cursor position
            const cursorPosition = inputTextValRef.current.selectionStart;

            // Get the current value of the input
            const currentValue = inputTextValRef.current.value;

            // Append the emoji at the desired position
            if (cursorPosition) {
                const updatedValue =
                    currentValue.slice(0, cursorPosition) +
                    (emojiData.isCustom ? emojiData.unified : emojiData.emoji) +
                    currentValue.slice(cursorPosition);

                // Update the textValue state
                setTextValue(updatedValue);
                setTimeout(() => {
                    if (inputTextValRef?.current) {
                        const newCursorPosition = cursorPosition + (emojiData.isCustom ? emojiData.unified.length : emojiData.emoji.length);
                        inputTextValRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
                        inputTextValRef.current.focus();
                    }
                }, 0);
            } else {
                setTextValue(String(emojiData.isCustom ? emojiData.unified : emojiData.emoji));
                inputTextValRef.current.focus();
            }
        }
    };

    const handleLogout = () => {
        setProfileView(false);
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

    const postPicDetails = (pics: any) => {
        if (pics && (pics.type === "image/jpeg" || pics.type === "image/png")) {
            setLoader(true);
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
                    if (loggedInUser) {
                        const firstHttpIndex = picURL.indexOf("http:");
                        if (firstHttpIndex !== -1) {
                            picURL = picURL.slice(0, firstHttpIndex) + "https:" + picURL.slice(firstHttpIndex + 5);
                        }
                        loggedInUser.pic = picURL;
                        const data = {
                            email: loggedInUser.email,
                            pic: picURL
                        }
                        socket?.current?.emit("updated_pic", data);
                        if (loggedInUser.pic) {
                            updateProfilePic?.(loggedInUser.pic);
                            setCount((e) => e + 1);
                        }
                        setLoader(false);
                    }
                })
                .catch((err) => {
                    console.log(err);
                });
        } else {
            alert("Please Select an Image!");
        }
    };

    const leftSection = (show: boolean) => {
        const sectionChatLeftsidebar = document.getElementsByClassName("section-chat-leftsidebar");
        if (sectionChatLeftsidebar?.length) {
            const element = sectionChatLeftsidebar[0] as HTMLElement;
            if (element) {
                if (show) {
                    element.style.display = "inline-block";
                } else {
                    element.style.display = "none";
                }
            }
        }
    };

    const chatSection = (show: boolean) => {
        const sectionUserchat = document.getElementsByClassName("section-userchat");
        if (sectionUserchat?.length) {
            const element = sectionUserchat[0] as HTMLElement;
            if (element) {
                if (show) {
                    element.style.display = "flex";
                } else {
                    element.style.display = "none";
                }
            }
        }
    };

    const onLogoClicked = () => {
        setCurrSelectedUser(undefined);
        chatSection(true);
        if (isMobile()) {
            leftSection(false);
        }
    };

    type CustomStyle = {
        [key: string]: string | number;
    };
    const text = "typing...";
    const styles: CustomStyle[] = Array.from({ length: text.length }, (_, index) => ({ "--i": index + 1 }));

    // Logical part

    // TSX - DOM
    return (
        <div id='home-container' className='home-container'>
            {/* Start Sidemenu Section */}
            <div id='section-sidemenu' className="section-sidemenu">
                <div id='sidemenu-navigation' className="sidemenu-navigation">
                    <ul id='sidemenu-nav' className="sidemenu-nav">
                        <li id='sidemenu-nav-item-1' className="nav-item">
                            <a id='sidemenu-nav-link-1' href="#" className="nav-link" onClick={() => onLogoClicked()}>
                                <span id='sidemenu-profile-logo' className="profile logo cursor-ptr"></span>
                            </a>
                        </li>
                        <li id='sidemenu-nav-item-2' className="nav-item">
                            <a id='sidemenu-nav-link-2' href="#" className="nav-link" onClick={() => { handleOnOptionClick("Profile") }}>
                                <span id='sidemenu-person-logo' className="profile cursor-ptr">
                                    <Person size={35} />
                                </span>
                            </a>
                        </li>
                        <li id='sidemenu-nav-item-3' className="nav-item">
                            <a id='sidemenu-nav-link-3' href="#" className="nav-link" onClick={() => { handleOnOptionClick("Chats"); }}>
                                <span id='sidemenu-chats-logo' className="chat cursor-ptr">
                                    <ChatDots size={30} />
                                </span>
                            </a>
                        </li>
                        <li className="nav-item">
                            <a id='sidemenu-nav-link-4' href="#" className="nav-link" onClick={() => { handleOnOptionClick("Users") }}>
                                <span id='sidemenu-users-logo' className="contacts cursor-ptr">
                                    <PersonLinesFill size={30} />
                                </span>
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
            {/* End Sidemenu Section */}
            {/* ------------------------------------------------------------------ */}

            {/* Start ChatLeftSidebar Section */}

            <div id='section-chat-leftsidebar' className="section-chat-leftsidebar">
                <div id='heading-section' className="heading-section">
                    <h4 id='chat-section-title' className={`chat-section-title ${findText === "Profile" ? "title-profile" : ""}`}>{findText === "Profile" ? "My Profile" : findText}</h4>
                    {!profileView && <form id='chat-section-form'>
                        <div id='chat-form-search-section' className="chat-search-section">
                            <input type="text" id='search-chat' className='search-chat' autoComplete='off' placeholder='Search here...' name="search" value={searchText} onChange={onSearchTextChange} />
                            <span id='chat-form-search-icon' className='search-icon cursor-ptr'>
                                <Search size={15} />
                            </span>
                        </div>
                    </form>}
                </div>
                {!profileView && <div id='chat-msg-list' className="chat-msg-list">
                    {findText === "Chats" && availableChats && availableChats.length > 0 && <h5 className='chat-list-type'>Direct Messages</h5>}
                    {findText === "Chats" && availableChats && availableChats.length > 0 && availableChats.map((user, index) => {
                        return (
                            <div id={`chat-list-${index}`} key={index} onClick={() => handleOnUserClick(user)}>
                                <ul id={`chat-user-list-${index}`} className="chat-user-list">
                                    <li id={`chat-user${index}`} className="chat-user cursor-ptr">
                                        <div id={`chat-user-img-${index}`} className="chat-user--img">
                                            <img id={`chat-user-img-container-${index}`} src={user?.pic ? user.pic : "/user-profile-default.png"} alt="user profile" />
                                            <span id={`chat-user-status-${index}`} className={`user-status ${user.online ? 'online' : 'offline'}`}></span>
                                        </div>
                                        <span id={`chat-user-name-${index}`} className="chat-user-name">{user?.name}</span>
                                    </li>
                                </ul>
                            </div>
                        )
                    })}
                    {findText === "Users" && availableUsers.map((user, index) => {
                        return (
                            <div id={`users-list-${index}`} key={index} onClick={() => handleOnUserClick(user)} style={{ "margin": "1rem 0" }}>
                                <ul id={`users-list-${index}`} className="chat-user-list">
                                    <li id={`users-${index}`} className="chat-user cursor-ptr">
                                        <div id={`users-img-${index}`} className="chat-user--img">
                                            <img id={`users-img-container-${index}`} src={user?.pic ? user.pic : "/user-profile-default.png"} alt="user profile" />
                                            <span id={`users-status-${index}`} className={`user-status ${user.online ? 'online' : 'offline'}`}></span>
                                        </div>
                                        <span id={`users-name-${index}`} className="chat-user-name">{user?.name}</span>
                                    </li>
                                </ul>
                            </div>
                        )
                    })}
                    {/* <div>
                        <h5 className='chat-list-type'>Groups</h5>
                        <ul className="chat-user-list">
                            <li className="chat-user cursor-ptr">
                                <div className="chat-user--img">
                                    <img src="https://res.cloudinary.com/basicalycoder/image/upload/v1699620725/rmymqzbsxsncdptsnpep.png" alt="user profile" />
                                    <span className="user-status"></span>
                                </div>
                                <span className="chat-user-name">Friends</span>
                            </li>
                            <li className="chat-user cursor-ptr">
                                <div className="chat-user--img">
                                    <img src="https://res.cloudinary.com/basicalycoder/image/upload/v1699620725/rmymqzbsxsncdptsnpep.png" alt="user profile" />
                                    <span className="user-status"></span>
                                </div>
                                <span className="chat-user-name">Family</span>
                            </li>
                        </ul>
                    </div> */}
                </div>}
                {profileView &&
                    <div id='profile-details' className='profile-details'>
                        <div id='profile-cover' className="profile-cover">
                            <div id='profile-pic-box' className="profile-pic-box">
                                <img id='profile-pic' className='profile-pic' src={loggedInUser?.pic ? loggedInUser.pic : "/user-profile-default.png"} alt="" />
                                {loader && <span id='pic-loader' className="pic-loader"><AiOutlineLoading3Quarters size={40} color='white' /></span>}
                                <span id='profile-name' className="profile-name">{loggedInUser?.name ? loggedInUser.name : ""}</span>
                            </div>
                        </div>
                        {/* <div className="overlay"></div> */}
                        <div id='profile-info' className="profile-info">
                            <div id='profile-name' className="profile-detail profile-d--name">
                                <LuUser size={15} /> <p id='profile-name' className="user-name">{loggedInUser?.name ? loggedInUser.name : ""}</p>
                            </div>
                            <div id='profile-email' className="profile-detail profile-d--email">
                                <MdOutlineEmail size={15} /> <p id='profie-email' className="user-email">{loggedInUser?.email ? loggedInUser.email : ""}</p>
                            </div>
                            <div id='profile-pic' className="profile-detail profile-d--pic  cursor-ptr">
                                <IoCameraReverseOutline size={15} />
                                <label htmlFor="file-upload" className="custom-file-upload cursor-ptr">
                                    <input id='file-upload' style={{ "display": "none" }} className='file-upload' type="file" accept="image/*" onChange={(e) => e?.target?.files ? postPicDetails(e.target.files[0]) : null} />
                                    <p id='user-pic-update' className="user-pic">
                                        Update picture
                                    </p>
                                </label>
                            </div>
                        </div>
                        <div id='logout-section' className="logout-section">
                            <button id='logout-btn' className="logout-btn" ref={logoutBtnRef} data-bs-toggle="modal" data-bs-target="#exampleModal">Logout</button>
                        </div>
                        {/* <p className='login-user--name'>Name: {loggedInUser?.name ? loggedInUser.name : ""}</p>
                        <p className='login-user--email'>Email: {loggedInUser?.email ? loggedInUser.email : ""}</p>
                        <div className='login-user--setpic'>
                            <p className='login-user--setpic---label'>Change profile pic:</p>
                            <input className='login-user-set-pic-input' type="file" accept="image/*" onChange={(e) => e?.target?.files ? postPicDetails(e.target.files[0]) : null} />
                        </div> */}
                    </div>}
            </div>

            {/* End ChatLeftSidebar Section */}
            {/* ------------------------------------------------------------------ */}

            {/* Start UserChat Section */}

            <div id='section-userchat' className="section-userchat">
                {currSelectedUser?.name ?
                    (<div id='user-chat-section' className="user-chat--section">
                        {/* Topbar */}
                        <div id='user-chat-topbar' className="user-chat--topbar">
                            <div id='chat-user-back' className="chat-user--back cursor-ptr" onClick={() => { chatSection(false); leftSection(true) }}>
                                <IoIosArrowRoundBack size={35} />
                            </div>
                            <div id='chat-user-img' className="chat-user--img">
                                <img id='section-userchat-users-img-container' src={currSelectedUser?.pic ? currSelectedUser.pic : "/user-profile-default.png"} alt="user profile" />
                                <span id='section-userchat-users-status' className={`user-status ${currSelUserRef?.current?.online ? 'online' : 'offline'}`}></span>
                            </div>
                            <div id='chat-username-box' className="chat-username-box">
                                <h6 id='chat-user-name' className="chat-user-name">{currSelectedUser?.name}</h6>
                                <p id='chat-user-status' className='chat-user-status'><small>{currSelUserRef?.current?.online ? 'Online' : 'Offline'}</small></p>
                            </div>
                        </div>

                        {/* Conversation */}
                        <div id='user-chat--conversation' className="user-chat--conversation">
                            <ul id='chat-conversation-list' className="chat-conversation--list">
                                {loggedInUser && currChatRef?.current?.map((chat, index) => (
                                    <div id={`chat-convo-${index}`} key={index}>
                                        {chat?.receiver ?
                                            (
                                                <li id={`chat-convo-list-item-reveiver-${index}`} className="chat-list--item">
                                                    <div id={`chat-convo-list-reveiver-${index}`} className="conversation-list">
                                                        <div id={`chat-convo-avatar-reveiver`} className="chat-avatar">
                                                            <img id={`chat-convo-img-container-reveiver-${index}`} src={currSelectedUser?.pic ? currSelectedUser.pic : "/user-profile-default.png"} alt="user profile" />
                                                        </div>
                                                        <div id={`chat-convo-content-reveiver-${index}`} className="user-chat--content">
                                                            <div id={`chat-text-content-reveiver-${index}`} className="chat-text--content">
                                                                <p id={`chat-content-reveiver-${index}`} className="chat-content">{chat.receiver.msg}</p>
                                                            </div>
                                                            <div id={`conversation-name-reveiver-${index}`} className="conversation-name">{currSelectedUser?.name}<small id={`conversation-time-reveiver-${index}`} className='conversation-time'>{chat.receiver.dateTime.time}</small></div>
                                                        </div>
                                                    </div>
                                                </li>
                                            ) : null}
                                        {chat?.sender ?
                                            (
                                                <li id={`chat-convo-list-item-sender-${index}`} className="chat-list--item right">
                                                    <div id={`chat-convo-list-sender-${index}`} className="conversation-list">
                                                        <div id={`chat-convo-avatar-sender`} className="chat-avatar">
                                                            <img id={`chat-convo-img-container-sender-${index}`} src={loggedInUser?.pic ? loggedInUser.pic : "/user-profile-default.png"} alt="user profile" />
                                                        </div>
                                                        <div id={`chat-convo-content-sender-${index}`} className="user-chat--content">
                                                            <div id={`chat-text-content-sender-${index}`} className="chat-text--content">
                                                                <p id={`chat-content-sender-${index}`} className="chat-content">{chat.sender.msg}</p>
                                                            </div>
                                                            <div id={`conversation-name-sender-${index}`} className="conversation-name">{loggedInUser?.name}<small id={`conversation-time-sender-${index}`} className='conversation-time'>{chat.sender.dateTime.time}</small></div>
                                                        </div>
                                                    </div>
                                                </li>
                                            ) : null}
                                    </div>
                                ))}
                                {isTyping && <li id='chat-list-item' className="chat-list--item">
                                    <div id='conversation-list' className="conversation-list">
                                        <div id='chat-avatar' className="chat-avatar">
                                            <img id='chat-avatar-img-container' src={currSelectedUser?.pic ? currSelectedUser.pic : "/user-profile-default.png"} alt="user profile" />
                                        </div>
                                        <div id='user-chat-content' className="user-chat--content">
                                            <div id='chat-text-content' className="chat-text--content">
                                                <p id='chat-content-typing' className="chat-content typing">
                                                    {text.split("").map((char, index) => (
                                                        <span id={`typing-${index}`} key={index} style={styles[index]}>
                                                            {char}
                                                        </span>
                                                    ))}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </li>}
                            </ul>
                        </div>

                        {/* Chat Input */}
                        <div id='user-chat-input' className="user-chat--input">
                            {emojiContainer ? <div id='emoji-picker' className="emoji-picker">
                                <EmojiPicker
                                    onEmojiClick={handleOnEmojiClick}
                                    autoFocusSearch={false}
                                    emojiStyle={EmojiStyle.NATIVE} />
                            </div> : null}
                            <span id='emoji-btn' className='emoji-btn' onClick={() => setEmojiContainer((e) => !e)}>
                                <EmojiSmile size={20} color='black' />
                            </span>
                            <input type="text" id='textValue' name='textValue' className='input-chat' autoComplete='off' placeholder='Type your message...'
                                ref={inputTextValRef} value={textValue} onChange={onChange} onClick={() => setEmojiContainer(false)} onKeyDown={(e) => handleOnSendMsg(e)} />
                            <span id='input-send-btn' className='input-send--btn' onClick={() => handleOnSendMsg()}>
                                <Send size={25} />
                            </span>
                        </div>
                    </div>) :
                    <div id='welcome-chat' className="welcome-chat">
                        <div id='logo-brand-box' className="logo-brand-box">
                            <a id='logo-brand-link' href="/">
                                <span id='logo-brand-span' className="logo cursor-ptr"></span>
                            </a>
                        </div>
                        <h4 id='welcome-chat-title' className='welcome-chat-title'>Welcome to SpeakIn</h4>
                        <p id='welcome-chat-description' className='welcome-chat-description'>Speak In from your soul, by clicking on the chat cloud... <span className="chat-cloud-icon"><ChatDots /></span></p>
                    </div>}
            </div>

            {/* End UserChat Section */}

            {/* <button type="button" className="logout-btn" ref={logoutBtnRef} data-bs-toggle="modal" data-bs-target="#exampleModal">Logout</button> */}
            <div id="exampleModal" className="modal fade" tabIndex={-1} aria-labelledby="exampleModalLabel" aria-hidden="true">
                <div id='modal-dialog' className="modal-dialog">
                    <div id='modal-content' className="modal-content">
                        <div id='modal-header' className="modal-header">
                            <h1 id="exampleModalLabel" className="modal-title fs-5">Logout</h1>
                            <button id='modal-close-btn-cross' type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div id='modal-body' className="modal-body">
                            Are you sure you really want to Logout?
                        </div>
                        <div id='modal-footer' className="modal-footer">
                            <button id='modal-close-btn' type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            <button id='modal-logout-btn' type="button" className="btn btn-primary" data-bs-dismiss="modal" onClick={() => handleLogout()}>Logout</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default HomeScreen;