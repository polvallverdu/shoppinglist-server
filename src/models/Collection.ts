import mongoose, { Schema, model, ObjectId } from 'mongoose';
import { IItem } from './Item';

export interface ICollection {
  _id: ObjectId;
  name: string;
  items: IItem[];
}

const collectionSchema = new Schema<ICollection>({
  name: {type: String, required: true},
  items: [{type: mongoose.Schema.Types.ObjectId, ref: 'Items', default: []}],
});

const DatabaseCollection = model<ICollection>('Collections', collectionSchema);

export default DatabaseCollection;