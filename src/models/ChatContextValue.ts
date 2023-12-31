import { MutableRefObject } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatsForLoggedInUser } from "./ChatsForLoggedInUser";
import { Users } from "./Users";

export interface ChatContextValue {
  users?: Users[];
  currChat?: ChatMessage[];
  chatsForLoggedInUser?: ChatsForLoggedInUser[];
  availableChats?: ChatsForLoggedInUser[];
  uniqueId?: string;
  currChatRef?: MutableRefObject<ChatMessage[] | []>;
  setUsers?: React.Dispatch<React.SetStateAction<Users[]>>;
  getUsers?: () => Promise<Users[]>;
  setCurrChat?: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  getCurrChat?: (receiverEmail?: string) => Promise<void>;
  getChatsForLoggedInUser?: () => Promise<void>;
  setAvailableChats?: React.Dispatch<React.SetStateAction<ChatsForLoggedInUser[]>>;
  setChatsForLoggedInUser?: React.Dispatch<React.SetStateAction<ChatsForLoggedInUser[]>>;
  setUniqueId?: React.Dispatch<React.SetStateAction<string>>;
  updateProfilePic?: (pic: string) => Promise<void>;
};