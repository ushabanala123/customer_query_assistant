const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const { z } = require('zod')
const User = require('../models/User')
const Session = require('../models/Session')
const { authMiddleware } = require('../middleware/auth')
const { requireDatabase } = require('../middleware/database')
const { asyncHandler } = require('../utils/asyncHandler')
const { getJwtSecret } = require('../config/security')

const router = express.Router()
router.use(requireDatabase)

const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128),
})

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1).max(128),
})

const sanitizeUser = (user) => ({
  id: String(user._id),
  name: user.name,
  email: user.email,
  role: user.role,
})

const issueToken = async (user) => {
  const jti = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const token = jwt.sign(
    { id: String(user._id) },
    getJwtSecret(),
    { expiresIn: '7d', jwtid: jti },
  )
  await Session.create({ jti, userId: String(user._id), expiresAt })
  return token
}

router.post('/register', asyncHandler(async (req, res) => {
  const parsed = registerSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: 'Enter a name, valid email, and password with at least 8 characters.' })
  }

  const email = parsed.data.email.toLowerCase()
  if (await User.exists({ email })) {
    return res.status(409).json({ message: 'An account with this email already exists.' })
  }

  const user = await User.create({
    name: parsed.data.name,
    email,
    password: await bcrypt.hash(parsed.data.password, 12),
    role: 'customer',
    isActive: true,
  })

  return res.status(201).json({ token: await issueToken(user), user: sanitizeUser(user) })
}))

router.post('/login', asyncHandler(async (req, res) => {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: 'Enter a valid email address and password.' })
  }

  const user = await User.findOne({ email: parsed.data.email.toLowerCase() }).select('+password')
  if (!user || !user.isActive || !(await bcrypt.compare(parsed.data.password, user.password))) {
    return res.status(401).json({ message: 'Invalid email or password.' })
  }

  return res.json({ token: await issueToken(user), user: sanitizeUser(user) })
}))

router.post('/logout', authMiddleware, asyncHandler(async (req, res) => {
  await Session.deleteOne({ jti: req.user.sessionId })
  res.json({ message: 'Signed out successfully.' })
}))

router.get('/me', authMiddleware, (req, res) => {
  const { id, name, email, role } = req.user
  res.json({ user: { id, name, email, role } })
})

module.exports = router
