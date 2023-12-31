import React, { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { DateTimeFormatOptions } from "../models/DateTimeFormatOptions";
import { ConvertedDateTime } from "../models/ConvertedDateTime";
import { Msg } from "../models/Msg";
import { ChatMessage } from "../models/ChatMessage";
import ChatContext from "./ChatContext";
import { ChatsForLoggedInUser } from "../models/ChatsForLoggedInUser";
import { Users } from "../models/Users";
import { io } from "socket.io-client";

const ChatState: React.FC<{ children: ReactNode }> = (props) => {
  let hostURL: any = process.env.REACT_APP_HOST_URL;

  // States
  const [currChat, setCurrChat] = useState<ChatMessage[] | []>([]);
  const [users, setUsers] = useState<Users[] | []>();
  const [chatsForLoggedInUser, setChatsForLoggedInUser] = useState<ChatsForLoggedInUser | []>([]);
  const [availableChats, setAvailableChats] = useState<ChatsForLoggedInUser | []>([]);
  const currChatRef = useRef<ChatMessage[] | []>(currChat);

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
  const getUsers = async () => {
    const authToken = sessionStorage.getItem("token");
    if (authToken) {
      const response = await fetch(`${hostURL}/api/auth/getAllUsersDetails`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "auth-token": authToken
        }
      });
      if (response) {
        const json = await response.json();
        if (json?.success && json.data) {
          setUsers(json.data);
          return json.data;
        }
      }
    }
    return null;
  };

  const getConvertedDate = (utcDateTimeString: string): ConvertedDateTime => {
    const utcDateTime = new Date(utcDateTimeString);

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

  const getCurrChat = async (receiverEmail: string | undefined) => {
    const authToken = sessionStorage.getItem("token");
    if (authToken && receiverEmail) {
      const response = await fetch(`${hostURL}/api/chat/getCurrChat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "auth-token": authToken
        },
        body: JSON.stringify({ "receiverEmail": receiverEmail })
      });
      if (response) {
        const json = await response.json();
        if (json?.success && json.allChats?.length) {
          const allChats: Msg[] = json.allChats;
          const loginUser = sessionStorage.getItem("loginUser");
          if (loginUser) {
            const senderId = JSON.parse(loginUser)._id;
            const chat: ChatMessage[] = [];
            allChats.forEach((element: Msg) => {
              const convertedDate = getConvertedDate(element.date);
              if (element.sender === senderId) {
                chat.push({ sender: { msg: element.content, dateTime: convertedDate } });
              } else {
                chat.push({ receiver: { msg: element.content, dateTime: convertedDate } });
              }
            });
            if (chat?.length) {
              currChatRef.current = chat;
              // if (currChatRef?.current) {
              //   if (currChatRef?.current[currChatRef?.current.length - 1].receiver?.dateTime.time !== convertedDate.time) {
              //     const newCurrChat = [...currChatRef.current, chat];
              //     currChatRef.current = newCurrChat;
              //   }
              // }
              setCurrChat(chat);
              getChatsForLoggedInUser();
              return chat;
            }
          }
          return null;
        }
        return null;
      }
      return null;
    }
  };

  const getChatsForLoggedInUser = async () => {
    const authToken = sessionStorage.getItem("token");
    if (authToken) {
      const response = await fetch(`${hostURL}/api/chat/getChatsForLoggedInUser`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "auth-token": authToken
        }
      });
      if (response) {
        const json = await response.json();
        if (json?.success && json.chats) {
          let loggedInUser = sessionStorage.getItem("loginUser");
          json.chats.forEach((chat: ChatsForLoggedInUser) => {
            if (loggedInUser) {
              const loginEmail = JSON.parse(loggedInUser).email;
              const fromToEmail = { from_email: loginEmail, to_email: chat.email };
              socket?.current?.emit("check_user_online", fromToEmail);
            }
          });
          if (JSON.stringify(json.chats) !== JSON.stringify(chatsForLoggedInUser)) {
            setChatsForLoggedInUser(json.chats);
            setAvailableChats(json.chats);
            return json.chats;
          }
        }
      }
      return null;
    }
    return null;
  };

  const updateProfilePic = async (pic: string) => {
    const authToken = sessionStorage.getItem("token");
    if (authToken) {
      const response = await fetch(`${hostURL}/api/auth/updateProfilePic`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "auth-token": authToken
        },
        body: JSON.stringify({ "pic": pic })
      });
      if (response) {
        const json = await response.json();
        if (json?.success && json.data) {
          sessionStorage.setItem("loginUser", JSON.stringify(json.data));
          if (users) {
            setUsers((prevState: Users[] | undefined) => {
              if (!prevState) {
                return undefined;
              } else {
                const updatedUsers = prevState.map((user: Users) => {
                  if (user.email === json.data.email) {
                    return {
                      ...user,
                      pic: json.data.pic
                    };
                  }
                  return user;
                })
                return updatedUsers;
              }
            });
          }
          return json.data;
        }
      }
    }
    return null;
  };

  const obj = useMemo(() => ({
    users,
    currChat,
    chatsForLoggedInUser,
    availableChats,
    currChatRef,
    setUsers,
    getUsers,
    getCurrChat,
    getChatsForLoggedInUser,
    setAvailableChats,
    setChatsForLoggedInUser,
    updateProfilePic
  }), [users, currChat, availableChats, currChatRef]);
  return (
    <ChatContext.Provider value={obj}>
      {props.children}
    </ChatContext.Provider>
  );
};

export default ChatState;