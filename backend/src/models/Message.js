const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema(
  {
    conversationId: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    sender: { type: String, enum: ['user', 'assistant'], required: true },
    text: { type: String, required: true, maxlength: 5000 },
  },
  { timestamps: true },
)

messageSchema.index({ conversationId: 1, createdAt: 1 })

module.exports = mongoose.model('Message', messageSchema)
