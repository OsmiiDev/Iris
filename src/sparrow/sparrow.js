const express = require("express");
const app = express();

// stuff goes here

app.use(express.json());
app.use("/public/", express.static(__dirname + "/public"));
