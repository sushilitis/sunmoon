import { createContext } from "react";
import { ChatContextValue } from "../models/ChatContextValue";

const ChatContext = createContext<ChatContextValue | {}>({});

export default ChatContext;