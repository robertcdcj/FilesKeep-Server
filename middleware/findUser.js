const User = require("../models/User");

// this middleware will be used right after findAuth middleware
// if the user is not logged in, req.email will not be set and should be treated as not logged-in
const getUserFile = (req, res, next) => {
    const email = req.email;

    if (email !== null) {
        User.findOne({email: email}, (err, user) => {
            if (err) {
                // database error
                console.error(err);
                next();
            } else if (!user) {
                // user not found
                next();
            } else {
                // user found
                req.user = user;
                next();
            }
        });
    } else {
        next();
    }
    
};

module.exports = getUserFile;
