"use strict";

var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var http = require("http").Server(app);
var io = require("socket.io")(http);
var messages = [];

var ChatMessage = function(user, text) {
	this.user = user || "Anonymous";
	this.text = text || "";
	this.timestamp = new Date();
};


// Middleware
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json());

// Routes
app.get("/messages", function(req, res) {
	return res.send(messages);
});

app.post("/messages", function(req, res) {
	var user = req.body.user;
	var text = req.body.text;

	var chatMessage = new ChatMessage(user, text);
	messages.push(chatMessage);
	io.broadcast.emit("chat-message", chatMessage);

	return res.status(201).send(chatMessage);
});

io.on("connection", function() {
});

var server = http.listen(process.env.PORT || 3000, function () {
	var host = server.address().address;
	var port = server.address().port;

  	console.log("Chat app listening at http://%s:%s", host, port);
});