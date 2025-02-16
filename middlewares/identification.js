const jwt = require('jsonwebtoken');

exports.identifier = (req, res, next) => {
    let token;
    if (req.headers.client === 'not-browser') {
        token = req.headers.authorization;
        console.log("Token from headers.authorization:", token);
    } else {
        token = req.cookies['Authorization'];
        console.log("Token from cookies['Authorization']:", token);
        if (!token) {
            token = req.headers.authorization;
            console.log("Fallback token from headers.authorization:", token);
        }
    }

    if (!token) {
        console.log("No token provided");
        return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    try {
        const userToken = token.split(' ')[1];
        console.log("Extracted userToken:", userToken);
        const jwtVerified = jwt.verify(userToken, process.env.TOKEN_SECRET);
        if (jwtVerified) {
            console.log("Token verified successfully:", jwtVerified);
            req.user = jwtVerified;
            next();
        } else {
            throw new Error('Invalid token');
        }
    } catch (error) {
        console.log("Token verification error:", error.message);
        return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
};