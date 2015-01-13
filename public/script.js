"use strict";

var socket = io.connect();

var chatApp = angular.module("chat", ['ngSanitize']);

var Message = function(user, text, timestamp, media) {
	this.user = user || "Anonymous";
	this.text = text || "";
	this.timestamp = timestamp || new Date();
	this.media = media || {images: []};

	this.timestampString = function() {
		return moment(this.timestamp).fromNow();
	};

};

Message.parse = function(message) {
	var user = message.user;
	var text = message.text;
	var timestamp = message.timestamp;
	var media = message.media;

	console.log(media);
	return new Message(user, text, timestamp, media);
};

chatApp.controller("MessageListCtrl", function($scope, $http) {
	$scope.messages = [];

	var scrollDown = function() {
		setTimeout(function() {
			var height = (document.height !== undefined) ? document.height : document.body.offsetHeight;
			window.scrollBy(0, height);
		}, 100);
	};

	$http.get("/messages").success(function(messages) {
		$scope.messages = messages.map(Message.parse);
		scrollDown();
	});

	socket.on("chat-message", function(message) {
		$scope.messages.push(Message.parse(message));
		$scope.$apply(function() {
			scrollDown();
		});
	});

	$scope.send = function() {
		var text = $scope.newMessage;
		var user = $scope.user || "Anonymous";

		var message = {text: text, user: user};

		$http.post("/messages", message).success(function() {
			console.log("message successfully delivered");
		});

		$scope.newMessage = "";
	};
});

String.prototype.isUrl = function() {
	return /^(ftp|http|https):\/\/[^ "]+$/.test(this)
}

String.prototype.endsWith = function(suffix) {
	return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

String.prototype.isImage = function() {
	var self = this;
	var extensions = [".gif", ".png", ".jpg", ".jpeg"];
	return extensions.some(function(extension) {
		return self.endsWith(extension);
	});
}