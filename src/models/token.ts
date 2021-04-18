import { Schema, model } from "mongoose";
import { schema } from "./user";

const token = new Schema({
    id: Schema.Types.ObjectId,
    userId: Schema.Types.Number,
    expiration: Schema.Types.Date
});

const tokenModel = model('tokens', token);

export = tokenModel;