import mongoose, { Schema, model, ObjectId } from 'mongoose';
import { ICollection } from './Collection';

export interface IList {
  _id: ObjectId;
  name: string;
  collections: ICollection[];
}

const listSchema = new Schema<IList>({
  name: {type: String, required: true},
  collections: [{type: mongoose.Schema.Types.ObjectId, ref: 'Collections', required: true}],
});

const DatabaseList = model<IList>('Lists', listSchema);

export default DatabaseList;