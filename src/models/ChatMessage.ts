import { ConvertedDateTime } from "./ConvertedDateTime";

export interface ChatMessage {
  sender?: {
    msg: string;
    dateTime: ConvertedDateTime;
  };
  receiver?: {
    msg: string;
    dateTime: ConvertedDateTime;
  };
};