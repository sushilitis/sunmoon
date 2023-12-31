const connectToMongo = require("./config/db");
const express = require('express');
const cors = require("cors");
const path = require("path");

connectToMongo();

const app = express();
const port = 5100; // Dev - 5100; // Prod - process.env.PORT

app.use(cors());
app.use(express.json());
app.use('/api/auth', require('./routes/auth'));
app.use('/api/chat', require('./routes/chat'));

// --------------------- Deployement ---------------------

const __dirname1 = path.resolve();
if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname1, "../build")));

    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname1, "../", "build", "index.html"));
    });
} else {
    app.get('/', (req, res) => {
        res.send('API is Running Successfull!');
    });
}

// --------------------- Deployement ---------------------

const server = app.listen(port, () => {
    console.log(`iChat backend listening on port ${port}`);
});

let URL;
if (process.env.REACT_APP_NODE_ENV === 'production') {
    URL = "https://ichat-rxvq.onrender.com";
} else {
    URL = "http://localhost:3000";
}
const io = require("socket.io")(server, {
    cors: {
        origin: String(process.env.NODE_APP_HOST_URL),
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

io.on("connection", (socket) => {

    // Join Socket using ID
    socket.on("setup", (roomId) => {
        if (roomId) {
            socket.join(roomId);
            const res = { to_email: roomId, isOnline: true };
            socket.broadcast.emit("user_logged_status", res);
        }
    });

    // Send notification to email
    socket.on("send_user_notification", (notification) => {
        if (notification?.to_email) {
            socket.to(notification.to_email).emit("receive_notification", notification);
        }
    });

    // Check if user is online
    socket.on("check_user_online", (res) => {
        if (res && res.from_email && res.to_email) {
            socket.to(res.to_email).emit("whats_your_status", res);
        }
    });

    // Send status received from user that the user is online
    socket.on("send_status", (res) => {
        if (res && res.from_email && res.to_email) {
            socket.to(res.from_email).emit("user_online", res);
        }
    });

    // User logged out
    socket.on("user_logged_out", (res) => {
        if (res?.to_email) {
            socket.broadcast.emit("user_logged_status", res);
        }
    });

    // User typing
    socket.on("typing", (room) => socket.in(room).emit("typing"));

    // User stopped typing
    socket.on("stop_typing", (room) => socket.in(room).emit("stop_typing"));

    // Update pic
    socket.on("updated_pic", (res) => {
        if (res) {
            socket.broadcast.emit("updated_pic", res);
        }
    });
});