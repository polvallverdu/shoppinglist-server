import { Schema, model, ObjectId } from 'mongoose';

export interface IItem {
  _id: ObjectId;
  name: string;
  timestamp: Date;
}

const itemSchema = new Schema<IItem>({
  name: {type: String, required: true},
  timestamp: {type: Date, default: Date.now},
});

const DatabaseItem = model<IItem>('Items', itemSchema);

export default DatabaseItem;