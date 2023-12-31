export interface ChatsForLoggedInUser {
  _id?: string,
  name: string,
  email: string,
  latestMsg: string,
  online?: boolean
  pic?: string
}