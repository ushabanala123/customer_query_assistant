const mongoose = require('mongoose')

const conversationSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
)

conversationSchema.index({ userId: 1, lastMessageAt: -1 })

module.exports = mongoose.model('Conversation', conversationSchema)
