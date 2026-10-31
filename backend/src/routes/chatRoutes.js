const express = require('express')
const { z } = require('zod')
const Conversation = require('../models/Conversation')
const Message = require('../models/Message')
const { optionalAuth } = require('../middleware/auth')
const { requireDatabase } = require('../middleware/database')
const { asyncHandler } = require('../utils/asyncHandler')
const { generateAnswer } = require('../services/aiService')

const router = express.Router()
router.use(requireDatabase)

const chatSchema = z.object({
  question: z.string().trim().min(2).max(1000),
  conversationId: z.string().optional(),
})

router.post('/', optionalAuth, asyncHandler(async (req, res) => {
  const parsed = chatSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ message: 'A valid customer question is required.' })

  const { question, conversationId } = parsed.data
  let conversation = null
  if (conversationId && req.user) {
    conversation = await Conversation.findOne({ _id: conversationId, userId: req.user.id })
    if (!conversation) return res.status(404).json({ message: 'Conversation not found.' })
  } else if (conversationId) {
    return res.status(401).json({ message: 'Sign in to continue a saved conversation.' })
  }

  const answer = await generateAnswer(question, req.user || null)
  let savedConversationId = null
  if (req.user) {
    if (!conversation) {
      conversation = await Conversation.create({
        userId: req.user.id,
        title: question.slice(0, 120),
      })
    }

    await Message.insertMany([
      { conversationId: String(conversation._id), userId: req.user.id, sender: 'user', text: question },
      { conversationId: String(conversation._id), userId: req.user.id, sender: 'assistant', text: answer },
    ])
    conversation.lastMessageAt = new Date()
    await conversation.save()
    savedConversationId = String(conversation._id)
  }

  return res.json({
    answer,
    role: req.user ? req.user.role : 'guest',
    conversationId: savedConversationId,
  })
}))

module.exports = router
