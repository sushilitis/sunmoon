const mongoose = require("mongoose");
const dotenv = require('dotenv');
const mongoURI = "mongodb://127.0.0.1:27017/SpeakIn";

// Settings For local MongoDB Compass:-

// const connectToMongo = () => {
//     mongoose.connect(mongoURI).then(() => {
//         console.log("Connected to mongo successfully.");
//     });
// }


// Settings For MongoDB Atlas:-

dotenv.config();
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(String(process.env.MONGO_URI), { // Dev - mongoURI // Prod - process.env.REACT_APP_MONGO_URI
            useNewUrlParser: true,
            useUnifiedTopology: true,
            dbName: 'SpeakIn'
        });

        console.log(`MongoDB connected on port: ${conn.connection.host}`);
    } catch (error) {
        console.log(`Error: ${error.message}`);
        process.exit();
    }
};

module.exports = connectDB;