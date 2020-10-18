import { Schema, model } from "mongoose";

const user = new Schema({
    id: Schema.Types.ObjectId,
    username: String,
    password: String,
    email: String
});

const userModel = model('users', user);

export = userModel;