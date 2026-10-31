const express = require('express')
const Product = require('../models/Product')
const Order = require('../models/Order')
const Conversation = require('../models/Conversation')
const { authMiddleware, requireAdmin } = require('../middleware/auth')
const { requireDatabase } = require('../middleware/database')
const { asyncHandler } = require('../utils/asyncHandler')

const router = express.Router()
router.use(requireDatabase, authMiddleware, requireAdmin)

router.get('/dashboard', asyncHandler(async (_req, res) => {
  const [products, activeProducts, lowStockProducts, orders, conversations, recentOrders] = await Promise.all([
    Product.countDocuments({}),
    Product.countDocuments({ isActive: true }),
    Product.countDocuments({ isActive: true, stock: { $gt: 0, $lte: 12 } }),
    Order.countDocuments({}),
    Conversation.countDocuments({}),
    Order.find({}).sort({ createdAt: -1 }).limit(5).lean(),
  ])
  return res.json({
    totalProducts: products,
    activeProducts,
    lowStockProducts,
    totalOrders: orders,
    totalConversations: conversations,
    recentOrders: recentOrders.map((order) => ({
      id: order.id,
      customer: order.customer,
      customerId: order.customerId,
      total: order.total,
      status: order.status,
      eta: order.eta,
      item: order.item,
      items: order.items || [],
    })),
  })
}))

module.exports = router
