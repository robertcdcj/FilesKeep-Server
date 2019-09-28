const mongoose = require("mongoose");
const EntrySchema = require("../Schema/EntrySchema");

const FileSchema = new mongoose.Schema({
    ...EntrySchema,
    // originalFileName: {
    //     type: String,
    //     required: true
    // },
    fileSize: Number,
    mimeType: String
});

FileSchema.methods.removeSensitiveInfo = function () {
    const newFile = {
        _id: this._id,
        name: this.name,
        type: this.type,
        mimeType: this.mimeType,
        fileSize: this.fileSize
    };
    return newFile;
};

const File = mongoose.model("File", FileSchema);

module.exports = File;
