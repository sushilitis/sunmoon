const mongoose = require('mongoose');
const { Schema } = mongoose;

const MsgSchema = new Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    },
    content: {
        type: String,
        required: true
    },
    chat: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "chat"
    },
    date: {
        type: Date,
        default: Date.now
    }
});

const Msg = mongoose.model('msg', MsgSchema);
module.exports = Msg;