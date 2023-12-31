import { ChatsForLoggedInUser } from "./ChatsForLoggedInUser";

export interface Users extends ChatsForLoggedInUser {
  _id: string;
  name: string;
  email: string;
  date: string;
  password?: string;
  __v?: string;
};