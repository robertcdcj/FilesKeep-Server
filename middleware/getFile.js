const File = require("../models/File");

const getFile = (req, res, next) => {
    const fileId = req.params.fileId;
    if (!fileId) {
        res.status(400).json({error: "File id not specified."});
    } else {
        File.findOne({_id: fileId}, (err, file) => {
            if (err) {
                res.status(500).json({error: "Internal error. Please try again."});
            } else if (!file) {
                res.status(404).json({error: "File not found."});
            } else {
                req.file = file;
                next();
            }
        });
    }
};

module.exports = getFile;
