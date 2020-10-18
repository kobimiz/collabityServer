import { Schema, model } from "mongoose";

const project = new Schema({
    id: Schema.Types.ObjectId,
    name: String,
    admins: Array,
    collaborators: Array
});

const projectModel = model('projects', project);

export = projectModel;