import { ObjectId } from "mongodb"

export type ShoppingListModel = {
  _id: ObjectId;
  name: string;
  collections: ObjectId[];
}

export type CollectionModel = {
  _id: ObjectId;
  name: string;
  items: ObjectId[];
}

export type ItemModel = {
  _id: ObjectId;
  name: string;
  addedBy: string;
  timestamp: Date;
  notFound: Date | null;
}