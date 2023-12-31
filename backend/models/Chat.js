const mongoose = require('mongoose');
const { Schema } = mongoose;

const ChatSchema = new Schema({
    chatName: {
        type: String,
        required: true
    },
    users: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    }],
    latestMsg: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "msg"
    },
    date: {
        type: Date,
        default: Date.now
    }
});

const Chat = mongoose.model('chat', ChatSchema);
module.exports = Chat;