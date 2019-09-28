// libraries
var express = require("express");
var router = express.Router();

// models
const User = require("../models/User");
const File = require("../models/File");
const Folder = require("../models/Folder");

// middlewares
const withAuth = require("../middleware/withAuth");
const getUser = require("../middleware/getUser");
const getFile = require("../middleware/getFile");

router.get("/", (req, res) => {
    res.render("home");
});

/**
 * Auth endpoints
 */
router.get("/logout", (req, res) => {
    res.clearCookie("token", { httpOnly: true }).sendStatus(200);
});

router.post("/authenticate", getUser, (req, res) => {
    const password = req.body.password;
    const user = req.user;

    user.isCorrectPassword(password, (err, same) => {
        if (err) {
            res.status(500).json({ error: "Internal error. Please try again." });
        } else if (!same) {
            res.status(400).json({ error: "Incorrect email or password." });
        } else {
            user.createToken((token) => {
                res.cookie("token", token, { httpOnly: true }).sendStatus(200);
            });
        }
    });
});

router.get('/checkToken', withAuth, (req, res) => {
    res.sendStatus(200);
});

router.post("/register", (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    if (!(email && password)) {
        res.status(400).send("Please provide a valid email and password.");
        return;
    }

    const user = new User({ email, password });
    user.save((err) => {
        if (err) {
            // TODO more detailed error
            if (err.code === 11000) {
                res.status(400).send("The email has already been registered.");
            } else {
                res.status(500).send("Error");
            }
        } else {
            user.createToken((token) => {
                res.cookie("token", token, { httpOnly: true }).sendStatus(200);
            })
        }
    });
});

module.exports = router;