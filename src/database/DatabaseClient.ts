import {Collection, Db, MongoClient, ObjectId} from "mongodb";
import { CollectionModel, ItemModel, ShoppingListModel } from "./models";
require("dotenv").config();

class DatabaseClient {
  private client: MongoClient;
  private db: Db;

  private shoppingListCollection: Collection;
  private collectionsCollection: Collection;
  private itemsCollection: Collection;

  constructor() {
    this.client = new MongoClient(process.env.MONGODB_URI!);
    this.db = this.client.db();

    this.shoppingListCollection = this.db.collection("shoppinglists");
    this.collectionsCollection = this.db.collection("collections");
    this.itemsCollection = this.db.collection("items");
  }

  async connect(): Promise<void> {
    await this.client.connect();
    console.log("Connected to MongoDB!");
  }

  async createCollection(name: string): Promise<CollectionModel> {
    const col = await this.collectionsCollection.insertOne({
      name,
      items: [],
    });
    return (await this.collectionsCollection.findOne({ _id: col.insertedId })) as CollectionModel;
  }

  async createItem(name: string, addedBy: string): Promise<ItemModel> {
    const item = await this.itemsCollection.insertOne({
      name,
      addedBy,
      timestamp: new Date(),
    });
    return (await this.itemsCollection.findOne({ _id: item.insertedId })) as ItemModel;
  }

  async createShoppingList(name: string, collections: ObjectId[]): Promise<ShoppingListModel> {
    const list = await this.shoppingListCollection.insertOne({
      name,
      collections,
    });
    return (await this.shoppingListCollection.findOne({ _id: list.insertedId })) as ShoppingListModel;
  }

  async addItemToCollection(collection: ObjectId, item: ObjectId): Promise<void> {
    await this.collectionsCollection.updateOne(
      { _id: collection },
      { $push: { items: item } },
    );
  }

  async addCollectionToShoppingList(list: ObjectId, collection: ObjectId): Promise<void> {
    await this.shoppingListCollection.updateOne(
      { _id: list },
      { $push: { collections: collection } },
    );
  }

  async removeItemFromCollection(collection: ObjectId, item: ObjectId): Promise<void> {
    await this.collectionsCollection.updateOne(
      { _id: collection },
      { $pull: { items: item } },
    );
  }

  async removeCollectionFromShoppingList(list: ObjectId, collection: ObjectId): Promise<void> {
    await this.shoppingListCollection.updateOne(
      { _id: list },
      { $pull: { collections: collection } },
    );
  }

  async deleteCollection(collection: ObjectId): Promise<void> {
    await this.collectionsCollection.deleteOne({ _id: collection });
  }

  async deleteItem(item: ObjectId): Promise<void> {
    await this.itemsCollection.deleteOne({ _id: item });
  }

  async deleteShoppingList(list: ObjectId): Promise<void> {
    await this.shoppingListCollection.deleteOne({ _id: list });
  }

  async getShoppingLists(): Promise<ShoppingListModel[]> {
    return (await this.shoppingListCollection.find({}).toArray()) as ShoppingListModel[];
  }

  async getCollections(): Promise<CollectionModel[]> {
    return (await this.collectionsCollection.find({}).toArray()) as CollectionModel[];
  }

  async getItems(): Promise<ItemModel[]> {
    return (await this.itemsCollection.find({}).toArray()) as ItemModel[];
  }

  async getItemsFromCollection(collection: ObjectId): Promise<ItemModel[]> {
    const col = await this.collectionsCollection.findOne({_id: collection});
    if (!col) {
      return [];
    }
    return (await this.itemsCollection.find({_id: {$in: col.items}}).toArray()) as ItemModel[];
  }

  async createTestingDocs(): Promise<{collection: CollectionModel, shoppingList: ShoppingListModel}> { // TODO: DELETE, ONLY FOR TESTING
    let col = await this.collectionsCollection.findOne({});
    if (!col) {
      col = await this.createCollection("Test Collection");
      await this.shoppingListCollection.deleteMany({});
    }
    let shoppinglist = await this.shoppingListCollection.findOne({});
    if (!shoppinglist) {
      shoppinglist = await this.createShoppingList("Test Shopping List", [col._id]);
    }
    return {
      collection: col as CollectionModel,
      shoppingList: shoppinglist as ShoppingListModel,
    }
  }
}

export default new DatabaseClient();