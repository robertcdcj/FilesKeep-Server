// libraries
require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const mongoURI = process.env.MONGO_URI;

// parsers
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

// routes files
var indexRoutes = require("./routes/index");
var folderRoutes = require("./routes/folder");
var fileRoutes = require("./routes/file");
var entryRoutes = require("./routes/entry");

// connect to mongo database
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true }, (err) => {
    if (err) {
        throw err;
    } else {
        console.log(`Successfully connected to ${mongoURI}`);
    }
})

// express settings
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use((req, res, next) => {
    // res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Origin", process.env.APP_SERVER_URL);
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
    
    next();
});
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// use the routes
app.use(indexRoutes);
app.use("/folders", folderRoutes);
app.use("/files", fileRoutes);
app.use("/entries", entryRoutes);

// start the server
app.listen(3000, () => {
    console.log("Server started.");
});