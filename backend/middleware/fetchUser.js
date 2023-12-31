const jwt = require('jsonwebtoken');
const JWT_SECRET = "thisismysecret@key";

const fetchUser = (req, res, next) => {
    const token = req.header("auth-token");
    if (!token) {
        res.status(400).send({ error: "Please authenticate using a valid token 1." });
    }
    try {
        const data = jwt.verify(token, JWT_SECRET);
        req.user = data.user;
        next();
    } catch {
        res.status(401).send({ error: "Please authenticate using a valid token 2." });
    }
};

module.exports = fetchUser;