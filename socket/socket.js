import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
	cors: {
		origin: ["https://chat-app-frontend-sigma-eight.vercel.app"],
		methods: ["GET", "POST"],
	},
});

const onlineUsers = {};

io.on("connection", (socket) => {
	console.log("a user connected", socket.id);

	const userId = socket.handshake.query.userId;
	if (userId != "undefined") onlineUsers[userId] = socket.id;

	io.emit("getOnlineUsers", Object.keys(onlineUsers));

	socket.on("disconnect", () => {
		console.log("user disconnected", socket.id);
		delete onlineUsers[userId];
		io.emit("getOnlineUsers", Object.keys(onlineUsers));
	});
});

export { app, io, httpServer };