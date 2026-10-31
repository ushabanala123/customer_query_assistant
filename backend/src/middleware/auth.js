const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const User = require('../models/User')
const Session = require('../models/Session')
const { asyncHandler } = require('../utils/asyncHandler')
const { getJwtSecret } = require('../config/security')

const resolveUser = async (token, res) => {
  let decoded
  try {
    decoded = jwt.verify(token, getJwtSecret())
  } catch {
    res.status(401).json({ message: 'Invalid or expired token.' })
    return null
  }

  if (!mongoose.isValidObjectId(decoded.id) || typeof decoded.jti !== 'string') {
    res.status(401).json({ message: 'This account is unavailable. Please sign in again.' })
    return null
  }

  const user = await User.findById(decoded.id)
  if (!user || !user.isActive || !(await Session.exists({ jti: decoded.jti, userId: String(user._id) }))) {
    res.status(401).json({ message: 'This account is unavailable. Please sign in again.' })
    return null
  }

  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    sessionId: decoded.jti,
  }
}

const authMiddleware = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication token missing.' })
  }

  req.user = await resolveUser(authHeader.slice(7), res)
  if (!req.user) return
  return next()
})

const optionalAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader) return next()
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Invalid authorization header.' })
  }

  req.user = await resolveUser(authHeader.slice(7), res)
  if (!req.user) return
  return next()
})

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required.' })
  }

  return next()
}

module.exports = { authMiddleware, optionalAuth, requireAdmin }
