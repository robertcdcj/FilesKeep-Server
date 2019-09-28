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
const findAuth = require("../middleware/findAuth");
const findUser = require("../middleware/findUser");

// helper
const { entrySharedWithUser } = require("../helper/helper");

router.get("/", withAuth, getUser, (req, res) => {
    // make sure that the user has specified a folder id
    if (req.query && req.query.parentId !== null && req.query.parentId !== undefined) {
        if (req.query.parentId === "") {
            // the requested folder is the root folder
            Promise.all([
                File.find({ userId: req.user._id, parentId: req.query.parentId }),
                Folder.find({ userId: req.user._id, parentId: req.query.parentId })
            ]).then(([files, folders]) => {
                res.status(200).json({
                    files: files,
                    folders: folders
                });
            }).catch((err) => {
                // database error
                res.status(500).send("Error");
            });
        } else {
            // find the specified folder
            Folder.findById(req.query.parentId).then((parentFolder, err) => {
                if (err) {
                    // database error
                    res.status(500).send("Error");
                } else if (!parentFolder) {
                    // specified folder not found
                    res.status(404).send("Specified folder not found.");
                } else {
                    // specified folder found. Do ownership check
                    if (req.user._id.toString() === parentFolder.userId.toString()) {
                        // the user is the owner. Fetch and return the folder's contents
                        Promise.all([
                            File.find({ userId: req.user._id, parentId: req.query.parentId }),
                            Folder.find({ userId: req.user._id, parentId: req.query.parentId })
                        ]).then(([files, folders]) => {
                            res.status(200).json({
                                files: files,
                                folders: folders
                            });
                        }).catch((err) => {
                            // database error
                            res.status(500).send("Error");
                        });
                    } else {
                        // user is not the owner of the folder
                        res.status(401).send("Folder not owned by user.");
                    }
                }
            });
        }
    } else {
        res.status(400).send("Please provide a valid folder id.");
    }
});

// an endpoint for listing entries shared with a logged-in user
router.get("/sharedWithMe", withAuth, getUser, (req, res) => {
    // fetch all files and folders privately shared with the user
    Promise.all([
        File.find({ privateShare: req.user.email }),
        Folder.find({ privateShare: req.user.email })
    ]).then(([files, folders]) => {
        res.status(200).json({
            // sensitive information removed for shared entries
            files: files.map((file) => { return file.removeSensitiveInfo() }),
            folders: folders.map((folder) => { return folder.removeSensitiveInfo() })
        });
    }).catch((err) => {
        // database error
        res.status(500).send("Error");
    });
});

// an endpoint for accessing contents of a folder shared publicly or privately
router.get("/shared/:folderId", findAuth, findUser, getFolder, (req, res) => {
    const folder = req.folder;
    // req.user is set only if the user is logged in
    const user = req.user;

    // check if the folder is accessible by the user
    entrySharedWithUser(folder, user).then((result) => {
        if (result === true) {
            // user has access permission, fetch folder content
            Promise.all([
                File.find({ parentId: folder._id }),
                Folder.find({ parentId: folder._id })
            ]).then(([files, folders]) => {
                res.status(200).json({
                    // sensitive information removed for shared entries
                    files: files.map((file) => { return file.removeSensitiveInfo() }),
                    folders: folders.map((folder) => { return folder.removeSensitiveInfo() })
                });
            }).catch((err) => {
                // database error
                res.status(500).send("Error");
            });
        } else {
            // folder is not accessible by user
            if (user) {
                res.status(401).json({ error: "Folder is not shared with user." });
            } else {
                res.status(401).json({ error: "Folder is not shared publicly." });
            }
        }
    });
});

// an endpoint for moving entries
router.put("/move", withAuth, getUser, multer().none(), (req, res) => {
    const id = req.body.id;
    const parentId = req.body.parentId || "";
    const type = req.body.type;
    const user = req.user;

    // Select the model to use
    let entryType;
    if (type === "file") {
        entryType = File;
    } else if (type === "folder") {
        entryType = Folder;
    } else {
        res.status(400).send("Entry type not specified.");
        return;
    }

    entryType.findById(id, (err, entry) => {
        if (err) {
            // database error
            res.status(500).json({ error: "Internal error. Please try again." });
        } else if (!entry) {
            res.status(404).json({ error: "Entry not found." });
        } else {
            if (entry.userId.toString() === user._id.toString()) {
                // the entry to be moved is owned by the user
                if (parentId === "") {
                    // the new parent is the root folder
                    entry.parentId = parentId;
                    entry.save((err, entry) => {
                        if (err) {
                            // database error
                            res.status(500).json({ error: "Internal error. Please try again." });
                        } else {
                            // move succeeded
                            res.status(200).end();
                        }
                    });
                } else {
                    // find the specified parent folder
                    Folder.findOne({ _id: parentId }, (err, folder) => {
                        if (err) {
                            // database error
                            res.status(500).json({ error: "Internal error. Please try again." });
                        } else if (!folder) {
                            // specified parent folder not found
                            res.status(404).json({ error: "Folder not found." });
                        } else {
                            if (entry._id.toString() === parentId) {
                                // the user is trying to move a folder into itself
                                res.status(400).send("Cannot move a folder into itself.");
                            } else {
                                // everything is valid, do the move
                                entry.parentId = parentId;
                                entry.save((err, entry) => {
                                    if (err) {
                                        // database error
                                        res.status(500).json({ error: "Internal error. Please try again." });
                                    } else {
                                        // move succeeded
                                        res.status(200).end();
                                    }
                                });
                            }
                        }
                    });
                }
            } else {
                // the entry is not owned by the user. Reject the request
                res.status(401).send("Entry not owned by user.");
            }
        }
    });
});

// an endpoint for updating an entry's name
router.put("/:entryId", withAuth, getUser, multer().none(), (req, res) => {
    const entryId = req.params.entryId;
    const type = req.body.type;
    const newName = req.body.newName;

    if (!newName || newName === "") {
        res.status(400).send("Please provide a valid name for the entry.");
        return;
    }

    let entryType;
    if (type === "file") {
        entryType = File;
    } else if (type === "folder") {
        entryType = Folder;
    } else {
        res.status(400).end();
        return;
    }

    entryType.findById(entryId, (err, entry) => {
        if (err) {
            res.status(500).json({ error: "Internal error. Please try again." });
        } else if (!entry) {
            res.status(404).json({ error: "Entry not found." });
        } else {
            if (req.user._id.toString() === entry.userId.toString()) {
                entry.name = newName;
                entry.save();
                res.status(200).end();
            } else {
                res.status(401).send("Entry not owned by user.");
            }
        }
    });
});

// an endpoint for updating the sharing status of an entry
router.put("/:entryId/share", withAuth, getUser, multer().none(), (req, res) => {
    const entryId = req.params.entryId;
    const type = req.body.type;

    const publicShare = req.body.publicShare;
    const privateShareAdd = req.body.privateShareAdd;
    const privateShareRemove = req.body.privateShareRemove;

    let entryType;
    if (type === "file") {
        entryType = File;
    } else if (type === "folder") {
        entryType = Folder;
    } else {
        res.status(400).json({ error: "Entry type not specified." });
        return;
    }

    entryType.findById(entryId, (err, entry) => {
        if (err) {
            res.status(500).json({ error: "Internal error. Please try again." });
        } else if (!entry) {
            res.status(404).json({ error: "Entry not found." });
        } else {
            if (req.user._id.toString() === entry.userId.toString()) {
                if (publicShare && (publicShare === "true" || publicShare === "false")) {
                    entry.publicShare = publicShare;
                }
                if (privateShareAdd && typeof privateShareAdd === "string") {
                    if (!entry.privateShare.includes(privateShareAdd)) {
                        entry.privateShare.push(privateShareAdd);
                    }
                }
                if (privateShareRemove && typeof privateShareRemove === "string") {
                    entry.privateShare.pull(privateShareRemove);
                }
                entry.save();
                res.status(200).json(entry);
            } else {
                res.status(401).send("Entry not owned by user.");
            }
        }
    });
});

module.exports = router;