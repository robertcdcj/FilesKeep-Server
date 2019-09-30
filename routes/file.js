// libraries
var express = require("express");
var router = express.Router();
const fs = require('fs-extra');
const multer = require('multer');

// models
const User = require("../models/User");
const File = require("../models/File");
const Folder = require("../models/Folder");

// middlewares
const withAuth = require("../middleware/withAuth");
const getUser = require("../middleware/getUser");
const getFile = require("../middleware/getFile");
const findAuth = require("../middleware/findAuth");
const findUser = require("../middleware/findUser");

// helper
const { entrySharedWithUser } = require("../helper/helper");

router.get("/:fileId", withAuth, getUser, getFile, (req, res) => {
    const user = req.user;
    const file = req.file;

    if (fs.existsSync(`./uploads/${user._id}/${file._id}`)) {
        res.download(`./uploads/${user._id}/${file._id}`, file.name);
    } else {
        res.status(404).json({ error: "File not found." });
    }

});

router.get("/shared/:fileId", findAuth, findUser, getFile, (req, res) => {
    const file = req.file;
    const user = req.user;

    entrySharedWithUser(file, user).then((result) => {
        if (result === true) {
            res.download(`./uploads/${file.userId}/${file._id}`, file.name);
        } else {
            if (user) {
                res.status(401).json({ error: "File is not shared with user." });
            } else {
                res.status(401).json({ error: "File is not shared publicly." });
            }
        }
    });
});

router.delete("/:fileId", withAuth, getUser, getFile, (req, res) => {
    const user = req.user;
    const file = req.file;

    if (user._id.toString() === file.userId.toString()) {
        file.delete();

        fs.unlink(`./uploads/${user._id}/${file._id}`, (err) => {
            if (err) {
                res.status(404).json({ error: "File not found." });
            } else {
                res.status(200).end();
            }
        });
    } else {
        res.status(401).json({ error: "File not owned by user." });
    }
});

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const userDirectory = `./uploads/${req.user._id}`;
        if (!fs.existsSync(userDirectory)) {
            fs.mkdirSync(userDirectory);
        }

        cb(null, `uploads/${req.user._id}`);
    },
    filename: function (req, file, cb) {
        const user = req.user;

        let newFile = new File({
            name: file.originalname,
            type: "file",
            userId: user._id,
            mimeType: file.mimetype
        });
        req.newFile = newFile;
        cb(null, newFile._id.toString());
    }
})

var upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 10  // 10 MB
    }
});

router.post("/", withAuth, getUser, (req, res) => {
    const user = req.user;

    // listen to abort event
    req.on("aborted", () => {
        if (!req.newFile) {
            return;
        }

        const fileLocation = `./uploads/${user._id}/${req.newFile._id}`;
        fs.unlink(fileLocation, function (err) {
            if (err) return console.log(err);
        });
    });

    // initiate file upload process
    upload.single('file')(req, res, (err) => {
        if (err) {
            // console.log(err);
            res.status(400).end();
        } else {
            // save file size to db
            if (req.file && req.body && req.body.parentId !== null) {
                req.newFile.fileSize = req.file.size;
                req.newFile.parentId = req.body.parentId;
                req.newFile.save();

                res.status(200).end();
            } else {
                res.status(400).end();
            }
        }
    });
});

module.exports = router;