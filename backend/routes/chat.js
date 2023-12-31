const express = require("express");
const fetchUser = require("../middleware/fetchUser");
const { body, validationResult } = require("express-validator");
const Chat = require("../models/Chat");
const Msg = require("../models/Msg");
const User = require("../models/User");
const router = express.Router();


// ROUTE 1: Authenticate a user using: POST "/api/chat/sendMsg" Login required
router.post("/sendMsg", fetchUser, [
    body("chatName", "Chat name cannot be blank").isLength({ min: 1 })
], async (req, res) => {
    const errors = validationResult(req);
    let success = false;
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        let { chatName, users, latestMsg } = req.body;
        let allUsers = JSON.parse(users);
        await Promise.all(allUsers.map(async (user) => {
            if (!user.hasOwnProperty('_id')) {
                let userDetails = await User.findOne({ email: user.email }).select("-password");
                let userInfo = JSON.parse(JSON.stringify(userDetails));
                if (userInfo) {
                    userInfo._id = String(userInfo._id);
                    userInfo.date = userInfo.date.toString();
                    allUsers = allUsers.filter(user => user.hasOwnProperty('_id'));
                    allUsers.push(userInfo);
                }
            }
        }));
        if (allUsers?.length) {
            const msg = new Msg({
                sender: allUsers[0]._id, content: latestMsg
            });
            const savedMsg = await msg.save();
            const allUsersId = allUsers.map(user => user._id);
            if (savedMsg) {
                let chatExist = await Chat.findOne({ users: { $all: allUsers } });
                if (chatExist) {
                    const updatedChat = await Chat.updateOne({ _id: chatExist._id }, { $set: { latestMsg: savedMsg } });

                    // Update the message with the chat reference
                    savedMsg.chat = chatExist._id;
                    await savedMsg.save();
                    res.json(updatedChat);
                } else {
                    const chat = new Chat({
                        chatName: chatName, users: allUsersId, latestMsg: savedMsg
                    });
                    const savedChat = await chat.save();
                    // Update the message with the chat reference
                    savedMsg.chat = savedChat._id;
                    await savedMsg.save();
                    res.json(savedChat);
                }
            }
        }
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal server error.");
    }
});

// ROUTE 2: Get chat for the logged in user with the current selected user using: POST "/api/chat/sendMsg" Login required
router.post("/getCurrChat", fetchUser, [
    body("receiverEmail", "Please select a valid email").exists()
], async (req, res) => {
    const errors = validationResult(req);
    let success = false;
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const user = await User.findOne({ email: req.body.receiverEmail }).select("-password");
        const senderId = req.user.id;
        if (user) {
            success = true;
            const receiverId = user._id;
            const users = [senderId, receiverId];
            let chatExist = await Chat.findOne({ users: { $all: users } });
            if (chatExist) {
                let allChats = await Msg.find({ chat: chatExist._id });
                res.json({ success, allChats });
            } else {
                res.json({ success, error: "No chat available with this user." });
            }
        } else {
            res.json({ success, error: "No chat available with this user." });
        }
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal server error.");
    }
});

// ROUTE 3: Get all chats for the logged in user using: GET "/api/chat/getChatsForLoggedInUser" Login required
router.get("/getChatsForLoggedInUser", fetchUser, async (req, res) => {
    const errors = validationResult(req);
    let success = false;
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        let chatExist = await Chat.find({ users: { $all: req.user.id } });
        if (chatExist?.length) {
            const chats = await Promise.all(
                chatExist?.map(async (chat) => {
                    const newChat = {};
                    const msg = await Msg.findOne({ _id: chat.latestMsg }).select("content");
                    if (msg) {
                        newChat.latestMsg = msg.content;
                        for (const userId of chat.users) {
                            if (userId != req.user.id) {
                                const user = await User.findOne({ _id: userId });
                                if (user) {
                                    newChat._id = user.id;
                                    newChat.name = user.name;
                                    newChat.email = user.email;
                                    newChat.pic = user.pic;
                                    return newChat;
                                }
                            }
                        }
                    }
                })
            );
            if (chats) {
                success = true;
                res.json({ success, chats });
            } else {
                res.json({ success, chats: [] });
            }
        } else {
            res.json({ success, chats: [] });
        }
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal server error.");
    }
});

module.exports = router;