import ws from "ws";

export enum MessageType {
  CONNECTED,
  AUTH,
  LOGGED,
  NAME_CHANGE,
  PING,
  PONG,
  REFRESH,
  REQUEST_REFRESH,
  REQUEST_REORDER_ITEM,
  REORDER_ITEM,
  REQUEST_REMOVE_ITEM,
  REMOVE_ITEM,
  REQUEST_ADD_ITEM,
  ADD_ITEM,
  REQUEST_UPDATE_ITEM,
  UPDATE_ITEM,
  DISCONNECT,
}

export type Connection = {
  socket: ws.WebSocket;
  name: string;
  pinged: boolean;
}

export type Message = {
  type: MessageType;
  data?: any;
}

export type FormattedItem = {
  uuid: string;
  name: string;
  addedBy: String;
  timestamp: number;
}

export type ReorderQuery = {
  uuid: string;
}