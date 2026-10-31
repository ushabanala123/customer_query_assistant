const mongoose = require('mongoose')

const orderSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    customer: { type: String, required: true },
    customerId: { type: String, required: true },
    item: { type: String, required: true },
    items: [{
      productId: { type: String, default: '' },
      name: { type: String, required: true },
      quantity: { type: Number, required: true, min: 1 },
      unitPrice: { type: Number, required: true, min: 0 },
    }],
    status: { type: String, required: true, enum: ['Processing', 'Shipped', 'Delivered', 'Cancelled'] },
    eta: { type: String, default: 'Pending' },
    total: { type: String, default: '$0.00' },
  },
  { timestamps: true },
)

orderSchema.index({ customerId: 1, createdAt: -1 })

module.exports = mongoose.model('Order', orderSchema)
