const express = require("express");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const JWT_SECRET = "thisismysecret@key";
const router = express.Router();
const User = require("../models/User");
const fetchUser = require("../middleware/fetchUser");
const Msg = require("../models/Msg");
const Chat = require("../models/Chat");

// ROUTE 1: Create a user using: POST "/api/auth/createuser" Login not required
router.post("/createuser", [
    body("name", "Enter valid name").isLength({ min: 3 }),
    body("email", "Enter valid email").isEmail(),
    body("password", "Enter valid password").isLength({ min: 5 }),
    body("pic")
], async (req, res) => {
    const errors = validationResult(req);
    let success = false;
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    let user = await User.findOne({ email: req.body.email });
    if (user) {
        return res.status(400).json({ error: "Sorry a user with this email already exists." });
    }
    const salt = await bcrypt.genSalt(10);
    const securePass = await bcrypt.hash(req.body.password, salt);
    user = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: securePass,
        pic: req.body.pic
    });
    const data = {
        user: {
            id: user._id
        }
    }
    const authToken = jwt.sign(data, JWT_SECRET);
    success = true;
    res.json({ success, authToken });
});

// ROUTE 2: Authenticate a user using: POST "/api/auth/login" Login required
router.post("/login", [
    body("email", "Enter valid email").isEmail(),
    body("password", "Password cannot be blank").exists()
], async (req, res) => {
    const errors = validationResult(req);
    let success = false;
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        let user = await User.findOne({ email: req.body.email });
        if (!user) {
            return res.status(400).json({ error: "Please try to login with correct credentials." });
        }
        const { _id, name, email, pic, date } = user;
        const loggedInUser = { _id, name, email, pic, date };
        const passwordCompare = await bcrypt.compare(req.body.password, user.password);
        if (!passwordCompare) {
            return res.status(400).json({ error: "Please try to login with correct credentials." });
        }
        const data = {
            user: {
                id: user._id
            }
        };
        const authToken = jwt.sign(data, JWT_SECRET);
        success = true;
        res.json({ success, authToken, loggedInUser });
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal server error.");
    }
});

// ROUTE 3: Get all users details using: POST "/api/auth/getAllUsersDetails" Login required
router.get('/getAllUsersDetails', fetchUser, async (req, res) => {
    let success = false;
    try {
        const data = await User.find().select("-password");
        if (data?.length) {
            success = true;
            res.json({ success, data });
        } else {
            res.json({ success, data });
        }
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal server error.");
    }
});


// ROUTE 4: Delete msgs and chats collection: DELETE "/api/auth/deleteMsgsChats" No Login required
router.delete('/deleteMsgsChats', async (req, res) => {
    let success = false;
    try {
        await Chat.deleteMany({});
        success = true;

        await Msg.deleteMany({});
        success = true;
        res.json({ success, message: 'Chat and Msg collection deleted successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal server error.");
    }
});

// ROUTE 5: Update the users profile pic: PUT "/api/auth/updateProfilePic" Login required
router.put('/updateProfilePic', fetchUser, [
    body("pic").notEmpty().isString(),
], async (req, res) => {
    const errors = validationResult(req);
    let success = false;
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const user = req.user;
        const result = await User.findOneAndUpdate({ _id: user.id }, { pic: req.body.pic }).select("-password");
        if (result) {
            const updatedUser = await User.findOne({ email: result.email });
            success = true;
            res.json({ success, data: updatedUser });
        } else {
            res.json({ success, data: null });
        }
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal server error.");
    }
});

module.exports = router;