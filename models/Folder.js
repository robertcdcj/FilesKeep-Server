const mongoose = require("mongoose");
const EntrySchema = require("../Schema/EntrySchema");

const FolderSchema = new mongoose.Schema({
    ...EntrySchema
});

FolderSchema.methods.removeSensitiveInfo = function () {
    const newFolder = {
        _id: this._id,
        name: this.name,
        type: this.type
    };
    return newFolder;
};

const Folder = mongoose.model("Folder", FolderSchema);

module.exports = Folder;
