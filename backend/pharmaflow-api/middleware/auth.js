const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'PharmaFlowSuperSecretKey2024';

function generateToken(user) {
  return jwt.sign(
    { userId: user.user_id, username: user.username, roleId: user.role_id, roleName: user.role_name, storeId: user.store_id },
    SECRET,
    { expiresIn: '24h' }
  );
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ error: 'No token provided' });
  try {
    req.user = jwt.verify(header.split(' ')[1], SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (!roles.includes(req.user.roleName)) return res.status(403).json({ error: 'Insufficient permissions' });
    next();
  };
}

// Audit logger middleware
function auditLog(db) {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = function (body) {
      if (req.method !== 'GET' && req.user && res.statusCode < 400) {
        const action = `${req.method} ${req.baseUrl}${req.path}`;
        db.query(
          `INSERT INTO audit_log (store_id, user_id, action, entity_type, entity_id, new_value, ip_address) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [req.user.storeId || req.headers['x-store-id'], req.user.userId, action, req.baseUrl.replace('/api/', ''), req.params.id || null, JSON.stringify(body), req.ip]
        ).catch(() => {});
      }
      return originalJson(body);
    };
    next();
  };
}

module.exports = { generateToken, authMiddleware, requireRole, auditLog };
