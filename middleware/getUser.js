const User = require("../models/User");

const getUserFile = (req, res, next) => {
    const email = req.body.email || req.email;

    User.findOne({email: email}, (err, user) => {
        if (err) {
            console.error(err);
            res.status(500).json({error: "Internal error. Please try again."});
        } else if (!user) {
            res.status(400).json({error: "Incorrect email or password."});
        } else {
            req.user = user;
            next();
        }
    });
};

module.exports = getUserFile;
