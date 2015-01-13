"use strict";

var express = require("express");
var request = require("request");
var _ = require("lodash");
var app = express();
var bodyParser = require("body-parser");
var http = require("http");
var messages = [];

String.prototype.endsWith = function(suffix) {
	return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

var ChatMessage = function(user, text, media) {
	this.user = user || "Anonymous";
	this.text = text || "";
	this.media = media || {"images": []};
	this.timestamp = new Date();
};

ChatMessage.parseMedia = function(text, cb) {
	var media = {
		"images"	: []
	};
	var words = text.split(" ");
	var urls = _.filter(words, isUrl);
	if (0 === urls.length) return cb(media);
	var done = _.after(urls.length, function() {
		return cb(media);
	});
	_.forEach(urls, function(url) {
		return isImage(url, function(res) {
			if (res) media.images.push(url);
			return done();
		});
	});
};

ChatMessage.parse = function(user, text, cb) {
	ChatMessage.parseMedia(text, function(media) {
		var chatMessage = new ChatMessage(user, text, media);
		cb(chatMessage);
	});
};

var isUrl = function(test) {
	return /^(ftp|http|https):\/\/[^ "]+$/.test(test)
};

var isImage = function(url, cb) {
	var extensions = ["gif", "png", "jpg", "jpeg"];
	request.head(url).on("response", function(response) {
		var contentType = response.headers["content-type"];
		if (!contentType) return cb(false);
		return cb(extensions.some(function(extension) {
			return contentType.endsWith(extension);
		}));
	}).on("error", function(err) {
		return cb(false);
	});
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

	return ChatMessage.parse(user, text, function(chatMessage) {
		messages.push(chatMessage);
		global.io.emit("chat-message", chatMessage);
		return res.status(201).send(chatMessage);
	});
});

var server = http.createServer(app).listen(process.env.PORT || 3000).on('listening', function() {
	console.log("Server started");
});

global.io = require("socket.io").listen(server).sockets;
io.on("connection", function(socket) {
	socket.emit("init", {
		message: "Welcome!"
	});
});