const Folder = require("../models/Folder");

const getFolder = (req, res, next) => {
    const folderId = req.params.folderId;

    if (!folderId) {
        res.status(400).json({error: "Folder id not specified."});
    } else {
        Folder.findOne({_id: folderId}, (err, folder) => {
            if (err) {
                res.status(500).json({error: "Internal error. Please try again."});
            } else if (!folderId) {
                res.status(404).json({error: "Folder not found."});
            } else {
                req.folder = folder;
                next();
            }
        });
    }
};

module.exports = getFolder;
