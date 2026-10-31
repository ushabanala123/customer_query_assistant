const mongoose = require('mongoose')

const policySchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    detail: { type: String, required: true },
    category: { type: String, default: 'general' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
)

policySchema.index({ isActive:  1, category: 1 })

module.exports = mongoose.model('Policy', policySchema)
