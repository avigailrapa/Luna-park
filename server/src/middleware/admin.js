function adminMiddleware(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'נדרשת הרשאת מנהל' });
  }
  next();
}

module.exports = adminMiddleware;
