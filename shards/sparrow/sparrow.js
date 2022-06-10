const express = require("express");
const app = express();

let endpoints = [];

// registerEndpoints();

function endpointExists(){

};
app.get("/api/:version", (req, res) => {

})

app.use(express.json());
app.use("/public/", express.static(__dirname + "/public"));