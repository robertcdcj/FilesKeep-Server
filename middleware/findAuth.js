const jwt = require("jsonwebtoken");
const secret = process.env.SECRET;

const withAuth = (req, res, next) => {
    const token = req.body.token || req.query.token || req.headers["x-access-token"] || req.cookies.token;

    // authenticate user if a token is passed in
    // if no valid token is passed in, req.email will not be set
    // and the user will be treated as not logged in
    if (!token) {
        // no token provided
        next();
    } else {
        jwt.verify(token, secret, (err, decoded) => {
            if (err) {
                // verification failed
                next();
            } else {
                // verification succeeded
                req.email = decoded.email;
                next();
            }
        });
    }
};

module.exports = withAuth;
