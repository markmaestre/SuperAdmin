const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  let token = req.header('Authorization');
  if (!token) {
    console.log('No authorization header found');
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  if (token.startsWith('Bearer ')) {
    token = token.split(' ')[1];
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    
    // Normalize the user ID - handle both 'id' and 'userId'
    if (decoded.userId && !decoded.id) {
      req.user.id = decoded.userId;
    }
    
    console.log('User authenticated:', { 
      id: req.user.id, 
      userId: decoded.userId,
      email: decoded.email, 
      role: decoded.role 
    });
    next();
  } catch (err) {
    console.log('Token verification failed:', err.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = auth;