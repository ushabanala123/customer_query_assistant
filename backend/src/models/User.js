const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ['customer', 'admin'],
      default: 'customer',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true, autoIndex: false },
)

userSchema.methods.toJSON = function toJSON() {
  const user = this.toObject()
  delete user.password
  return user
}

userSchema.index({ role: 1, isActive: 1 })

module.exports = mongoose.model('User', userSchema)
