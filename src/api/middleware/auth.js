// Simple auth middleware - placeholder for JWT authentication
function authenticateToken(req, res, next) {
  // TODO: Implement proper JWT authentication
  // For now, allow all requests to pass through
  
  const authHeader = req.headers['authorization'];
  
  // If no auth header, still allow (for development)
  // In production, you'd want to return 401 here
  if (!authHeader) {
    // For now, just continue without auth
    return next();
  }
  
  // Basic token validation placeholder
  const token = authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  // TODO: Verify JWT token here
  // For now, just attach a mock user
  req.user = { id: 'mock-user-id' };
  
  next();
}

module.exports = authenticateToken;
