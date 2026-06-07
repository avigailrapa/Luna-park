const { verifyToken } = require('../utils/jwt');

function optionalAuth(req, _res, next) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      req.user = verifyToken(header.slice(7));
    } catch {
      req.user = null;
    }
  }
  next();
}

module.exports = optionalAuth;
