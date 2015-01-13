"use strict";

var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var http = require("http");
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
	global.io.emit("chat-message", chatMessage);

	return res.status(201).send(chatMessage);
});

var server = http.createServer(app).listen(process.env.PORT || 3000).on('listening', function() {
});

global.io = require("socket.io").listen(server).sockets;
io.on("connection", function(socket) {
	socket.emit("init", {
		message: "Welcome!"
	});
});