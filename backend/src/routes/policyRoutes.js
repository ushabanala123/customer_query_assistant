const express = require('express')
const { z } = require('zod')
const Policy = require('../models/Policy')
const { authMiddleware, optionalAuth, requireAdmin } = require('../middleware/auth')
const { requireDatabase } = require('../middleware/database')
const { asyncHandler } = require('../utils/asyncHandler')

const router = express.Router()
router.use(requireDatabase)

const policySchema = z.object({
  title: z.string().trim().min(2).max(100),
  detail: z.string().trim().min(2).max(3000),
  category: z.string().trim().min(2).max(80).optional(),
  isActive: z.boolean().optional(),
})

const serializePolicy = (policy) => ({
  id: policy.id,
  title: policy.title,
  detail: policy.detail,
  category: policy.category,
  isActive: policy.isActive,
})

router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const query = req.user?.role === 'admin' ? {} : { isActive: true }
  const policies = await Policy.find(query).sort({ title: 1 }).lean()
  return res.json(policies.map(serializePolicy))
}))

router.post('/', authMiddleware, requireAdmin, asyncHandler(async (req, res) => {
  const parsed = policySchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ message: 'Enter a policy title and description.' })
  const id = `policy-${Date.now()}`
  const policy = await Policy.create({
    ...parsed.data,
    id,
    category: parsed.data.category || 'general',
  })
  return res.status(201).json(serializePolicy(policy))
}))

const updatePolicy = asyncHandler(async (req, res) => {
  const parsed = policySchema.partial().safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ message: 'Invalid policy update.' })
  const policy = await Policy.findOneAndUpdate(
    { id: req.params.id },
    { $set: parsed.data },
    { new: true, runValidators: true },
  )
  if (!policy) return res.status(404).json({ message: 'Policy not found.' })
  return res.json(serializePolicy(policy))
})

router.patch('/:id', authMiddleware, requireAdmin, updatePolicy)
router.put('/:id', authMiddleware, requireAdmin, updatePolicy)

router.delete('/:id', authMiddleware, requireAdmin, asyncHandler(async (req, res) => {
  const policy = await Policy.findOneAndUpdate(
    { id: req.params.id },
    { $set: { isActive: false } },
    { new: true, runValidators: true },
  )
  if (!policy) return res.status(404).json({ message: 'Policy not found.' })
  return res.json(serializePolicy(policy))
}))

module.exports = router
