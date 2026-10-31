const express = require('express')
const crypto = require('crypto')
const fs = require('fs/promises')
const path = require('path')
const multer = require('multer')
const { z } = require('zod')
const Product = require('../models/Product')
const { authMiddleware, optionalAuth, requireAdmin } = require('../middleware/auth')
const { requireDatabase } = require('../middleware/database')
const { asyncHandler } = require('../utils/asyncHandler')

const router = express.Router()
router.use(requireDatabase)

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.mimetype)) {
      callback(new Error('Upload a JPEG, PNG, or WebP image.'))
      return
    }

    callback(null, true)
  },
})
const uploadsDirectory = path.resolve(__dirname, '../../uploads')
const imageUrlSchema = z
  .string()
  .regex(/^\/uploads\/[a-zA-Z0-9-]+\.(jpg|png|webp)$/, 'Upload a product image first.')
  .or(z.literal(''))
  .optional()

const productSchema = z.object({
  sku: z.string().trim().min(2).max(40).optional(),
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(2000).optional(),
  category: z.string().trim().min(2).max(80),
  stock: z.number().int().nonnegative(),
  price: z.number().nonnegative(),
  badge: z.string().trim().max(40).optional(),
  imageUrl: imageUrlSchema,
  isActive: z.boolean().optional(),
})
const productUpdateSchema = productSchema.partial()

const serializeProduct = (product) => ({
  id: product.id,
  sku: product.sku,
  name: product.name,
  description: product.description || '',
  category: product.category,
  stock: product.stock,
  price: product.price,
  badge: product.badge,
  imageUrl: product.imageUrl || '',
  isActive: product.isActive,
})

const getImageType = (buffer) => {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { extension: 'jpg', mimeType: 'image/jpeg' }
  }

  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return { extension: 'png', mimeType: 'image/png' }
  }

  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return { extension: 'webp', mimeType: 'image/webp' }
  }

  return null
}

router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : ''
  if (search.length > 100) return res.status(400).json({ message: 'Search text must be 100 characters or fewer.' })

  const query = req.user?.role === 'admin' ? {} : { isActive: true }
  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    query.$or = [
      { name: { $regex: escaped, $options: 'i' } },
      { sku: { $regex: escaped, $options: 'i' } },
      { category: { $regex: escaped, $options: 'i' } },
    ]
  }

  const products = await Product.find(query).sort({ createdAt: -1 }).lean()
  return res.json(products.map(serializeProduct))
}))

router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const product = await Product.findOne({
    id: req.params.id,
    ...(req.user?.role === 'admin' ? {} : { isActive: true }),
  }).lean()
  if (!product) return res.status(404).json({ message: 'Product not found.' })
  return res.json(serializeProduct(product))
}))

router.post('/images', authMiddleware, requireAdmin, (req, res, next) => {
  upload.single('image')(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400
      res.status(status).json({
        message:
          error.code === 'LIMIT_FILE_SIZE'
            ? 'Image must be 5 MB or smaller.'
            : 'Upload one JPEG, PNG, or WebP image.',
      })
      return
    }

    if (error) {
      res.status(400).json({ message: error.message })
      return
    }

    next()
  })
}, asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Choose an image to upload.' })

  const imageType = getImageType(req.file.buffer)
  if (!imageType || imageType.mimeType !== req.file.mimetype) {
    return res.status(400).json({ message: 'The selected file is not a valid JPEG, PNG, or WebP image.' })
  }

  await fs.mkdir(uploadsDirectory, { recursive: true })
  const filename = `${crypto.randomUUID()}.${imageType.extension}`
  await fs.writeFile(path.join(uploadsDirectory, filename), req.file.buffer, { flag: 'wx' })
  return res.status(201).json({ imageUrl: `/uploads/${filename}` })
}))

router.post('/', authMiddleware, requireAdmin, asyncHandler(async (req, res) => {
  const parsed = productSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ message: 'Invalid product payload.' })

  const id = `P-${Date.now()}`
  const product = await Product.create({
    ...parsed.data,
    id,
    sku: parsed.data.sku || id,
    description: parsed.data.description || '',
    badge: parsed.data.badge || 'New',
  })
  return res.status(201).json(serializeProduct(product))
}))

const updateProduct = asyncHandler(async (req, res) => {
  const parsed = productUpdateSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ message: 'Invalid product payload.' })

  const product = await Product.findOneAndUpdate(
    { id: req.params.id },
    { $set: parsed.data },
    { new: true, runValidators: true },
  )
  if (!product) return res.status(404).json({ message: 'Product not found.' })
  return res.json(serializeProduct(product))
})

router.patch('/:id', authMiddleware, requireAdmin, updateProduct)
router.put('/:id', authMiddleware, requireAdmin, updateProduct)

router.delete('/:id', authMiddleware, requireAdmin, asyncHandler(async (req, res) => {
  const product = await Product.findOneAndUpdate(
    { id: req.params.id },
    { $set: { isActive: false } },
    { new: true, runValidators: true },
  )
  if (!product) return res.status(404).json({ message: 'Product not found.' })
  return res.json(serializeProduct(product))
}))

module.exports = router
