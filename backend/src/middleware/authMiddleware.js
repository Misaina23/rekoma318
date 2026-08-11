import jwt from 'jsonwebtoken'

export function requireAuth(req, res, next) {
  const auth = req.headers.authorization
  let token
  if (auth && auth.startsWith('Bearer ')) token = auth.slice(7)
  else token = req.cookies?.accessToken
  if (!token) return res.status(401).json({ success: false, error: 'Unauthorized' })
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.user = payload
    return next()
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid token' })
  }
}

export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' })
    if (req.user.role !== role && req.user.role !== 'ADMIN') return res.status(403).json({ success: false, error: 'Forbidden' })
    next()
  }
}
