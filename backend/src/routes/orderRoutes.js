const express = require('express')
const { z } = require('zod')
const Order = require('../models/Order')
const { authMiddleware, requireAdmin } = require('../middleware/auth')
const { requireDatabase } = require('../middleware/database')
const { asyncHandler } = require('../utils/asyncHandler')

const router = express.Router()
router.use(requireDatabase, authMiddleware)

const statusSchema = z.object({
  status: z.enum(['Processing', 'Shipped', 'Delivered', 'Cancelled']),
  eta: z.string().trim().max(120).optional(),
})

const serializeOrder = (order) => ({
  id: order.id,
  customer: order.customer,
  customerId: order.customerId,
  total: order.total,
  status: order.status,
  eta: order.eta,
  item: order.item,
  items: order.items || [],
})

router.get('/', asyncHandler(async (req, res) => {
  const query = req.user.role === 'admin' ? {} : { customerId: req.user.id }
  const orders = await Order.find(query).sort({ createdAt: -1 }).lean()
  return res.json(orders.map(serializeOrder))
}))

router.get('/:id', asyncHandler(async (req, res) => {
  const order = await Order.findOne({ id: req.params.id }).lean()
  if (!order) return res.status(404).json({ message: 'Order not found.' })

  if (req.user.role !== 'admin' && order.customerId !== req.user.id) {
    return res.status(403).json({ message: 'You are not permitted to view this order.' })
  }

  return res.json(serializeOrder(order))
}))

router.patch('/:id/status', requireAdmin, asyncHandler(async (req, res) => {
  const parsed = statusSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ message: 'Provide a valid order status and delivery estimate.' })

  const update = { status: parsed.data.status }
  if (parsed.data.eta !== undefined) update.eta = parsed.data.eta
  const order = await Order.findOneAndUpdate(
    { id: req.params.id },
    { $set: update },
    { new: true, runValidators: true },
  ).lean()
  if (!order) return res.status(404).json({ message: 'Order not found.' })
  return res.json(serializeOrder(order))
}))

module.exports = router
