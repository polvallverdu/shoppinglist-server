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
  private pingCheckTimer: NodeJS.Timer;

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
        c.pinged = false;
      })
    }, 30*1000);

    this.pingCheckTimer = setInterval(async () => {
      const currectConnections: Connection[] = [...this.sockets];
      currectConnections.forEach(c => {
        this.send(c, {type: MessageType.PING, data: {timestamp: Date.now()}});
      });
    }, 5*1000);

    this.ws.on("connection", (s) => {
      if (!this.listening) {
        // Not accepting connections
        s.close();
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

        const con = this.findConnectionBySocket(s);
        if (con) {
          if (message.type === MessageType.PONG) {
            con.pinged = true;
            return;
          }

          this.emit("message", con, message);
          return;
        }

        if (message.type === MessageType.AUTH) {
          if (message.data["password"] === process.env.PASSWORD) {
            const conn = {
              socket: s,
              name: message.data.name,
              pinged: true,
            };
            this.sockets.push(conn);
            this.send(conn, {type: MessageType.LOGGED});
          }
        }
      });
    });
  }

  listen() {
    if (this.listening) {
      return;
    }

    this.listening = true;
    this.emit("listening");
  }

  broadcast(message: Message) {
    this.send(this.sockets, message);
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
      this.send(conn, {type: MessageType.DISCONNECT});
    }

    conn.socket.close(-1);
  }

}