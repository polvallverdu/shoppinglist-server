import EventEmitter from "events";
import { Server, WebSocket } from "ws";
import { Connection, Message, MessageType } from "../types";

function parseMessage(data: string): Message {
  try {
    return JSON.parse(data) as Message;
  } catch (e) {
    throw new Error(`Invalid message`);
  }
}

export default class SocketServer extends EventEmitter{
  port: number;
  sockets: Connection[];
  ws: Server;
  private listening: boolean;
  private pingTimer: NodeJS.Timer;

  constructor(port: number = 3000) {
    super();
    this.sockets = [];
    this.port = port;
    this.ws = new Server({port: port});
    this.listening = false;

    this.pingTimer = setInterval(async () => {
      const currectConnections: Connection[] = [...this.sockets];
      currectConnections.forEach(c => {
        if (!c.pinged) {
          this.closeConnection(c, true);
        }
      })
    }, 30*1000);

    this.ws.on("connection", (s) => {
      if (!this.listening) {
        // Not accepting connections
        s.close(69, "Server is not accepting connections");
        return;
      }

      console.log(`New connection from ${s.url}`);
      s.send(JSON.stringify({
        type: MessageType.CONNECTED,
      }))

      s.on("message", (data) => {
        let message: Message;
        try {
          message = parseMessage(data.toString());
        } catch (e) {
          return;
        }

        console.log(`new message from ${s.url}`, message);

        if (message.type === MessageType.AUTH && !this.sockets.find(ss => ss.socket === s)) {
          this.sockets.push({
            socket: s,
            name: message.data.name,
            pinged: true,
          });
          return;
        }

        const con = this.findConnectionBySocket(s);

        if (!con) {
          return;
        }

        this.emit("message", con, message);
      })
    })
  }

  listen() {
    if (this.listening) {
      return;
    }

    this.listening = true;
    this.emit("listening");
  }

  broadcast(message: Message, exclude?: Connection | Connection[]) {
    const connections = exclude ? [...this.sockets].filter(c => Array.isArray(exclude) ? !exclude.includes(c) : exclude !== c) : this.sockets;
    connections.forEach(c => c.socket.send(JSON.stringify(message)));
  }

  send(conn: Connection | Connection[], message: Message) {
    if (Array.isArray(conn)) {
      conn.forEach(c => c.socket.send(JSON.stringify(message)));
    } else {
      conn.socket.send(JSON.stringify(message));
    }
  }

  private findConnectionBySocket(socket: WebSocket): Connection | undefined {
    return this.sockets.find(c => c.socket === socket);
  }

  // Case insensitive
  private findConnectionByName(name: string): Connection | undefined {
    return this.sockets.find(c => c.name.toLowerCase() === name.toLowerCase());
  }

  closeConnection(conn: Connection, force: boolean = false) {
    // remove conn from sockets
    const index = this.sockets.indexOf(conn);
    if (index > -1) {
      this.sockets.splice(index, 1);
    }

    if (!force) {
      // TODO: Some logic to close connection
    }

    conn.socket.close(-1);
  }

}