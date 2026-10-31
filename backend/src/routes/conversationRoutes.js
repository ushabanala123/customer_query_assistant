const express = require('express')
const mongoose = require('mongoose')
const { z } = require('zod')
const Conversation = require('../models/Conversation')
const Message = require('../models/Message')
const { authMiddleware } = require('../middleware/auth')
const { requireDatabase } = require('../middleware/database')
const { asyncHandler } = require('../utils/asyncHandler')

const router = express.Router()
router.use(requireDatabase, authMiddleware)

const getPagination = (query) => {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1)
  const limit = Math.min(50, Math.max(1, Number.parseInt(query.limit, 10) || 20))
  return { page, limit, skip: (page - 1) * limit }
}

router.get('/', asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query)
  const filter = { userId: req.user.id }
  const [items, total] = await Promise.all([
    Conversation.find(filter).sort({ lastMessageAt: -1 }).skip(skip).limit(limit).lean(),
    Conversation.countDocuments(filter),
  ])
  return res.json({
    items: items.map((item) => ({
      id: String(item._id),
      title: item.title,
      lastMessageAt: item.lastMessageAt,
    })),
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
  })
}))

router.post('/', asyncHandler(async (req, res) => {
  const parsed = z.object({ title: z.string().trim().min(1).max(120) }).safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ message: 'Enter a conversation title.' })
  const conversation = await Conversation.create({ userId: req.user.id, title: parsed.data.title })
  return res.status(201).json({
    id: String(conversation._id),
    title: conversation.title,
    lastMessageAt: conversation.lastMessageAt,
  })
}))

router.get('/:id/messages', asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Conversation not found.' })
  const conversation = await Conversation.findOne({ _id: req.params.id, userId: req.user.id }).lean()
  if (!conversation) return res.status(404).json({ message: 'Conversation not found.' })
  const messages = await Message.find({ conversationId: String(conversation._id), userId: req.user.id })
    .sort({ createdAt: 1, _id: 1 })
    .lean()
  return res.json({
    conversation: { id: String(conversation._id), title: conversation.title },
    messages: messages.map((message) => ({
      id: String(message._id),
      sender: message.sender,
      text: message.text,
      createdAt: message.createdAt,
    })),
  })
}))

router.delete('/:id', asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Conversation not found.' })
  const conversation = await Conversation.findOneAndDelete({ _id: req.params.id, userId: req.user.id })
  if (!conversation) return res.status(404).json({ message: 'Conversation not found.' })
  await Message.deleteMany({ conversationId: String(conversation._id), userId: req.user.id })
  return res.json({ message: 'Conversation deleted.' })
}))

module.exports = router
