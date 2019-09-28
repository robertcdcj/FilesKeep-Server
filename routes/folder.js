// libraries
var express = require("express");
var router = express.Router();
const multer = require('multer');

// models
const User = require("../models/User");
const File = require("../models/File");
const Folder = require("../models/Folder");

// middlewares
const withAuth = require("../middleware/withAuth");
const getUser = require("../middleware/getUser");
const getFile = require("../middleware/getFile");
const getFolder = require("../middleware/getFolder");

// createFolder
router.post("/", withAuth, getUser, multer().none(), (req, res) => {
    const parentId = req.body.parentId;
    const name = req.body.name;

    if (!name || name === "") {
        res.status(400).send("Please provide a valid folder name.");
        return;
    }

    const newFolder = new Folder({
        name: name,
        type: "folder",
        parentId: parentId,
        userId: req.user._id
    });

    if (parentId === "") {
        // folder is created at root level
        newFolder.save();
        res.status(200).end();
    } else {
        // folder is created inside another folder, check if it exists
        Folder.findById(parentId, (err, folder) => {
            if (err) {
                res.status(500).json({ error: "Internal error. Please try again." });
            } else if (!folder) {
                res.status(404).json({ error: "Parent folder does not exist." });
            } else {
                newFolder.save();
                res.status(200).end();
            }
        })
    }
});

function deleteFiles(files) {
    files.forEach((file) => {
        file.delete();
    });
}

function deleteFolders(folders) {
    // recursive delete
    folders.forEach((folder) => {
        File.find({ parentId: folder._id }, (err, files) => {
            if (err) {

            } else {
                deleteFiles(files);
            }
        });
        Folder.find({ parentId: folder._id }, (err, folders) => {
            if (err) {

            } else {
                deleteFolders(folders);
            }
        });
        folder.delete();
    })

}

// deleteFolder
router.delete("/:folderId", withAuth, getUser, (req, res) => {
    const user = req.user;
    const folderId = req.params.folderId;

    Folder.findById(folderId, (err, folder) => {
        if (err) {
            res.status(500).json({ error: "Internal error. Please try again." });
        } else if (!folder) {
            res.status(404).json({ error: "Folder does not exist." });
        } else {
            if (user._id.toString() === folder.userId.toString()) {
                // recursive delete
                deleteFolders([folder]);
                res.status(200).end();
            } else {
                res.status(401).json({ error: "Folder not owned by user." });
            }
        }
    });

});

module.exports = router;