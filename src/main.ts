import { ObjectId } from "mongodb";
import DatabaseClient from "./database/DatabaseClient";
import { CollectionModel, ShoppingListModel } from "./database/models";
import SocketServer from "./socket/Server";
import { Connection, FormattedItem, Message, MessageType } from "./types";
require("dotenv").config();

const ws = new SocketServer();
let things: {collection: CollectionModel, shoppingList: ShoppingListModel};
dbthings();
async function dbthings() {
  await DatabaseClient.connect();
  things = await DatabaseClient.createTestingDocs();
  ws.listen();
}

ws.on("message", async (conn: Connection, message: Message) => {
  const data = message.data;
  switch (message.type) {
    case MessageType.PING:
      conn.pinged = true;
      ws.send(conn, { type: MessageType.PONG });
      break;
    case MessageType.REQUEST_REFRESH:
      const itemModels = await DatabaseClient.getItemsFromCollection(things.collection._id);

      const formattedItems: FormattedItem[] = itemModels.filter(i => i.name !== undefined || i.name !== null || i.name !== "").map(item => {
        const formattedItem: FormattedItem = {
          uuid: item._id.toString(),
          name: item.name,
          addedBy: item.addedBy,
          timestamp: item.timestamp.getTime(),
        }
        return formattedItem;
      });

      const message = {
        type: MessageType.REFRESH,
        data: {items: formattedItems},
      };
      ws.send(conn, message);
      break;
    case MessageType.REQUEST_ADD_ITEM:
      if (data["name"] === undefined || data["name"] === "" || data["name"].length > 100) {
        return;
      }
      const index = data["index"] ? data["index"] : 0;
      const item = await DatabaseClient.createItem(data["name"], data["addedBy"]);
      
      await DatabaseClient.addItemToCollection(things.collection._id, item._id, index);
      ws.broadcast({
        type: MessageType.ADD_ITEM,
        data: {
          uuid: item._id.toString(),
          name: item.name,
          addedBy: item.addedBy,
          timestamp: item.timestamp.getTime(),
          index,
        }
      });
      break;
    case MessageType.REQUEST_REMOVE_ITEM:
      await DatabaseClient.removeItemFromCollection(things.collection._id, new ObjectId(data["uuid"]));
      ws.broadcast({
        type: MessageType.REMOVE_ITEM,
        data: {
          uuid: data["uuid"],
        }
      });
      break;
    case MessageType.REQUEST_REORDER_ITEM:
      await DatabaseClient.reorderItemInCollection(things.collection._id, new ObjectId(data["uuid"]), data["index"]);
      ws.broadcast({
        type: MessageType.REORDER_ITEM,
        data: {
          uuid: data["uuid"],
          index: data["index"],
        }
      });
      break;
    case MessageType.REQUEST_UPDATE_ITEM:
      await DatabaseClient.changeItemName(new ObjectId(data["uuid"]), data["newName"]);
      if (data["newName"] === undefined || data["newName"] === "") {
        return;
      }
      ws.broadcast({
        type: MessageType.UPDATE_ITEM,
        data: {
          uuid: data["uuid"],
          newName: data["newName"],
        }
      });
      break;
  }
})

