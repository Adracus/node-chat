"use strict";

var express = require("express");
var request = require("request");
var _ = require("lodash");
var app = express();
var bodyParser = require("body-parser");
var http = require("http");

var maxMessages = process.env.MAX_MESSAGES || 10;
var messages = [];

String.prototype.endsWith = function(suffix) {
	return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

var ChatMessage = function(user, text, media) {
	this.user = user || "Anonymous";
	this.text = text || "";
	this.media = media || {
		images	: [],
		videos	: [],
		audios	: []
	};
	this.timestamp = new Date();
};

ChatMessage.parseMedia = function(text, cb) {
	var media = {
		images	: [],
		videos	: [],
		audios	: []
	};
	var words = text.split(" ");
	var urls = _.filter(words, isUrl);
	if (0 === urls.length) return cb(media);
	var done = _.after(urls.length, function() {
		return cb(media);
	});
	_.forEach(urls, function(url) {
		return getContentType(url, function(contentType) {
			if (isImage(contentType)) media.images.push(url);
			if (isVideo(contentType)) media.videos.push(url);
			if (isAudio(contentType)) media.audios.push(url);
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
	return /^(ftp|http|https):\/\/[^ "]+$/.test(test);
};

var isOfType = function(contentType, type, extensions) {
	if (!contentType) return false;
	return extensions.some(function(extension) {
		return contentType === (type + "/" + extension);
	});
};

var isImage = function(contentType) {
	var extensions = ["gif", "png", "jpg", "jpeg"];
	return isOfType(contentType, "image", extensions);
};

var isAudio = function(contentType) {
	var extensions = ["mpeg", "ogg", "wav"];
	return isOfType(contentType, "audio", extensions);
};

var isVideo = function(contentType) {
	var extensions = ["mp4", "webm", "ogg"];
	return isOfType(contentType, "video", extensions);
};

var getContentType = function(url, cb) {
	request.head(url).on("response", function(response) {
		var contentType = response.headers["content-type"];
		return cb(contentType);
	}).on("error", function() {
		return cb(false);
	});
};


// Middleware
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json());

app.get("/messages", function(req, res) {
	res.send(messages);
});

app.post("/messages", function(req, res) {
	var user = req.body.user;
	var text = req.body.text;

	return ChatMessage.parse(user, text, function(chatMessage) {
		if (maxMessages <= messages.length) {
			messages.splice(0, maxMessages - messages.length + 1);
		}
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