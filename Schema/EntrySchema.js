const mongoose = require("mongoose");

const EntrySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    parentId: String,
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    publicShare: {
        type: Boolean,
        default: false
    },
    privateShare: [String]
});

module.exports = EntrySchema.obj;